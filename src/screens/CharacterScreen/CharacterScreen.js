// screens/CharacterScreen.js

import React, { useEffect, useState } from 'react';
import {
	SafeAreaView,
	ScrollView,
	View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import CharacterService from '@/services/CharacterService';
import styles from './CharacterScreen.styles';
import { useIsFocused } from '@react-navigation/native';

// Utility to format stat labels
const formatLabel = key => key
	.replace(/([A-Z])/g, ' $1')
	.replace(/^./, str => str.toUpperCase());

export default function CharacterScreen({ navigation }) {
	const [statsBase, setStatsBase] = useState({});
	const [name, setName] = useState('');
	const [equippedItems, setEquippedItems] = useState([]);
	const [dps, setDps] = useState(0);
	const [activeTab, setActiveTab] = useState('overall');
	const focused = useIsFocused();

	// Load base stats, name, and equipped items
	useEffect(() => {
		if (!focused) return;
		(async () => {
			try {
				const char = CharacterService.getCurrentCharacter();
				setName(char.name || 'Unknown Hero');
				setStatsBase(char.stats);
				const raw = await AsyncStorage.getItem('equipped_items');
				setEquippedItems(raw ? JSON.parse(raw) : []);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [focused]);

	// helper: sum base stat + all equipped items for a key
	const getStat = key => {
		const baseVal = statsBase[key] || 0;
		const equipSum = equippedItems.reduce((sum, item) => sum + (item.stats?.[key] || 0), 0);
		return baseVal + equipSum;
	};

	// recompute DPS when stats change
	useEffect(() => {
		const ap = getStat('attackPower') || 1;
		const aspeed = getStat('attackSpeed') || 0;
		const weaponDamage = Math.max(1, getStat('damage'));
		setDps(ap * aspeed * weaponDamage);
	}, [statsBase, equippedItems]);

	// Build combined stats object
	const combinedStats = { ...statsBase };
	equippedItems.forEach(item => {
		Object.entries(item.stats || {}).forEach(([key, val]) => {
			combinedStats[key] = (combinedStats[key] || 0) + val;
		});
	});
	combinedStats.damage = combinedStats.damage;
	combinedStats.DPS = dps;
	combinedStats.attackPower = combinedStats.attackPower || 1;

	// Define stat groupings
	const damageKeys = ['damage', 'attackPower', 'attackSpeed', 'critChance', 'maxDamage', 'DPS'];
	const defenseKeys = ['health', 'armor'];
	const magicKeys = ['mana', 'spellPower', 'castChance'];
	const otherKeys = ['goldStep'];

	const renderStatsSection = (title, keys, stats) => {
		if (!keys.some(key => key in stats)) return null;
		return (
			<View style={styles.sectionBlock}>
				<ThemedText style={styles.sectionTitle}>{title}</ThemedText>
				<View style={styles.statsGrid}>
					{keys.map(key => {
						if (!(key in stats)) return null;
						let display = stats[key];
						if (key === 'attackSpeed') display = `${display}/s`;
						if (key === 'critChance') display = `${display}%`;
						if (key === 'DPS') display = display.toFixed(1);
						return (
							<View key={key} style={styles.statCell}>
								<ThemedText style={styles.statLabel}>{formatLabel(key)}</ThemedText>
								<ThemedText style={styles.statValue}>{display}</ThemedText>
							</View>
						);
					})}
				</View>
			</View>
		);
	};

	const renderOverallStats = () => {
		return (
			<>
				{renderStatsSection('Damage Stats', damageKeys, combinedStats)}
				{renderStatsSection('Defense Stats', defenseKeys, combinedStats)}
				{renderStatsSection('Magic Stats', magicKeys, combinedStats)}
				{renderStatsSection('Other Stats', otherKeys, combinedStats)}
			</>
		);
	};

	const renderItemsStats = () => {
		const itemStats = {};
		equippedItems.forEach(item => {
			Object.entries(item.stats || {}).forEach(([key, val]) => {
				itemStats[key] = (itemStats[key] || 0) + val;
			});
		});
		return (
			<>
				{renderStatsSection('Damage Stats', damageKeys, itemStats)}
				{renderStatsSection('Defense Stats', defenseKeys, itemStats)}
				{renderStatsSection('Magic Stats', magicKeys, itemStats)}
				{renderStatsSection('Other Stats', otherKeys, itemStats)}
			</>
		);
	};

	const renderCharacterStats = () => {
		return (
			<>
				{renderStatsSection('Damage Stats', damageKeys, statsBase)}
				{renderStatsSection('Defense Stats', defenseKeys, statsBase)}
				{renderStatsSection('Magic Stats', magicKeys, statsBase)}
				{renderStatsSection('Other Stats', otherKeys, statsBase)}
			</>
		);
	};

	return (
		<ScreenLayout title="Character">
			<SafeAreaView style={styles.container}>
				{/* Tabs */}
				<View style={styles.tabsContainer}>
					<View
						style={[styles.tab, activeTab === 'overall' && styles.activeTab]}
						onTouchEnd={() => setActiveTab('overall')}
					>
						<ThemedText style={[styles.tabText, activeTab === 'overall' && styles.activeTabText]}>
							Overall
						</ThemedText>
					</View>
					<View
						style={[styles.tab, activeTab === 'items' && styles.activeTab]}
						onTouchEnd={() => setActiveTab('items')}
					>
						<ThemedText style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
							Items
						</ThemedText>
					</View>
					<View
						style={[styles.tab, activeTab === 'character' && styles.activeTab]}
						onTouchEnd={() => setActiveTab('character')}
					>
						<ThemedText style={[styles.tabText, activeTab === 'character' && styles.activeTabText]}>
							Character
						</ThemedText>
					</View>
				</View>

				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Avatar & Name */}
					<View style={styles.profileHeader}>
						<ThemedText style={styles.name}>{name}</ThemedText>
					</View>

					{/* Stats Sections */}
					{activeTab === 'overall' && renderOverallStats()}
					{activeTab === 'items' && renderItemsStats()}
					{activeTab === 'character' && renderCharacterStats()}
				</ScrollView>
			</SafeAreaView>
		</ScreenLayout>
	);
}
