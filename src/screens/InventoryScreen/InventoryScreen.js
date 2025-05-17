// screens/InventoryScreen/InventoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	SafeAreaView,
	Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import styles from './InventoryScreen.styles';
import { colors } from '@/constants/theme';
import ScreenLayout from '@/components/ScreenLayout';
import Item from '@/models/Item';
import { itemTypes } from '@/services/ItemService';
import CharacterService from '@/services/CharacterService';

// Map item types to their corresponding icons
const itemIcons = {
	weapon: 'restaurant',
	armor: 'restaurant',
	gloves: 'restaurant',
	amulet: 'restaurant',
};

// Map stat names to their display aliases
const statAliases = {
	damage: 'DMG',
	health: 'HP',
	armor: 'ARM',
	attackSpeed: 'ASPD',
	attackPower: 'ATK',
	vitality: 'VIT',
	castSpeed: 'CSPD',
	mana: 'MP',
	willpower: 'WIL',
};

export default function InventoryScreen() {
	const isFocused = useIsFocused();
	const [tab, setTab] = useState('Inventory');
	const [inventory, setInventory] = useState([]);        // all items
	const [equippedItems, setEquippedItems] = useState([]); // items currently equipped
	const [expanded, setExpanded] = useState({});          // expansion state per item
	const [banner, setBanner] = useState('');

	// Load inventory and equipped items
	const loadData = useCallback(async () => {
		const invRaw = await AsyncStorage.getItem('inventory');
		const invArr = invRaw ? JSON.parse(invRaw) : [];
		setInventory(invArr);

		const eqRaw = await AsyncStorage.getItem('equipped_items');
		const eqArr = eqRaw ? JSON.parse(eqRaw) : [];
		setEquippedItems(eqArr);
	}, []);

	useEffect(() => {
		if (isFocused) loadData();
	}, [isFocused, loadData]);

	// Banner helper
	const showBanner = msg => {
		setBanner(msg);
		setTimeout(() => setBanner(''), 2500);
	};

	// Equip an item (add to equippedItems)
	const handleEquip = async item => {
		try {
			// Add to equipped items list
			const newEquipped = [...equippedItems, item];
			await AsyncStorage.setItem(
				'equipped_items',
				JSON.stringify(newEquipped)
			);
			setEquippedItems(newEquipped);
			showBanner(`${item.name} equipped`);
		} catch (error) {
			console.error('Error equipping item:', error);
			showBanner('Failed to equip item');
		}
	};

	// Unequip an item (remove by id)
	const handleUnequip = async item => {
		try {
			const newEquipped = equippedItems.filter(eq => eq.id !== item.id);
			await AsyncStorage.setItem(
				'equipped_items',
				JSON.stringify(newEquipped)
			);
			setEquippedItems(newEquipped);
			showBanner(`${item.name} unequipped`);
		} catch (error) {
			console.error('Error unequipping item:', error);
			showBanner('Failed to unequip item');
		}
	};

	const toggleExpand = itemId => {
		setExpanded(prev => ({ ...prev, [itemId]: !prev[itemId] }));
	};

	// Show equip/unequip dialog
	const showEquipDialog = item => {
		const action = tab === 'Inventory' ? 'Equip' : 'Unequip';
		Alert.alert(
			`${action} Item`,
			`Do you want to ${action.toLowerCase()} ${item.name}?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: action,
					onPress: () => tab === 'Inventory' ? handleEquip(item) : handleUnequip(item),
				},
			]
		);
	};

	// Sections for Inventory tab: items not equipped
	const inventorySections = itemTypes.map(cat => ({
		title: cat,
		data: inventory
			.filter(it => it && it.type === cat && !equippedItems.some(eq => eq && eq.id === it.id))
			.sort((a, b) => {
				// Define rarity order (highest to lowest)
				const rarityOrder = {
					'legendary': 4,
					'epic': 3,
					'rare': 2,
					'uncommon': 1,
					'common': 0
				};
				// Sort by rarity first (descending)
				const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
				// If same rarity, sort by quality (descending)
				return rarityDiff !== 0 ? rarityDiff : b.quality - a.quality;
			}),
	}));

	// Sections for Equipped tab: grouped by category
	const equippedSections = itemTypes.map(cat => ({
		title: cat,
		data: equippedItems.filter(eq => eq && eq.type === cat),
	}));

	// Flatten sections for FlatList
	const getInventoryData = () => {
		const sections = tab === 'Inventory' ? inventorySections : equippedSections;
		return sections.reduce((acc, section) => {
			if (section.data.length > 0) {
				// Add header
				acc.push({ type: 'header', title: section.title });
				// Group items into triplets for grid layout
				for (let i = 0; i < section.data.length; i += 3) {
					acc.push({
						type: 'row',
						items: section.data.slice(i, i + 3)
					});
				}
			}
			return acc;
		}, []);
	};

	// Render section header
	const renderSectionHeader = ({ item }) => {
		if (!item || item.type !== 'header') return null;
		return (
			<View style={styles.sectionHeaderContainer}>
				<Text style={styles.sectionHeader}>{item.title}</Text>
			</View>
		);
	};

	// Render a grid row (1-3 items)
	const renderGridRow = ({ item }) => {
		if (!item || item.type !== 'row') return null;
		return (
			<View style={styles.gridRow}>
				{item.items.map((gridItem, index) => (
					<TouchableOpacity
						key={gridItem.id}
						style={[
							styles.gridItem,
							{ borderColor: colors[gridItem.rarity] },
							index === 0 && styles.gridItemLeft,
							index === 1 && styles.gridItemMiddle,
							index === 2 && styles.gridItemRight
						]}
						onPress={() => showEquipDialog(gridItem)}
					>
						<View style={styles.gridItemContent}>
							<View style={styles.itemHeader}>
								<MaterialIcons
									name={itemIcons[gridItem.type]}
									size={24}
									color={colors[gridItem.rarity]}
								/>
								<Text style={[styles.rarityText, { color: colors[gridItem.rarity] }]}>
									{gridItem.rarity}
								</Text>
							</View>
						</View>
						<View style={styles.statsContainer}>
							{Object.entries(gridItem.stats || {}).map(([stat, val]) => (
								<Text key={stat} style={styles.statText}>
									{statAliases[stat] || stat}: {val}
								</Text>
							))}
						</View>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	// Custom renderer to handle both headers and grid rows
	const renderItem = ({ item }) => {
		if (!item) return null;
		if (item.type === 'header') {
			return renderSectionHeader({ item });
		}
		return renderGridRow({ item });
	};

	return (
		<ScreenLayout title="Items">
			<SafeAreaView style={styles.container}>
				{/* Tabs */}
				<View style={styles.tabs}>
					{['Inventory', 'Equipped'].map(t => (
						<TouchableOpacity
							key={t}
							style={[styles.tab, tab === t && styles.tabActive]}
							onPress={() => setTab(t)}
						>
							<Text style={styles.tabText}>{t}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Content */}
				<FlatList
					data={getInventoryData()}
					extraData={[expanded, tab]}
					keyExtractor={(item) => item.type === 'header' ? item.title : `row-${item.items[0].id}`}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
				/>

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