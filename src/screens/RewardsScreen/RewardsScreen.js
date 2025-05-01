// src/screens/RewardsScreen/RewardsScreen.js

import React, { useState, useEffect } from 'react';
import {
	SafeAreaView,
	View,
	Button,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '@/components/ScreenLayout';
import ThemedText from '@/components/ThemedText';
import { generateItemByLevel } from '@/services/ItemService';
import styles from './RewardsScreen.styles';

export default function RewardsScreen({ navigation }) {
	const [boxes, setBoxes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [rewardItem, setRewardItem] = useState(null);

	// Load pending reward boxes
	const loadBoxes = async () => {
		try {
			const raw = await AsyncStorage.getItem('walk_reward_boxes');
			setBoxes(raw ? JSON.parse(raw) : []);
		} catch (e) {
			console.error('Failed to load reward boxes', e);
			setBoxes([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadBoxes();
	}, []);

	// Open next box: generates and shows item based on box area level
	const openNext = async () => {
		if (boxes.length === 0) return;
		const box = boxes[0];
		const level = typeof box.area === 'number' ? box.area : 1;

		// Generate item using ItemService
		const item = generateItemByLevel(level);

		// Persist to inventory
		try {
			const invRaw = await AsyncStorage.getItem('inventory');
			const inv = invRaw ? JSON.parse(invRaw) : [];
			inv.push({ ...item.toJSON(), cost: item.cost });
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));
		} catch (e) {
			console.error('Failed to save item to inventory', e);
		}

		// Remove opened box
		const newBoxes = boxes.slice(1);
		try {
			await AsyncStorage.setItem('walk_reward_boxes', JSON.stringify(newBoxes));
		} catch (e) {
			console.error('Failed to update reward boxes', e);
		}
		setBoxes(newBoxes);

		// Display reward
		setRewardItem(item);
	};

	if (loading) {
		return (
			<ScreenLayout title="Rewards">
				<SafeAreaView style={styles.container}>
					<ActivityIndicator size="large" />
				</SafeAreaView>
			</ScreenLayout>
		);
	}

	return (
		<ScreenLayout title="Rewards">
			<SafeAreaView style={styles.container}>
				{/* Top: number of boxes */}
				<View style={styles.messageContainer}>
					<ThemedText style={styles.messageText}>
						You have {boxes.length} loot {boxes.length === 1 ? 'box' : 'boxes'}
					</ThemedText>
				</View>

				{/* Middle: reward item */}
				<View style={styles.cardContainer}>
					{rewardItem && (
						<View style={styles.card}>
							<ThemedText style={styles.itemName}>{rewardItem.name}</ThemedText>
							<ScrollView style={styles.statsList}>
								{Object.entries(rewardItem.stats).map(([key, val]) => (
									<ThemedText key={key} style={styles.statText}>
										{key}: {val}
									</ThemedText>
								))}
							</ScrollView>
						</View>
					)}
				</View>

				{/* Bottom: action buttons */}
				<View style={styles.buttonContainer}>
					<Button title="Open Next Item" onPress={openNext} />
				</View>
			</SafeAreaView>
		</ScreenLayout>
	);
}
