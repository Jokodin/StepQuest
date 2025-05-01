import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default function HealthBar({ current, max, color }) {
	const percentage = Math.max(0, Math.min(100, (current / max) * 100));

	return (
		<View style={styles.container}>
			<View style={[styles.background, { backgroundColor: color + '20' }]} />
			<View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color + '40' }]} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: 'row',
	},
	background: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	bar: {
		height: '100%',
	},
}); 