// screens/HomeScreen/OpenPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './HomeScreen.styles';

const STEP_GOAL = 100;

export default function OpenPanel({ openSteps, openReady, onOpen }) {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const [unopenedCount, setUnopenedCount] = useState(0);
	const [lastOpened, setLastOpened] = useState(null);

	// fetch how many unopened items remain
	useEffect(() => {
		const fetchCount = async () => {
			const invStr = await AsyncStorage.getItem('inventory');
			const inv = invStr ? JSON.parse(invStr) : [];
			setUnopenedCount(inv.filter(i => i === 'unopened').length);
		};
		fetchCount();
	}, [openReady]);

	const openNextReward = async () => {
		const invStr = await AsyncStorage.getItem('inventory');
		const inv = invStr ? JSON.parse(invStr) : [];
		const idx = inv.indexOf('unopened');
		if (idx === -1) {
			return Alert.alert('No items', 'You have no unopened items.');
		}

		// Determine type + rarity
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
		setUnopenedCount(inv.filter(i => i === 'unopened').length);

		// animate
		scaleAnim.setValue(0);
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 5,
			useNativeDriver: true,
		}).start();
	};

	return (
		<View style={styles.openContainer}>
			{/* Always show unopened count */}
			<Text style={styles.count}>
				Unopened Items: {unopenedCount}
			</Text>

			{/* Before goal reached */}
			{!openReady && (
				<Text style={styles.counter}>
					{openSteps} / {STEP_GOAL} steps
				</Text>
			)}

			{/* Goal reached, not yet opened */}
			{openReady && lastOpened == null && (
				<Button title="Open Next Item" onPress={openNextReward} />
			)}

			{/* After opening: show reveal + OK */}
			{openReady && lastOpened != null && (
				<>
					{lastOpened && (
						<Animated.Text
							style={[styles.reveal, { transform: [{ scale: scaleAnim }] }]}
						>
							{lastOpened}
						</Animated.Text>
					)}
					<Button
						title="OK"
						onPress={() => {
							setLastOpened(null);
							onOpen();
						}}
					/>
				</>
			)}
		</View>
	);
}
