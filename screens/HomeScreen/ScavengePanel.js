// screens/HomeScreen/ScavengePanel.js
import React from 'react';
import { Text } from 'react-native';
import styles from './HomeScreen.styles';

const STEP_GOAL = 100;

export default function ScavengePanel({ stepsInCycle }) {
	return (
		<Text style={styles.counter}>
			{stepsInCycle} / {STEP_GOAL} steps
		</Text>
	);
}
