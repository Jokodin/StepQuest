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
	combinedStats.damage = Math.max(1, combinedStats.damage || 0);
	combinedStats.DPS = dps;
	combinedStats.attackPower = combinedStats.attackPower || 1;

	// Define stat groupings
	const damageKeys = ['damage', 'attackPower', 'attackSpeed', 'critChance', 'maxDamage', 'DPS'];
	const defenseKeys = ['health', 'armor'];
	const magicKeys = ['mana', 'spellPower', 'castChance'];
	const otherKeys = ['goldStep'];

	return (
		<ScreenLayout title="Character">
			<SafeAreaView style={styles.container}>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Avatar & Name */}
					<View style={styles.profileHeader}>
						<ThemedText style={styles.name}>{name}</ThemedText>
					</View>

					{/* Damage Stats Section */}
					{damageKeys.some(key => key in combinedStats) && (
						<View style={styles.sectionBlock}>
							<ThemedText style={styles.sectionTitle}>Damage Stats</ThemedText>
							<View style={styles.statsGrid}>
								{damageKeys.map(key => {
									if (!(key in combinedStats)) return null;
									let display = combinedStats[key];
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
					)}

					{/* Defense Stats Section */}
					{defenseKeys.some(key => key in combinedStats) && (
						<View style={styles.sectionBlock}>
							<ThemedText style={styles.sectionTitle}>Defense Stats</ThemedText>
							<View style={styles.statsGrid}>
								{defenseKeys.map(key => {
									if (!(key in combinedStats)) return null;
									return (
										<View key={key} style={styles.statCell}>
											<ThemedText style={styles.statLabel}>{formatLabel(key)}</ThemedText>
											<ThemedText style={styles.statValue}>{combinedStats[key]}</ThemedText>
										</View>
									);
								})}
							</View>
						</View>
					)}

					{/* Magic Stats Section */}
					{magicKeys.some(key => key in combinedStats) && (
						<View style={styles.sectionBlock}>
							<ThemedText style={styles.sectionTitle}>Magic Stats</ThemedText>
							<View style={styles.statsGrid}>
								{magicKeys.map(key => {
									if (!(key in combinedStats)) return null;
									return (
										<View key={key} style={styles.statCell}>
											<ThemedText style={styles.statLabel}>{formatLabel(key)}</ThemedText>
											<ThemedText style={styles.statValue}>{combinedStats[key]}</ThemedText>
										</View>
									);
								})}
							</View>
						</View>
					)}

					{/* Other Stats Section */}
					{otherKeys.some(key => key in combinedStats) && (
						<View style={styles.sectionBlock}>
							<ThemedText style={styles.sectionTitle}>Other Stats</ThemedText>
							<View style={styles.statsGrid}>
								{otherKeys.map(key => {
									if (!(key in combinedStats)) return null;
									return (
										<View key={key} style={styles.statCell}>
											<ThemedText style={styles.statLabel}>{formatLabel(key)}</ThemedText>
											<ThemedText style={styles.statValue}>{combinedStats[key]}</ThemedText>
										</View>
									);
								})}
							</View>
						</View>
					)}
				</ScrollView>
			</SafeAreaView>
		</ScreenLayout>
	);
}
