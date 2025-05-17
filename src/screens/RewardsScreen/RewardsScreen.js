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
import ItemService from '@/services/ItemService';
import styles from './RewardsScreen.styles';

export default function RewardsScreen({ navigation }) {
	const [boxes, setBoxes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [rewardItem, setRewardItem] = useState(null);

	// Load pending reward boxes
	const loadBoxes = async () => {
		try {
			const raw = await AsyncStorage.getItem('walk_reward_boxes');
			//console.log('Raw boxes data:', raw);
			const parsedBoxes = raw ? JSON.parse(raw) : [];
			//console.log('Parsed boxes:', parsedBoxes);
			setBoxes(parsedBoxes);
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
		try {
			//console.log('Opening next box. Current boxes:', boxes);
			if (boxes.length === 0) {
				//console.log('No boxes available');
				return;
			}
			const box = boxes[0];
			//console.log('Opening box:', box);
			const level = typeof box.area === 'number' ? box.area : 1;
			//console.log('Using level:', level);

			// Generate item using ItemService
			//console.log('Generating item...');
			const item = ItemService.generateRandomItem(level);
			//console.log('Generated item:', item);

			// Persist to inventory
			//console.log('Saving to inventory...');
			const invRaw = await AsyncStorage.getItem('inventory');
			//console.log('Current inventory:', invRaw);
			const inv = invRaw ? JSON.parse(invRaw) : [];
			inv.push(item);
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));
			//console.log('Updated inventory:', inv);

			// Remove opened box
			//console.log('Removing box...');
			const newBoxes = boxes.slice(1);
			await AsyncStorage.setItem('walk_reward_boxes', JSON.stringify(newBoxes));
			//console.log('Updated boxes:', newBoxes);
			setBoxes(newBoxes);

			// Display reward
			//console.log('Setting reward item...');
			setRewardItem(item);
			//console.log('Done!');
		} catch (error) {
			console.error('Error in openNext:', error);
		}
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
