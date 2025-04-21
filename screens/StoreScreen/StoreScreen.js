// screens/StoreScreen/StoreScreen.js

import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Button,
	SectionList,
	TouchableOpacity,
	Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './StoreScreen.styles';

const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];

// Helper to pick rarity color
const getRarityColor = (item) => {
	const rarity = item?.split(' ')[0];
	switch (rarity) {
		case 'legendary':
			return '#FFD700';
		case 'rare':
			return '#6495ED';
		case 'uncommon':
			return '#32CD32';
		default:
			return '#777';
	}
};

// Items available in the shop
const shopItems = [
	{ id: 'shop-sword-common', name: 'Common Sword', type: 'sword', rarity: 'common', price: 1000 },
	{ id: 'shop-armor-common', name: 'Common Armor', type: 'armor', rarity: 'common', price: 1000 },
];

export default function StoreScreen({ navigation }) {
	const [gold, setGold] = useState(0);
	const [sections, setSections] = useState([]);
	const [equippedSword, setEquippedSword] = useState(null);
	const [equippedArmor, setEquippedArmor] = useState(null);
	const [swordCount, setSwordCount] = useState({});
	const [armorCount, setArmorCount] = useState({});

	// Load persisted data on mount
	useEffect(() => {
		async function loadData() {
			try {
				const [
					savedGold,
					savedSwordCount,
					savedArmorCount,
					savedEquippedSword,
					savedEquippedArmor,
				] = await Promise.all([
					AsyncStorage.getItem('gold'),
					AsyncStorage.getItem('swordCount'),
					AsyncStorage.getItem('armorCount'),
					AsyncStorage.getItem('equippedSword'),
					AsyncStorage.getItem('equippedArmor'),
				]);

				setGold(savedGold ? parseInt(savedGold, 10) : 0);
				setSwordCount(savedSwordCount ? JSON.parse(savedSwordCount) : {});
				setArmorCount(savedArmorCount ? JSON.parse(savedArmorCount) : {});
				setEquippedSword(savedEquippedSword || null);
				setEquippedArmor(savedEquippedArmor || null);
			} catch (e) {
				console.error('Failed to load store data', e);
			}
		}

		loadData();
	}, []);

	// Whenever counts or gold change, rebuild sections and persist counts/gold
	useEffect(() => {
		buildSections();
		AsyncStorage.setItem('gold', gold.toString());
		AsyncStorage.setItem('swordCount', JSON.stringify(swordCount));
		AsyncStorage.setItem('armorCount', JSON.stringify(armorCount));
	}, [gold, swordCount, armorCount]);

	const buildSections = () => {
		const items = [];

		// Build sword entries
		Object.entries(swordCount).forEach(([itemName, count]) => {
			if (count > 0) items.push({ name: itemName, count, type: 'sword' });
		});

		// Build armor entries
		Object.entries(armorCount).forEach(([itemName, count]) => {
			if (count > 0) items.push({ name: itemName, count, type: 'armor' });
		});

		// Group by rarity
		const grouped = rarityOrder
			.map((rarityKey) => {
				const data = items
					.filter((it) => it.name.toLowerCase().startsWith(rarityKey))
					.map((it) => ({
						...it,
						color: getRarityColor(it.name),
					}));
				return { title: rarityKey.charAt(0).toUpperCase() + rarityKey.slice(1), data };
			})
			.filter((section) => section.data.length > 0);

		setSections(grouped);
	};

	const handleEquip = async (item) => {
		if (item.type === 'sword') {
			setEquippedSword(item.name);
			await AsyncStorage.setItem('equippedSword', item.name);
		} else if (item.type === 'armor') {
			setEquippedArmor(item.name);
			await AsyncStorage.setItem('equippedArmor', item.name);
		}
	};

	const handleBuy = async (shopItem) => {
		if (gold < shopItem.price) {
			Alert.alert(
				'Not enough gold',
				`You need ${shopItem.price} gold to buy ${shopItem.name}.`
			);
			return;
		}

		// Deduct gold and update counts
		const newGold = gold - shopItem.price;
		setGold(newGold);

		if (shopItem.type === 'sword') {
			const newCounts = { ...swordCount };
			newCounts[shopItem.name] = (newCounts[shopItem.name] || 0) + 1;
			setSwordCount(newCounts);
		} else {
			const newCounts = { ...armorCount };
			newCounts[shopItem.name] = (newCounts[shopItem.name] || 0) + 1;
			setArmorCount(newCounts);
		}

		// Save purchase into inventory array
		try {
			const invStr = await AsyncStorage.getItem('inventory');
			const inv = invStr ? JSON.parse(invStr) : [];
			inv.push(shopItem.name);
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));
		} catch (e) {
			console.error('Failed to save purchase to inventory', e);
		}

		Alert.alert('Purchase successful', `You bought 1 ${shopItem.name}!`);
	};

	return (
		<View style={styles.container}>
			{/* Shop Section */}
			<View style={styles.section}>
				<Text style={styles.sectionHeader}>Shop</Text>
				{shopItems.map((item) => (
					<View key={item.id} style={styles.shopItem}>
						<Text style={styles.itemText}>
							{item.name} — {item.price} gold
						</Text>
						<Button title="Buy" onPress={() => handleBuy(item)} />
					</View>
				))}
				<Text style={styles.goldText}>Gold: {gold}</Text>
			</View>
		</View>
	);
}
