import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

const Bar = ({ current, max, color = colors.primary, reversed = false, showText = true }) => {
	const percentage = Math.max(0, Math.min(100, (current / max) * 100));
	const fillWidth = `${percentage}%`;

	return (
		<View style={styles.container}>
			<View style={[styles.background, { backgroundColor: `${color}33` }]}>
				<View
					style={[
						styles.fill,
						{ width: fillWidth, backgroundColor: color }
					]}
				/>
			</View>
			{showText && (
				<View style={styles.textContainer}>
					<Text style={styles.text}>
						{Math.round(current)}/{Math.round(max)}
					</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		height: 24,
		marginVertical: 4,
		position: 'relative'
	},
	background: {
		width: '100%',
		height: '100%',
		borderRadius: 4,
		overflow: 'hidden'
	},
	fill: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		borderRadius: 4
	},
	textContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		color: colors.text,
		fontSize: 12,
		fontWeight: 'bold'
	}
});

export default Bar; 