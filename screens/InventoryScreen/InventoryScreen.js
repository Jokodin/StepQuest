// screens/InventoryScreen/InventoryScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './InventoryScreen.styles';

export default function InventoryScreen() {
	const [openedItems, setOpenedItems] = useState([]);
	const [unopenedCount, setUnopenedCount] = useState(0);

	useEffect(() => {
		loadInventory();
	}, []);

	const loadInventory = async () => {
		const inventoryStr = await AsyncStorage.getItem('inventory');
		const inventory = inventoryStr ? JSON.parse(inventoryStr) : [];
		const opened = inventory.filter(i => i !== 'unopened');
		const unopened = inventory.filter(i => i === 'unopened');
		setOpenedItems(opened);
		setUnopenedCount(unopened.length);
	};

	const openItem = async () => {
		const inventoryStr = await AsyncStorage.getItem('inventory');
		const inventory = inventoryStr ? JSON.parse(inventoryStr) : [];
		const index = inventory.indexOf('unopened');
		if (index === -1) return;

		const type = Math.random() < 0.5 ? 'sword' : 'armor';
		const rarityRoll = Math.random();
		let rarity = 'common';
		if (rarityRoll > 0.95) rarity = 'legendary';
		else if (rarityRoll > 0.8) rarity = 'rare';
		else if (rarityRoll > 0.5) rarity = 'uncommon';

		const newItem = `${rarity} ${type}`;
		inventory.splice(index, 1, newItem);
		await AsyncStorage.setItem('inventory', JSON.stringify(inventory));
		loadInventory();
	};

	const equipItem = async (item) => {
		const [rarity, type] = item.split(' ');
		if (!['sword', 'armor'].includes(type)) return;

		const inventoryStr = await AsyncStorage.getItem('inventory');
		let inventory = inventoryStr ? JSON.parse(inventoryStr) : [];

		const index = inventory.indexOf(item);
		if (index === -1) return;

		// Remove new item from inventory
		inventory.splice(index, 1);

		// Unequip old item if present
		const equippedItem = await AsyncStorage.getItem(`equipped_${type}`);
		if (equippedItem) {
			inventory.push(equippedItem); // return previously equipped item to inventory
		}

		await AsyncStorage.setItem('inventory', JSON.stringify(inventory));
		await AsyncStorage.setItem(`equipped_${type}`, item);
		loadInventory();
	};

	return (
		<View style={styles.container}>
			<View style={styles.listContainer}>
				<Text style={styles.label}>Opened Items:</Text>
				<FlatList
					data={openedItems}
					keyExtractor={(item, index) => index.toString()}
					renderItem={({ item }) => (
						<View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
							<Text style={styles.item}>{item}</Text>
							<TouchableOpacity onPress={() => equipItem(item)} style={{ marginLeft: 10 }}>
								<Text style={{ color: '#00f' }}>Equip</Text>
							</TouchableOpacity>
						</View>
					)}
				/>
			</View>
			<View style={styles.buttonContainer}>
				<Text style={styles.label}>Unopened: {unopenedCount}</Text>
				<Button title="Open New Item" onPress={openItem} />
			</View>
		</View>
	);
}
