// screens/StoreScreen/StoreScreen.js

import React, { useState, useEffect } from 'react';
import {
	SafeAreaView,
	SectionList,
	View,
	Text,
	Button,
	Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import styles from './StoreScreen.styles';
import ScreenLayout from '@/components/ScreenLayout';

const PRICE = 1000;
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

export default function StoreScreen() {
	const [gold, setGold] = useState(0);

	useEffect(() => {
		(async () => {
			const g = await AsyncStorage.getItem('gold');
			setGold(g ? parseInt(g, 10) : 0);
		})();
	}, []);

	const handleBuy = async (itemName) => {
		if (gold < PRICE) {
			Alert.alert('Not enough gold', `You need ${PRICE} gold to buy ${itemName}.`);
			return;
		}
		const newGold = gold - PRICE;
		setGold(newGold);
		await AsyncStorage.setItem('gold', newGold.toString());

		try {
			const invStr = await AsyncStorage.getItem('inventory');
			const inv = invStr ? JSON.parse(invStr) : [];
			inv.push(itemName);
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));
		} catch (e) {
			console.error('Failed to save to inventory', e);
		}

		Alert.alert('Purchase successful', `You bought ${itemName}!`);
	};

	const sections = Object.entries(categories).map(([title, data]) => ({
		title,
		data,
	}));

	return (
		<ScreenLayout title="Store">
			<SafeAreaView style={styles.container}>
				<SectionList
					sections={sections}
					keyExtractor={(item, idx) => item + idx}
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
						<View style={styles.shopItem}>
							<Text style={styles.itemText}>{item}</Text>
							<Button
								title={`Buy (${PRICE})`}
								onPress={() => handleBuy(item)}
								disabled={gold < PRICE}
							/>
						</View>
					)}
					contentContainerStyle={styles.listContent}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
