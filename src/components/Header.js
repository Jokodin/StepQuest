// components/Header.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/theme';
import { StepServiceInstance } from '@/services/StepService';

export default function Header({ title }) {
	const navigation = useNavigation();
	const focused = useIsFocused();

	const [gold, setGold] = useState(0);
	const [todaySteps, setTodaySteps] = useState(0);

	// load gold whenever the screen comes into focus
	useEffect(() => {
		if (focused) {
			AsyncStorage.getItem('gold').then(value => {
				setGold(value ? parseInt(value, 10) : 0);
			});
			// also refresh today's steps
			setTodaySteps(StepServiceInstance.getToday());
		}
	}, [focused]);

	// subscribe to step updates
	useEffect(() => {
		const handleStepUpdate = ({ today }) => {
			setTodaySteps(today);
		};
		StepServiceInstance.on('update', handleStepUpdate);
		return () => {
			StepServiceInstance.off('update', handleStepUpdate);
		};
	}, []);

	// handler to add 1000 gold
	const handleAddGold = useCallback(async () => {
		try {
			const value = await AsyncStorage.getItem('gold');
			const current = value ? parseInt(value, 10) : 0;
			const updated = current + 1000;
			await AsyncStorage.setItem('gold', updated.toString());
			setGold(updated);
		} catch (e) {
			console.error('Failed to add gold', e);
		}
	}, []);

	// handler to clear ALL AsyncStorage
	const handleReset = useCallback(() => {
		Alert.alert(
			'Confirm Reset',
			'This will clear all saved data. Proceed?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset',
					style: 'destructive',
					onPress: async () => {
						try {
							await AsyncStorage.clear();
							setGold(0);
							setTodaySteps(0);
							Alert.alert('Reset complete', 'All data has been cleared.');
						} catch (e) {
							console.error('Failed to reset storage', e);
							Alert.alert('Error', 'Could not reset storage.');
						}
					},
				},
			]
		);
	}, []);

	return (
		<View style={styles.header}>
			<Text style={styles.stepText}>🚶{todaySteps}</Text>
			<TouchableOpacity onPress={handleAddGold} hitSlop={8}>
				<Text style={styles.goldText}>💰{gold}</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={handleReset} hitSlop={8} style={styles.resetButton}>
				<Text style={styles.resetText}>Reset</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		height: 56,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingHorizontal: 16,
		backgroundColor: colors.surface,
		borderBottomWidth: 1,
		borderColor: colors.border,
	},
	stepText: {
		fontSize: 16,
		color: colors.text,
		marginRight: 16,
	},
	goldText: {
		fontSize: 16,
		color: colors.text,
	},
	resetButton: {
		marginLeft: 16,
	},
	resetText: {
		fontSize: 16,
		color: colors.primary,
	},
});
