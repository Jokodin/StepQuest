// screens/InventoryScreen/InventoryScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, SectionList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './InventoryScreen.styles';

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

export default function InventoryScreen({ navigation }) {
	const [sections, setSections] = useState([]);
	const [equippedSword, setEquippedSword] = useState(null);
	const [equippedArmor, setEquippedArmor] = useState(null);
	const [swordCount, setSwordCount] = useState({});
	const [armorCount, setArmorCount] = useState({});
	const [unopenedCount, setUnopenedCount] = useState(0);

	useEffect(() => {
		loadInventory();
	}, []);

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

		const swordEq = await AsyncStorage.getItem('equipped_sword');
		const armorEq = await AsyncStorage.getItem('equipped_armor');

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

	// Combine two items into one of next rarity
	const combineItem = async (item) => {
		const [rarity, type] = item.split(' ');
		const idx = rarityOrder.indexOf(rarity);
		if (idx < 0 || idx >= rarityOrder.length - 1) return;
		const count = (type === 'sword' ? swordCount[item] : armorCount[item]);
		if (count < 2) {
			Alert.alert('Need at least 2 items to combine');
			return;
		}
		const successRates = { common: 0.9, uncommon: 0.7, rare: 0.5 };
		const rate = successRates[rarity] || 0;
		const success = Math.random() < rate;
		// Remove 2 instances
		const invStr = await AsyncStorage.getItem('inventory');
		const inv = invStr ? JSON.parse(invStr) : [];
		let removed = 0;
		const newInv = inv.filter(i => {
			if (i === item && removed < 2) {
				removed++;
				return false;
			}
			return true;
		});
		if (success) {
			const newRarity = rarityOrder[idx + 1];
			newInv.push(`${newRarity} ${type}`);
			Alert.alert('Combine succeeded!', `New item: ${newRarity} ${type}`);
		} else {
			Alert.alert('Combine failed', `${item} lost`);
		}
		await AsyncStorage.setItem('inventory', JSON.stringify(newInv));
		loadInventory();
	};

	const openRewards = () => navigation.navigate('Rewards');

	const equipItem = async (item, sectionTitle) => {
		const type = sectionTitle === 'Swords' ? 'sword' : 'armor';
		await AsyncStorage.setItem(`equipped_${type}`, item);
		if (type === 'sword') setEquippedSword(item);
		else setEquippedArmor(item);
	};

	return (
		<View style={styles.container}>
			{/* Equipped Slots */}
			<View style={styles.equippedContainer}>
				<View style={[styles.slot, { borderColor: getRarityColor(equippedSword) }]}>
					<Text style={styles.slotLabel}>Sword</Text>
					<Text style={styles.slotItem}>{equippedSword || 'None'}</Text>
				</View>
				<View style={[styles.slot, { borderColor: getRarityColor(equippedArmor) }]}>
					<Text style={styles.slotLabel}>Armor</Text>
					<Text style={styles.slotItem}>{equippedArmor || 'None'}</Text>
				</View>
			</View>

			{/* Inventory Sections */}
			<SectionList
				sections={sections}
				keyExtractor={(item, idx) => item + idx}
				renderSectionHeader={({ section: { title } }) => (
					<Text style={styles.sectionHeader}>{title}</Text>
				)}
				renderItem={({ item, section }) => {
					const isSwordSection = section.title === 'Swords';
					const count = isSwordSection ? swordCount[item] : armorCount[item];
					const isEquipped = item === (isSwordSection ? equippedSword : equippedArmor);
					const canCombine = count >= 2 && rarityOrder.indexOf(item.split(' ')[0]) < rarityOrder.length - 1;
					return (
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<TouchableOpacity onPress={() => equipItem(item, section.title)} style={{ flex: 1 }}>
								<View style={[styles.itemContainer, { borderColor: getRarityColor(item) }]}>
									<Text style={styles.itemText}>{item}{count > 1 ? ` x${count}` : ''}</Text>
									{isEquipped && <Text style={styles.check}>✅</Text>}
								</View>
							</TouchableOpacity>
							{canCombine && (
								<View style={styles.combineButtonContainer}>
									<Button title="🔨" onPress={() => combineItem(item)} />
								</View>
							)}
						</View>
					);
				}}
				contentContainerStyle={styles.listContent}
			/>

			{/* Rewards Button */}
			<View style={styles.rewardsContainer}>
				<Text style={styles.rewardsText}>Unopened Rewards: {unopenedCount}</Text>
				<Button title="Open Rewards" onPress={openRewards} />
			</View>
		</View>
	);
}
