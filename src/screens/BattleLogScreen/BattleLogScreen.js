// screens/BattleLogScreen.js

import React from 'react';
import {
	SafeAreaView,
	FlatList,
	View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import TownDefenseService from '@/services/TownDefenseService';
import WalkRewardService from '@/services/WalkRewardService';
import CharacterService from '@/services/CharacterService';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import HealthBar from '@/components/HealthBar';
import styles from './BattleLogScreen.styles';

export default function BattleLogScreen({ route, navigation }) {
	const { logIndex, logType } = route.params;

	// Determine hero name dynamically
	const currentChar = CharacterService.getCurrentCharacter();
	const heroName = currentChar.name || 'Player';

	// Choose history based on logType
	const history =
		logType === 'walk'
			? WalkRewardService.getHistory()
			: TownDefenseService.getHistory();
	const entry = history[logIndex] || {};

	const {
		event = '',
		monsters = [],
		logs = [],
		success = false,
	} = entry;

	// Log the entry for debugging
	console.log('[BattleLogScreen] Entry:', entry);

	return (
		<ScreenLayout title="Battle Log">
			<SafeAreaView style={styles.container}>
				{/* Battle metadata */}
				<View style={styles.metaSection}>
					<ThemedText style={styles.metaText}>
						Result: {event} {success ? '✅' : '❌'}
					</ThemedText>
					<ThemedText style={styles.metaText}>Hero: {heroName}</ThemedText>
					<ThemedText style={styles.metaText}>
						Monsters: {Array.isArray(monsters) ? monsters.join(', ') : 'None'}
					</ThemedText>
				</View>

				{/* Action-by-action log */}
				<FlatList
					data={logs}
					keyExtractor={(_, i) => String(i)}
					renderItem={({ item }) => {
						const isPlayer = item.actor === heroName;
						const hasHealth = item.actorMaxHp > 0;

						console.log('[BattleLogScreen] Rendering log entry:', {
							item,
							isPlayer,
							hasHealth
						});

						return (
							<View style={styles.entryRow}>
								{hasHealth && (
									<HealthBar
										current={item.actorCurrentHp}
										max={item.actorMaxHp}
										color={isPlayer ? colors.primary : colors.error}
									/>
								)}
								<View style={styles.entryContent}>
									{isPlayer && (
										<FontAwesome5
											name="user"
											size={16}
											color={colors.primary}
											style={styles.entryIcon}
										/>
									)}
									<ThemedText style={[
										styles.entryText,
										isPlayer ? styles.entryTextPlayer : styles.entryTextEnemy
									]}>
										{item.displayText}
									</ThemedText>
									{!isPlayer && (
										<FontAwesome5
											name="skull"
											size={16}
											color={colors.error}
											style={styles.entryIcon}
										/>
									)}
								</View>
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
