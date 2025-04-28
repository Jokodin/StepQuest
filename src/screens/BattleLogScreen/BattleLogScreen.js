// screens/BattleLogScreen.js

import React from 'react';
import {
	SafeAreaView,
	FlatList,
	View,
} from 'react-native';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import TownDefenseService from '@/services/TownDefenseService';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import styles from './BattleLogScreen.styles';

export default function BattleLogScreen({ route, navigation }) {
	const { logIndex } = route.params;
	const history = TownDefenseService.getHistory();
	const entry = history[logIndex] || {};

	const {
		time = '—',
		event = '',
		hero = 'Player',
		monsters = [],   // ← this is the fought‐monster list, not incoming
		logs = [],
		success = false,
		goldChange = 0,
	} = entry;

	return (
		<ScreenLayout title={`Battle ${logIndex + 1} Log`}>
			<SafeAreaView style={styles.container}>
				{/* Battle metadata */}
				<View style={styles.metaSection}>
					<ThemedText style={styles.metaText}>Time: {time}</ThemedText>
					<ThemedText style={styles.metaText}>
						Result: {event} {success ? '✅' : '❌'}
					</ThemedText>
					<ThemedText style={styles.metaText}>Hero: {hero}</ThemedText>
					<ThemedText style={styles.metaText}>
						Monsters: {monsters.join(', ')}
					</ThemedText>
				</View>

				{/* Action-by-action log */}
				<FlatList
					data={logs}
					keyExtractor={(_, i) => String(i)}
					renderItem={({ item }) => {
						// if the line starts with the hero’s name, it was a player action
						const actor = item.split(' ')[0];
						const isPlayer = actor === hero;
						return (
							<View style={styles.entryRow}>
								<FontAwesome5
									name={isPlayer ? 'user' : 'skull'}
									size={16}
									color={isPlayer ? colors.primary : colors.error}
									style={styles.entryIcon}
								/>
								<ThemedText style={styles.entryText}>{item}</ThemedText>
							</View>
						);
					}}
					ListEmptyComponent={
						<View style={styles.entryRow}>
							<ThemedText>No detailed logs available.</ThemedText>
						</View>
					}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
