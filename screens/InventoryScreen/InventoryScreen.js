// screens/InventoryScreen/InventoryScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, Button, SectionList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './InventoryScreen.styles';
import { useIsFocused } from '@react-navigation/native';

const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];

// Helper to pick rarity color
const getRarityColor = (item) => {
	const rarity = item?.split(' ')[0];
	switch (rarity) {
		case 'legendary': return '#FFD700';
		case 'rare': return '#6495ED';
		case 'uncommon': return '#32CD32';
		default: return '#777';
	}
};

// Helper to compute rarity level (1 = common, 2 = uncommon, etc.)
const getRarityLevel = (item) => {
	if (!item) return 0;
	// normalize to lowercase so "Common Sword" works
	const rarity = item.split(' ')[0].toLowerCase();
	const idx = rarityOrder.indexOf(rarity);
	return idx >= 0 ? idx + 1 : 0;
};

export default function InventoryScreen({ navigation }) {
	// Initialize with empty sword and armor sections so .data always exists
	const [sections, setSections] = useState([
		{ title: 'Swords', data: [] },
		{ title: 'Armors', data: [] }
	]);
	const [equippedSword, setEquippedSword] = useState(null);
	const [equippedArmor, setEquippedArmor] = useState(null);
	const [swordCount, setSwordCount] = useState({});
	const [armorCount, setArmorCount] = useState({});
	const [unopenedCount, setUnopenedCount] = useState(0);
	const [statsCollapsed, setStatsCollapsed] = useState(true);
	const isFocused = useIsFocused();

	useEffect(() => {
		if (isFocused) loadInventory();
	}, [isFocused]);

	const loadInventory = async () => {
		const invStr = await AsyncStorage.getItem('inventory');
		const inv = invStr ? JSON.parse(invStr) : [];

		const opened = inv.filter(i => i !== 'unopened');
		const swordsArr = opened.filter(i => i.toLowerCase().includes('sword'));
		const armorArr = opened.filter(i => i.toLowerCase().includes('armor'));
		const swordsMap = {};
		const armorMap = {};
		swordsArr.forEach(i => { swordsMap[i] = (swordsMap[i] || 0) + 1; });
		armorArr.forEach(i => { armorMap[i] = (armorMap[i] || 0) + 1; });

		const swordEq = await AsyncStorage.getItem('equipped_sword');
		const armorEq = await AsyncStorage.getItem('equipped_armor');

		// Remove one equipped instance from counts
		if (swordEq && swordsMap[swordEq]) {
			swordsMap[swordEq] -= 1;
			if (swordsMap[swordEq] === 0) delete swordsMap[swordEq];
		}
		if (armorEq && armorMap[armorEq]) {
			armorMap[armorEq] -= 1;
			if (armorMap[armorEq] === 0) delete armorMap[armorEq];
		}

		const swordsUnique = Object.keys(swordsMap).sort((a, b) => {
			const ra = rarityOrder.indexOf(a.split(' ')[0]);
			const rb = rarityOrder.indexOf(b.split(' ')[0]);
			if (ra !== rb) return ra - rb;
			return a.localeCompare(b, 'en', { sensitivity: 'base' });
		});
		const armorsUnique = Object.keys(armorMap).sort((a, b) => {
			const ra = rarityOrder.indexOf(a.split(' ')[0]);
			const rb = rarityOrder.indexOf(b.split(' ')[0]);
			if (ra !== rb) return ra - rb;
			return a.localeCompare(b, 'en', { sensitivity: 'base' });
		});

		setEquippedSword(swordEq);
		setEquippedArmor(armorEq);
		setSwordCount(swordsMap);
		setArmorCount(armorMap);
		setSections([
			{ title: 'Swords', data: swordsUnique },
			{ title: 'Armors', data: armorsUnique }
		]);
		setUnopenedCount(inv.filter(i => i === 'unopened').length);
	};

	// Equip / unequip handlers
	const equipItem = async (item, sectionTitle) => {
		const type = sectionTitle === 'Swords' ? 'sword' : 'armor';
		await AsyncStorage.setItem(`equipped_${type}`, item);
		if (type === 'sword') setEquippedSword(item);
		else setEquippedArmor(item);
		loadInventory();
	};
	const unequipSword = async () => {
		await AsyncStorage.removeItem('equipped_sword');
		setEquippedSword(null);
		loadInventory();
	};
	const unequipArmor = async () => {
		await AsyncStorage.removeItem('equipped_armor');
		setEquippedArmor(null);
		loadInventory();
	};

	const openRewards = () => navigation.navigate('Rewards');

	// Debug: clear all inventory
	const clearInventory = async () => {
		await AsyncStorage.removeItem('inventory');
		await AsyncStorage.removeItem('equipped_sword');
		await AsyncStorage.removeItem('equipped_armor');
		setEquippedSword(null);
		setEquippedArmor(null);
		loadInventory();
	};

	const renderItem = ({ item, section }) => {
		const isSwordSection = section.title === 'Swords';
		const count = isSwordSection ? swordCount[item] : armorCount[item];
		return (
			<TouchableOpacity onPress={() => equipItem(item, section.title)}>
				<View style={[styles.itemContainer, { borderColor: getRarityColor(item) }]}>
					<Text style={styles.itemText}>
						{item}{count > 1 ? ` x${count}` : ''}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			{/* Character Stat Block (collapsible) */}
			<View style={styles.statBlockContainer}>
				<TouchableOpacity onPress={() => setStatsCollapsed(!statsCollapsed)}>
					<Text style={styles.statBlockHeader}>
						Character Stats {statsCollapsed ? '+' : '-'}
					</Text>
				</TouchableOpacity>
				{!statsCollapsed && (
					<View style={styles.stats}>
						<Text style={styles.statsText}>Damage: {getRarityLevel(equippedSword) * 10}</Text>
						<Text style={styles.statsText}>Armor Mitigation: {getRarityLevel(equippedArmor)}</Text>
					</View>
				)}
			</View>

			{/* Equipped Slots (tap to unequip) */}
			<View style={styles.equippedContainer}>
				<TouchableOpacity
					onPress={unequipSword}
					style={[styles.slot, { borderColor: getRarityColor(equippedSword) }]}
				>
					<Text style={styles.slotLabel}>Sword</Text>
					<Text style={styles.slotItem}>{equippedSword || 'None'}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={unequipArmor}
					style={[styles.slot, { borderColor: getRarityColor(equippedArmor) }]}
				>
					<Text style={styles.slotLabel}>Armor</Text>
					<Text style={styles.slotItem}>{equippedArmor || 'None'}</Text>
				</TouchableOpacity>
			</View>

			{/* Inventory Sections side by side */}
			<View style={{ flexDirection: 'row', flex: 1 }}>
				{/* Swords list */}
				<View style={{ flex: 1 }}>
					<Text style={styles.sectionHeader}>Swords</Text>
					<SectionList
						sections={[sections[0]]}
						keyExtractor={(item, idx) => item + idx}
						renderItem={renderItem}
						contentContainerStyle={styles.listContent}
					/>
				</View>

				{/* Armors list */}
				<View style={{ flex: 1 }}>
					<Text style={styles.sectionHeader}>Armors</Text>
					<SectionList
						sections={[sections[1]]}
						keyExtractor={(item, idx) => item + idx}
						renderItem={renderItem}
						contentContainerStyle={styles.listContent}
					/>
				</View>
			</View>

			{/* Rewards Button */}
			<View style={styles.rewardsContainer}>
				<Text style={styles.rewardsText}>Unopened Items: {unopenedCount}</Text>
				<Button title="Open Items" onPress={openRewards} />
			</View>

			{/* Debug: Clear Inventory button bottom-left */}
			<View style={{ position: 'absolute', left: 10, bottom: 10 }}>
				<Button title="Clear Inventory" onPress={clearInventory} />
			</View>
		</View>
	);
}
