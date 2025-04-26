// screens/StoreScreen/StoreScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	SafeAreaView,
	SectionList,
	View,
	Text,
	Button,
	Alert,
	Pressable,
	ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import styles from './StoreScreen.styles';
import ScreenLayout from '@/components/ScreenLayout';
import Item from '@/models/Item';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Static categories mapped to item names by rarity
const categories = {
	Weapons: ['Wooden Sword', 'Iron Axe', 'Bronze Dagger'],
	Shields: ['Wooden Shield', 'Iron Shield', 'Bronze Shield'],
	Armors: ['Leather Armor', 'Iron Armor', 'Emerald Armor'],
	Boots: ['Leather Boots', 'Iron Greaves', 'Steel Boots'],
	Gloves: ['Leather Gloves', 'Iron Gauntlets', 'Steel Gauntlets'],
	Helmets: ['Leather Cap', 'Iron Helmet', 'Steel Helmet'],
	Jewelry: ['Copper Ring', 'Silver Necklace', 'Golden Amulet'],
	Belts: ['Cloth Belt', 'Leather Belt', 'Iron Girdle'],
};

const sectionIcons = {
	Weapons: 'sword',
	Shields: 'shield',
	Armors: 'human',
	Boots: 'shoe-formal',
	Gloves: 'hand-back-left',
	Helmets: 'hard-hat',
	Jewelry: 'diamond',
	Belts: 'soundbar',
};

// Base price for common items
const BASE_PRICE = 1000;
// Rarity levels in order
const rarityLevels = ['common', 'uncommon', 'rare'];
// Cost multipliers by rarity index
const costMultipliers = [1, 2, 3];

// Stat pools per category
const statsPool = {
	Weapons: ['attackPower', 'attackSpeed', 'critChance', 'accuracy'],
	Shields: ['defense', 'blockChance', 'durability'],
	Armors: ['defense', 'health', 'resistance'],
	Boots: ['speed', 'evasion', 'stamina'],
	Gloves: ['critChance', 'attackSpeed', 'dexterity'],
	Helmets: ['health', 'defense', 'vision'],
	Jewelry: ['magicPower', 'mana', 'critDamage'],
	Belts: ['health', 'stamina', 'defense'],
};

// Base stat ranges (min, max)
const statRanges = {
	attackPower: [5, 15],
	attackSpeed: [1, 3],
	critChance: [1, 5],
	accuracy: [80, 100],
	defense: [5, 20],
	blockChance: [1, 5],
	durability: [50, 100],
	health: [20, 50],
	resistance: [5, 15],
	speed: [1, 5],
	evasion: [1, 5],
	stamina: [10, 30],
	dexterity: [1, 5],
	vision: [1, 3],
	magicPower: [5, 20],
	mana: [10, 30],
	critDamage: [10, 20],
};

// Roll randomized stats based on category, rarity, and quality
function rollStats(category, rarity, quality = 0) {
	const count = rarity === 'common' ? 1 : rarity === 'uncommon' ? 2 : 3;
	const pool = [...(statsPool[category] || [])];
	const chosen = [];
	while (chosen.length < count && pool.length) {
		const idx = Math.floor(Math.random() * pool.length);
		chosen.push(pool.splice(idx, 1)[0]);
	}
	return chosen.reduce((acc, stat) => {
		const [min, max] = statRanges[stat] || [1, 1];
		const base = Math.floor(Math.random() * (max - min + 1)) + min;
		const value = Math.floor(base * (1 + quality * 0.1));
		return { ...acc, [stat]: value };
	}, {});
}

