import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/theme';
import { StepServiceInstance } from '@/services/StepService';
import WalkRewardService from '@/services/WalkRewardService';

export default function Header() {
	const focused = useIsFocused();

	const [displaySteps, setDisplaySteps] = useState(0);
	const [installSteps, setInstallSteps] = useState(0);
	const [installDate, setInstallDate] = useState('');
	const [initialized, setInitialized] = useState(false);

	const getTodayDate = () => new Date().toISOString().slice(0, 10);

	// Load or create baseline on mount
	useEffect(() => {
		(async () => {
			const today = StepServiceInstance.getToday();
			const todayStr = getTodayDate();

			const savedDate = await AsyncStorage.getItem('install_date');
			const savedSteps = await AsyncStorage.getItem('install_steps');

			if (savedDate && savedSteps) {
				// restore baseline
				setInstallDate(savedDate);
				setInstallSteps(Number(savedSteps));
				setInitialized(true);

				const delta =
					savedDate === todayStr
						? today - Number(savedSteps)
						: today;
				setDisplaySteps(delta >= 0 ? delta : today);
			} else {
				// first‐time baseline
				setInstallDate(todayStr);
				setInstallSteps(today);
				await AsyncStorage.setItem('install_date', todayStr);
				await AsyncStorage.setItem('install_steps', String(today));
				setInitialized(true);
				setDisplaySteps(0);
			}
		})();
	}, []);

	// Update displaySteps on every native step update
	useEffect(() => {
		if (!initialized) return;
		const onUpdate = ({ today }) => {
			const todayStr = getTodayDate();
			const delta =
				installDate === todayStr
					? today - installSteps
					: today;
			setDisplaySteps(delta >= 0 ? delta : today);
		};

		StepServiceInstance.on('update', onUpdate);
		return () => StepServiceInstance.off('update', onUpdate);
	}, [initialized, installDate, installSteps]);

	// Recompute when screen refocuses
	useEffect(() => {
		if (focused && initialized) {
			const today = StepServiceInstance.getToday();
			const todayStr = getTodayDate();
			const delta =
				installDate === todayStr
					? today - installSteps
					: today;
			setDisplaySteps(delta >= 0 ? delta : today);
		}
	}, [focused, initialized, installDate, installSteps]);

	const handleReset = useCallback(() => {
		Alert.alert(
			'Confirm Reset',
			'This will clear all saved data and reset your progress. Proceed?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Reset',
					style: 'destructive',
					onPress: async () => {
						await AsyncStorage.clear();
						await WalkRewardService.reset();
						await StepServiceInstance.reset();
						setDisplaySteps(0);
						setInstallSteps(0);
						setInstallDate('');
						setInitialized(false);
						Alert.alert('Reset complete', 'All data has been cleared.');
					},
				},
			]
		);
	}, []);

	return (
		<View style={styles.header}>
			<Text style={styles.stepText}>
				Steps today: {displaySteps}
			</Text>
			<TouchableOpacity
				onPress={handleReset}
				hitSlop={8}
				style={styles.resetButton}
			>
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
		textAlign: 'center',
	},
	resetButton: {
		marginLeft: 16,
	},
	resetText: {
		fontSize: 16,
		color: colors.primary,
	},
});
