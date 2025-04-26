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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './InventoryScreen.styles';
import { colors } from '@/constants/theme';
import ScreenLayout from '@/components/ScreenLayout';
import Item from '@/models/Item';

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

const rarityRank = { rare: 0, uncommon: 1, common: 2 };
const rarityColors = {
	common: '#FFFFFF',
	uncommon: '#0096FF',
	rare: '#FFD700',
};
function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function InventoryScreen() {
	const isFocused = useIsFocused();

	const [tab, setTab] = useState('Inventory');
	const [inventory, setInventory] = useState([]);      // Item[]
	const [equipped, setEquipped] = useState({});        // { [cat]: Item }
	const [banner, setBanner] = useState('');
	const [expanded, setExpanded] = useState({});        // { [itemId]: bool }

	// load inventory + equips
	const loadData = useCallback(async () => {
		// await AsyncStorage.removeItem('inventory');
		const invRaw = await AsyncStorage.getItem('inventory');
		const invArr = invRaw ? JSON.parse(invRaw) : [];
		setInventory(invArr.map(obj => Item.fromJSON(obj)));

		const eqMap = {};
		await Promise.all(
			categories.map(async cat => {
				const key = `equipped_${cat.toLowerCase()}`;
				const raw = await AsyncStorage.getItem(key);
				if (raw) eqMap[cat] = Item.fromJSON(JSON.parse(raw));
			})
		);
		setEquipped(eqMap);
	}, []);

	useEffect(() => {
		if (isFocused) loadData();
	}, [isFocused, loadData]);

	const showBanner = msg => {
		setBanner(msg);
		setTimeout(() => setBanner(''), 2500);
	};

	const handleEquip = async (cat, item) => {
		const key = `equipped_${cat.toLowerCase()}`;
		await AsyncStorage.setItem(key, JSON.stringify(item.toJSON()));
		setEquipped(prev => ({ ...prev, [cat]: item }));
		showBanner(`${item.name} equipped`);
	};
	const handleUnequip = async cat => {
		const item = equipped[cat];
		if (!item) return;
		const key = `equipped_${cat.toLowerCase()}`;
		await AsyncStorage.removeItem(key);
		setEquipped(prev => ({ ...prev, [cat]: null }));
		showBanner(`${item.name} unequipped`);
	};

	const toggleExpand = itemId => {
		setExpanded(prev => ({ ...prev, [itemId]: !prev[itemId] }));
	};

	// Inventory sections: filter + sort
	const inventorySections = categories.map(cat => ({
		title: cat,
		data: inventory
			.filter(it => it.category === cat && (!equipped[cat] || equipped[cat].id !== it.id))
			.sort((a, b) => {
				const r = rarityRank[a.rarity] - rarityRank[b.rarity];
				return r !== 0 ? r : b.quality - a.quality;
			}),
	}));

	// Equipped sections: one per category
	const equippedSections = categories.map(cat => ({
		title: cat,
		data: equipped[cat] ? [equipped[cat]] : [],
	}));

	// Inventory row
	const renderInventoryItem = ({ item, section }) => {
		const isOpen = !!expanded[item.id];
		return (
			<View style={styles.itemContainerWrapper}>
				<TouchableOpacity
					style={styles.itemContainer}
					onPress={() => toggleExpand(item.id)}
					activeOpacity={0.7}
				>
					<Text style={styles.itemText}>
						{item.name}{' '}
						<Text style={[styles.rarityText, { color: rarityColors[item.rarity] }]}>
							({capitalize(item.rarity)})
						</Text>{' '}
						<Text style={[styles.rarityText, { color: '#FFF' }]}>
							(Quality {item.quality})
						</Text>
					</Text>
				</TouchableOpacity>
				{isOpen && (
					<View style={styles.statsContainer}>
						{Object.entries(item.stats).map(([stat, val]) => (
							<Text key={stat} style={styles.statText}>
								{stat}: {val}
							</Text>
						))}
						<View style={styles.equipButtonContainer}>
							<Button
								title="Equip"
								onPress={() => handleEquip(section.title, item)}
							/>
						</View>
					</View>
				)}
			</View>
		);
	};

	// Equipped row now expandable
	const renderEquippedItem = ({ item, section }) => {
		const isOpen = !!expanded[item.id];
		return (
			<View style={styles.itemContainerWrapper}>
				<TouchableOpacity
					style={styles.itemContainer}
					onPress={() => toggleExpand(item.id)}
					activeOpacity={0.7}
				>
					<Text style={styles.itemText}>
						{item.name}{' '}
						<Text style={[styles.rarityText, { color: rarityColors[item.rarity] }]}>
							({capitalize(item.rarity)})
						</Text>{' '}
						<Text style={[styles.rarityText, { color: '#FFF' }]}>
							(Quality {item.quality})
						</Text>
					</Text>
				</TouchableOpacity>
				{isOpen && (
					<View style={styles.statsContainer}>
						{Object.entries(item.stats).map(([stat, val]) => (
							<Text key={stat} style={styles.statText}>
								{stat}: {val}
							</Text>
						))}
						<View style={styles.equipButtonContainer}>
							<Button
								title="Unequip"
								onPress={() => handleUnequip(section.title)}
							/>
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
									<MaterialCommunityIcons
										name={sectionIcons[title]}
										size={20}
										color={colors.primary}
										style={styles.sectionIcon}
									/>
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
									<MaterialCommunityIcons
										name={sectionIcons[title]}
										size={20}
										color={colors.primary}
										style={styles.sectionIcon}
									/>
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
