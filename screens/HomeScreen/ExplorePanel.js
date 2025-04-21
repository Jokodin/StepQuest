// screens/HomeScreen/ExplorePanel.js
import React from 'react';
import { View, Text, Button } from 'react-native';
import styles from './HomeScreen.styles';

export default function ExplorePanel({
	exploreSteps,
	exploreLevel,
	exploreReady,
	exploreGoal,
	onExploreComplete
}) {
	if (!exploreReady) {
		return (
			<Text style={styles.counter}>
				{exploreSteps} / {exploreGoal} steps
			</Text>
		);
	}

	return (
		<View style={styles.openContainer}>
			<Text style={styles.label}>New area discovered!</Text>
			<Button title="OK" onPress={onExploreComplete} />
		</View>
	);
}
