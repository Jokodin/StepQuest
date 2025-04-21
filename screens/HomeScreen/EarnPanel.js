// screens/HomeScreen/EarnPanel.js
import React from 'react';
import { View, Text } from 'react-native';
import styles from './HomeScreen.styles';

export default function EarnPanel({ goldPerStep, gold }) {
	return (
		<View style={styles.main}>
			<Text style={styles.label}>
				Gold per step: {goldPerStep.toFixed(2)}
			</Text>
			<Text style={styles.label}>
				Gold: {gold.toFixed(2)}
			</Text>
		</View>
	);
}
