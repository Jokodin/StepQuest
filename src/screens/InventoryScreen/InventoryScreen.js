// screens/InventoryScreen/InventoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	SectionList,
	TouchableOpacity,
	SafeAreaView,
	Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import styles from './InventoryScreen.styles';
import { colors } from '@/constants/theme';
import ScreenLayout from '@/components/ScreenLayout';
import Item from '@/models/Item';
import { itemTypes } from '@/services/ItemService';
import CharacterService from '@/services/CharacterService';

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

	// Sections for Inventory tab: items not equipped
	const inventorySections = itemTypes.map(cat => ({
		title: cat,
		data: inventory
			.filter(it => it && it.type === cat && !equippedItems.some(eq => eq && eq.id === it.id))
			.sort((a, b) => {
				// sort by rarity then quality
				const r = a.rarity.localeCompare(b.rarity);
				return r !== 0 ? r : b.quality - a.quality;
			}),
	}));

	// Sections for Equipped tab: grouped by category
	const equippedSections = itemTypes.map(cat => ({
		title: cat,
		data: equippedItems.filter(eq => eq && eq.type === cat),
	}));

	// Render an inventory item row
	const renderInventoryItem = ({ item }) => {
		if (!item) return null;
		const isOpen = expanded[item.id];
		return (
			<View style={styles.itemContainerWrapper}>
				<TouchableOpacity
					style={styles.itemContainer}
					onPress={() => toggleExpand(item.id)}
				>
					<Text style={styles.itemText}>{item.name}</Text>
				</TouchableOpacity>
				{isOpen && (
					<View style={styles.statsContainer}>
						{Object.entries(item.stats || {}).map(([stat, val]) => (
							<Text key={stat} style={styles.statText}>
								{stat}: {val}
							</Text>
						))}
						<View style={styles.equipButtonContainer}>
							<Button title="Equip" onPress={() => handleEquip(item)} />
						</View>
					</View>
				)}
			</View>
		);
	};

	// Render an equipped item row
	const renderEquippedItem = ({ item }) => {
		if (!item) return null;
		const isOpen = expanded[item.id];
		return (
			<View style={styles.itemContainerWrapper}>
				<TouchableOpacity
					style={styles.itemContainer}
					onPress={() => toggleExpand(item.id)}
				>
					<Text style={styles.itemText}>{item.name}</Text>
				</TouchableOpacity>
				{isOpen && (
					<View style={styles.statsContainer}>
						{Object.entries(item.stats || {}).map(([stat, val]) => (
							<Text key={stat} style={styles.statText}>
								{stat}: {val}
							</Text>
						))}
						<View style={styles.equipButtonContainer}>
							<Button title="Unequip" onPress={() => handleUnequip(item)} />
						</View>
					</View>
				)}
			</View>
		);
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
				{tab === 'Inventory' ? (
					<SectionList
						sections={inventorySections}
						extraData={expanded}
						keyExtractor={item => item.id}
						renderSectionHeader={({ section: { title, data } }) =>
							data.length > 0 && (
								<View style={styles.sectionHeaderContainer}>
									<Text style={styles.sectionHeader}>{title}</Text>
								</View>
							)
						}
						renderItem={renderInventoryItem}
						contentContainerStyle={styles.listContent}
					/>
				) : (
					<SectionList
						sections={equippedSections}
						extraData={expanded}
						keyExtractor={item => item.id}
						renderSectionHeader={({ section: { title, data } }) =>
							data.length > 0 && (
								<View style={styles.sectionHeaderContainer}>
									<Text style={styles.sectionHeader}>{title}</Text>
								</View>
							)
						}
						renderItem={renderEquippedItem}
						contentContainerStyle={styles.listContent}
					/>
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