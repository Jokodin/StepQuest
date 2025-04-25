// screens/InventoryScreen/InventoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	SectionList,
	TouchableOpacity,
	SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import styles from './InventoryScreen.styles';
import { colors } from '@/constants/theme';
import ScreenLayout from '@/components/ScreenLayout';

const categories = [
	'Weapons',
	'Shields',
	'Armors',
	'Boots',
	'Gloves',
	'Helmets',
	'Jewelry',
	'Belts',
];

// Keywords to classify items into those categories
const categoryKeywords = {
	Weapons: ['sword'],
	Shields: ['shield'],
	Armors: ['armor'],
	Boots: ['boot'],
	Gloves: ['glove'],
	Helmets: ['helmet'],
	Jewelry: ['jewel', 'ring', 'amulet', 'necklace'],
	Belts: ['belt'],
};

export default function InventoryScreen() {
	const isFocused = useIsFocused();

	const [tab, setTab] = useState('Inventory');       // or 'Equipped'
	const [inventory, setInventory] = useState([]);    // raw list
	const [equipped, setEquipped] = useState({});      // { category: itemName }
	const [banner, setBanner] = useState('');

	// Load inventory + equips
	const loadData = useCallback(async () => {
		const invRaw = await AsyncStorage.getItem('inventory');
		const inv = invRaw ? JSON.parse(invRaw) : [];
		setInventory(inv.filter(i => i !== 'unopened'));

		const eqMap = {};
		await Promise.all(categories.map(async cat => {
			const key = `equipped_${cat.toLowerCase()}`;
			const val = await AsyncStorage.getItem(key);
			if (val) eqMap[cat] = val;
		}));
		setEquipped(eqMap);
	}, []);

	useEffect(() => {
		if (isFocused) loadData();
	}, [isFocused, loadData]);

	// Banner helper
	const showBanner = msg => {
		setBanner(msg);
		setTimeout(() => setBanner(''), 2500);
	};

	// Equip or switch
	const handleEquip = async (cat, item) => {
		const key = `equipped_${cat.toLowerCase()}`;
		await AsyncStorage.setItem(key, item);
		setEquipped(prev => ({ ...prev, [cat]: item }));
		showBanner(`${item} equipped`);
	};

	// Unequip slot
	const handleUnequip = async (cat) => {
		const item = equipped[cat];                     // grab the currently equipped item
		if (!item) return;                              // nothing to do if empty
		const key = `equipped_${cat.toLowerCase()}`;
		await AsyncStorage.removeItem(key);
		setEquipped(prev => ({ ...prev, [cat]: null }));
		showBanner(`${item} unequipped`);              // new banner text
	};

	// Build sections for Inventory tab
	const sections = categories.map(cat => {
		// count occurrences
		const counts = {};
		inventory.forEach(it => {
			const lower = it.toLowerCase();
			// category match
			const kws = categoryKeywords[cat];
			if (!kws.some(k => lower.includes(k))) return;
			// skip if it's currently equipped
			if (equipped[cat] === it) return;
			counts[it] = (counts[it] || 0) + 1;
		});
		const data = Object.entries(counts).map(([name, count]) => ({ name, count }));
		return { title: cat, data };
	});

	// Render one inventory item
	const renderInventoryItem = ({ item, section }) => {
		return (
			<TouchableOpacity
				style={[styles.itemContainer, { borderColor: colors.text }]}
				onPress={() => handleEquip(section.title, item.name)}
			>
				<Text style={styles.itemText}>
					{item.name}{item.count > 1 ? ` x${item.count}` : ''}
				</Text>
			</TouchableOpacity>
		);
	};

	// Render Equipped tab
	const renderEquippedTab = () => (
		<View style={styles.equippedContainer}>
			{categories.map(cat => (
				<View key={cat} style={styles.slot}>
					<Text style={styles.slotLabel}>{cat}</Text>
					<TouchableOpacity
						style={[
							styles.slotItemContainer,
							{ borderColor: colors.text }
						]}
						onPress={() => equipped[cat] && handleUnequip(cat)}
					>
						<Text style={styles.slotItemText}>
							{equipped[cat] || '[empty]'}
						</Text>
					</TouchableOpacity>
				</View>
			))}
		</View>
	);

	return (
		<ScreenLayout title="Items">
			<SafeAreaView style={styles.container}>
				{/* Tabs */}
				<View style={styles.tabs}>
					{['Inventory', 'Equipped'].map(t => (
						<TouchableOpacity
							key={t}
							style={[
								styles.tab,
								tab === t && styles.tabActive
							]}
							onPress={() => setTab(t)}
						>
							<Text style={styles.tabText}>{t}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Content */}
				{tab === 'Inventory' ? (
					<SectionList
						sections={sections}
						keyExtractor={(item, idx) => item.name + idx}
						renderItem={renderInventoryItem}
						renderSectionHeader={({ section: { title, data } }) =>
							data.length > 0 && <Text style={styles.sectionHeader}>{title}</Text>
						}
						contentContainerStyle={styles.listContent}
					/>
				) : (
					renderEquippedTab()
				)}

				{/* Banner */}
				{banner ? (
					<View style={styles.banner}>
						<Text style={styles.bannerText}>{banner}</Text>
					</View>
				) : null}
			</SafeAreaView>
		</ScreenLayout>
	);
}
