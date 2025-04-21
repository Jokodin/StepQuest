// screens/RewardsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './RewardsScreen.styles';

export default function RewardsScreen({ navigation }) {
	const scaleAnim = useRef(new Animated.Value(0));
	const [unopenedCount, setUnopenedCount] = useState(0);
	const [lastOpened, setLastOpened] = useState(null);

	useEffect(() => {
		const fetchCount = async () => {
			const invStr = await AsyncStorage.getItem('inventory');
			const inv = invStr ? JSON.parse(invStr) : [];
			setUnopenedCount(inv.filter(i => i === 'unopened').length);
		};
		fetchCount();
	}, []);

	const openNextReward = async () => {
		const invStr = await AsyncStorage.getItem('inventory');
		const inv = invStr ? JSON.parse(invStr) : [];
		const idx = inv.indexOf('unopened');
		if (idx === -1) {
			alert('No rewards to open.');
			return;
		}
		// Determine type and rarity
		const type = Math.random() < 0.5 ? 'sword' : 'armor';
		const roll = Math.random();
		let rarity = 'common';
		if (roll > 0.95) rarity = 'legendary';
		else if (roll > 0.8) rarity = 'rare';
		else if (roll > 0.5) rarity = 'uncommon';

		const newItem = `${rarity} ${type}`;
		inv.splice(idx, 1, newItem);
		await AsyncStorage.setItem('inventory', JSON.stringify(inv));

		setLastOpened(newItem);
		scaleAnim.current.setValue(0);
		Animated.spring(scaleAnim.current, { toValue: 1, friction: 5, useNativeDriver: true }).start();
		setUnopenedCount(inv.filter(i => i === 'unopened').length);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Open Items</Text>
			<Text style={styles.count}>Unopened Items: {unopenedCount}</Text>
			<View style={styles.middleContainer}>
				{lastOpened && (
					<Animated.Text style={[styles.reveal, { transform: [{ scale: scaleAnim.current }] }]}>
						{lastOpened}
					</Animated.Text>
				)}
				<Button title="Open Next Item" onPress={openNextReward} />
			</View>
			<View style={styles.backButton}>
				<Button title="Back to Inventory" onPress={() => navigation.goBack()} />
			</View>
		</View>
	);
}
