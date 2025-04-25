// components/Header.js

import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/theme';

export default function Header({ title }) {
	const navigation = useNavigation();
	const focused = useIsFocused();
	const [gold, setGold] = useState(0);

	useEffect(() => {
		if (focused) {
			AsyncStorage.getItem('gold').then(value => {
				setGold(value ? parseInt(value, 10) : 0);
			});
		}
	}, [focused]);

	return (
		<View style={styles.header}>
			<Text style={styles.goldText}>{gold} 💰</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		height: 56,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',    // push children to the right
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
