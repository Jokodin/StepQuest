// components/FooterNav.js

import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '@/constants/theme';

const tabs = [
	// { name: 'Town', icon: '🏘️' },
	{ name: 'Character', icon: '👤' },
	{ name: 'Items', icon: '🎒' },
	// { name: 'Store', icon: '🛒' },
	{ name: 'Logs', icon: '📜' },
	{ name: 'Boxes', icon: '📦' },
];

export default function FooterNav() {
	const navigation = useNavigation();
	const route = useRoute();

	return (
		<View style={styles.container}>
			{tabs.map(tab => {
				const isActive = route.name === tab.name;
				return (
					<TouchableOpacity
						key={tab.name}
						style={styles.tab}
						onPress={() => navigation.navigate(tab.name)}
					>
						<Text style={[styles.icon, isActive && styles.activeIcon]}>
							{tab.icon}
						</Text>
						<Text style={[styles.label, isActive && styles.activeLabel]}>
							{tab.name}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 60,
		flexDirection: 'row',
		borderTopWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		fontSize: 20,
		color: colors.textSecondary,
	},
	label: {
		fontSize: 12,
		color: colors.textSecondary,
	},
	activeIcon: {
		color: colors.primary,
	},
	activeLabel: {
		color: colors.primary,
		fontWeight: '600',
	},
});