export default function StoreScreen() {
	const [gold, setGold] = useState(0);
	const [sections, setSections] = useState(null);
	const [expandedItems, setExpandedItems] = useState({});

	// load current gold
	useEffect(() => {
		AsyncStorage.getItem('gold').then(g => {
			setGold(g ? parseInt(g, 10) : 0);
		});
	}, []);

	// initialize store items once
	useEffect(() => {
		const STORAGE_KEY = 'store_items';
		async function initStore() {
			let loadedSections = null;
			try {
				// await AsyncStorage.removeItem(STORAGE_KEY);
				const raw = await AsyncStorage.getItem(STORAGE_KEY);
				if (raw) {
					// parse and rehydrate
					const saved = JSON.parse(raw);
					loadedSections = saved.map(sec => ({
						title: sec.title,
						data: sec.data.map(obj => {
							const it = Item.fromJSON(obj);
							it.cost = obj.cost;
							return it;
						}),
					}));
				} else {
					// first run: generate fresh
					loadedSections = Object.entries(categories).map(([title, names]) => ({
						title,
						data: names.map((name, idx) => {
							const rarity = rarityLevels[idx];
							const cost = BASE_PRICE * costMultipliers[idx];
							const it = new Item({
								id: uuidv4(),
								name,
								category: title,
								rarity,
								quality: 0,
								stats: rollStats(title, rarity, 0),
							});
							it.cost = cost;
							return it;
						}),
					}));
					// persist
					const serial = loadedSections.map(sec => ({
						title: sec.title,
						data: sec.data.map(i => ({ ...i.toJSON(), cost: i.cost })),
					}));
					await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serial));
				}
			} catch (err) {
				console.error('Error initializing store:', err);
				// fallback: generate in-memory
				loadedSections = Object.entries(categories).map(([title, names]) => ({
					title,
					data: names.map((name, idx) => {
						const rarity = rarityLevels[idx];
						const cost = BASE_PRICE * costMultipliers[idx];
						const it = new Item({
							id: uuidv4(),
							name,
							category: title,
							rarity,
							quality: 0,
							stats: rollStats(title, rarity, 0),
						});
						it.cost = cost;
						return it;
					}),
				}));
			} finally {
				setSections(loadedSections);
			}
		}

		initStore();
	}, []);

	const handleBuy = useCallback(
		async item => {
			const cost = item.cost;
			if (gold < cost) {
				Alert.alert('Not enough gold', `You need ${cost} gold to buy ${item.name}.`);
				return;
			}
			const newGold = gold - cost;
			setGold(newGold);
			await AsyncStorage.setItem('gold', newGold.toString());

			try {
				const invStr = await AsyncStorage.getItem('inventory');
				const inv = invStr ? JSON.parse(invStr) : [];

				// ← clone the item and give it a brand‐new UUID
				const purchased = { ...item.toJSON(), id: uuidv4() };
				inv.push(purchased);

				await AsyncStorage.setItem('inventory', JSON.stringify(inv));
			} catch (e) {
				console.error('Failed to save to inventory', e);
			}

			Alert.alert('Purchase successful', `You bought ${item.name}!`);
		},
		[gold]
	);

	const toggleExpand = useCallback(id => {
		setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
	}, []);

	if (sections === null) {
		return (
			<ScreenLayout title="Store">
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			</ScreenLayout>
		);
	}

	return (
		<ScreenLayout title="Store">
			<SafeAreaView style={styles.container}>
				<SectionList
					sections={sections}
					extraData={expandedItems}
					keyExtractor={item => item.id}
					renderSectionHeader={({ section: { title } }) => (
						<View style={styles.sectionHeaderContainer}>
							<MaterialCommunityIcons
								name={sectionIcons[title]}
								size={20}
								color={colors.text}
								style={styles.sectionIcon}
							/>
							<Text style={styles.sectionHeader}>{title}</Text>
						</View>
					)}
					renderItem={({ item }) => (
						<View>
							<Pressable
								onPressIn={() => toggleExpand(item.id)}
								delayPressIn={0}
								style={({ pressed }) => [
									styles.shopItem,
									pressed && styles.shopItemPressed,
								]}
							>
								<Text
									style={[
										styles.itemText,
										{ color: colors[item.rarity] || colors.text },
									]}
								>
									{item.name}
								</Text>
							</Pressable>
							{expandedItems[item.id] && (
								<View style={styles.statsContainer}>
									{Object.entries(item.stats).map(([stat, val]) => (
										<Text key={stat} style={styles.statText}>
											{stat}: {val}
										</Text>
									))}
									<Button
										title={`Buy (${item.cost})`}
										onPress={() => handleBuy(item)}
										disabled={gold < item.cost}
									/>
								</View>
							)}
						</View>
					)}
					contentContainerStyle={styles.listContent}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
