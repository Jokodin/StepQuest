// screens/HomeScreen/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import styles from './HomeScreen.styles';
import GoogleFit, { Scopes } from 'react-native-google-fit';

export default function HomeScreen({ navigation }) {
	const [stepsInCycle, setStepsInCycle] = useState(0);
	const [equippedSword, setEquippedSword] = useState(null);
	const [equippedArmor, setEquippedArmor] = useState(null);
	const isFocused = useIsFocused();

	useEffect(() => {
		const fetchSteps = async () => {
			const storedCycleStr = await AsyncStorage.getItem('stepsInCycle');
			const storedCycle = storedCycleStr ? parseInt(storedCycleStr) : 0;

			const start = new Date();
			start.setHours(0, 0, 0, 0);
			const end = new Date();

			const res = await GoogleFit.getDailyStepCountSamples({
				startDate: start.toISOString(),
				endDate: end.toISOString(),
			});

			const estimated = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
			const totalSteps = estimated?.steps?.[0]?.value ?? 0;

			const lastStoredStepsStr = await AsyncStorage.getItem('lastTotalSteps');
			const lastStoredSteps = lastStoredStepsStr ? parseInt(lastStoredStepsStr) : totalSteps;

			const delta = Math.max(0, totalSteps - lastStoredSteps);
			const newCycleSteps = storedCycle + delta;
			const rewardsToApply = Math.floor(newCycleSteps / 100);
			const remainingSteps = newCycleSteps % 100;

			if (rewardsToApply > 0) {
				const inventoryStr = await AsyncStorage.getItem('inventory');
				const inventory = inventoryStr ? JSON.parse(inventoryStr) : [];

				for (let i = 0; i < rewardsToApply; i++) {
					inventory.push('unopened');
				}

				await AsyncStorage.setItem('inventory', JSON.stringify(inventory));
			}

			setStepsInCycle(remainingSteps);
			await AsyncStorage.setItem('stepsInCycle', remainingSteps.toString());
			await AsyncStorage.setItem('lastTotalSteps', totalSteps.toString());
		};

		const startGoogleFit = async () => {
			const options = {
				scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
			};

			const authResult = await GoogleFit.authorize(options);
			if (authResult.success) {
				const stored = await AsyncStorage.getItem('stepsInCycle');
				setStepsInCycle(stored ? parseInt(stored) : 0);
				fetchSteps();
				setInterval(fetchSteps, 5000); // Poll every 5 seconds
			} else {
				console.error("Google Fit Auth Failure");
			}
		};

		startGoogleFit();
	}, []);

	useEffect(() => {
		const loadEquippedItems = async () => {
			const sword = await AsyncStorage.getItem('equipped_sword');
			const armor = await AsyncStorage.getItem('equipped_armor');
			setEquippedSword(sword);
			setEquippedArmor(armor);
		};

		if (isFocused) {
			loadEquippedItems();
		}
	}, [isFocused]);

	return (
		<View style={styles.container}>
			<Text style={styles.counter}>{stepsInCycle} / 100 steps</Text>
			<View style={styles.equippedContainer}>
				<Text style={styles.label}>Equipped Sword: {equippedSword || 'None'}</Text>
				<Text style={styles.label}>Equipped Armor: {equippedArmor || 'None'}</Text>
			</View>
			<Button title="Go to Inventory" onPress={() => navigation.navigate('Inventory')} />
			<View style={{ marginTop: 20 }}>
				<Button title="Fight a Monster" onPress={() => navigation.navigate('Battle')} />
			</View>
		</View>
	);
}
