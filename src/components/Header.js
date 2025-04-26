// components/Header.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/theme';

export default function Header({ title }) {
	const navigation = useNavigation();
	const focused = useIsFocused();
	const [gold, setGold] = useState(0);

	// load gold whenever the screen comes into focus
	useEffect(() => {
		if (focused) {
			AsyncStorage.getItem('gold').then(value => {
				setGold(value ? parseInt(value, 10) : 0);
			});
		}
	}, [focused]);

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

	return (
		<View style={styles.header}>
			<TouchableOpacity onPress={handleAddGold} hitSlop={8}>
				<Text style={styles.goldText}>{gold} 💰</Text>
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
	goldText: {
		fontSize: 16,
		color: colors.text,
	},
});
