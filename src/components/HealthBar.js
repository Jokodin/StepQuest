import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default function HealthBar({ current, max, color, reversed = false }) {
	const percentage = Math.max(0, Math.min(100, (current / max) * 100));

	return (
		<View style={styles.container}>
			<View style={[
				styles.background,
			]}>
				<View style={[
					styles.fill,
					{
						width: `${percentage}%`,
						backgroundColor: color + '40',
						right: reversed ? 0 : undefined,
						left: reversed ? undefined : 0
					}
				]} />
			</View>
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
		zIndex: -1,
	},
	background: {
		flex: 1,
		overflow: 'hidden',
	},
	fill: {
		position: 'absolute',
		height: '100%',
	},
}); 