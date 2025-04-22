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
			<View style={styles.exploreContainer}>
				{/* ← New line showing the current level */}
				<Text style={styles.label}>Explore Level: {exploreLevel}</Text>
				<Text style={styles.counter}>
					{exploreSteps} / {exploreGoal} steps
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.openContainer}>
			<Text style={styles.label}>New area discovered!</Text>
			<Button title="OK" onPress={onExploreComplete} />
		</View>
	);
}
