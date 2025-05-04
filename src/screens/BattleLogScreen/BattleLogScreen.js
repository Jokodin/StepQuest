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
import BattleService from '@/services/BattleService';

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

	// Group logs by timestamp and ensure unique keys
	const groupedLogs = logs.reduce((acc, log, index) => {
		const key = `${log.timestamp}-${log.actor}-${index}`;
		if (!acc[key]) {
			acc[key] = {
				timestamp: log.timestamp,
				entries: []
			};
		}
		acc[key].entries.push(log);
		return acc;
	}, {});

	// Convert grouped logs to array for FlatList
	const logGroups = Object.entries(groupedLogs).map(([key, value]) => ({
		...value,
		key // Include the unique key in the item
	}));

	// Sort groups by timestamp
	logGroups.sort((a, b) => a.timestamp - b.timestamp);

	// Render a single log entry
	const renderLogEntry = (entry, isPlayer) => {
		const hasHealth = entry.actorMaxHp > 0;
		return (
			<View style={styles.entryContent}>
				{hasHealth && (
					<HealthBar
						current={entry.actorCurrentHp}
						max={entry.actorMaxHp}
						color={isPlayer ? colors.primary : colors.error}
						reversed={!isPlayer}
					/>
				)}
				<View style={styles.entryTextContainer}>
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
						{entry.displayText}
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
	};

	// Render a group of simultaneous actions
	const renderLogGroup = ({ item }) => {
		return (
			<View style={styles.entryContainer}>
				{item.entries.map((log, index) => (
					<View
						key={`entry-${item.timestamp}-${log.actor}-${index}`}
						style={[
							styles.entryRow,
							log.actor === 'System' ? styles.systemEntry :
								log.actor === heroName ? styles.playerEntry : styles.enemyEntry
						]}
					>
						{log.actor === heroName && (
							<FontAwesome5
								name="user"
								size={16}
								color={colors.primary}
								style={styles.entryIcon}
							/>
						)}
						<ThemedText style={[
							styles.entryText,
							log.actor === heroName ? styles.entryTextPlayer :
								log.actor === 'System' ? styles.systemText : styles.entryTextEnemy
						]}>
							{log.displayText}
						</ThemedText>
						{log.actor !== heroName && log.actor !== 'System' && (
							<FontAwesome5
								name="skull"
								size={16}
								color={colors.error}
								style={styles.entryIcon}
							/>
						)}
					</View>
				))}
			</View>
		);
	};

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
						Monsters: {Array.isArray(monsters) ? monsters.map(monster => {
							// Find the first log entry with monster stats
							const initialLog = logs.find(log => log.actor === 'System' && Array.isArray(log.monsterStats));
							if (initialLog && initialLog.monsterStats) {
								const monsterStats = initialLog.monsterStats.find(m => m.id === monster);
								if (monsterStats) {
									return `${monsterStats.id} (Level ${monsterStats.level}, HP: ${monsterStats.maxHp}, Max Damage: ${monsterStats.baseDamage})`;
								}
							}
							return monster;
						}).join(', ') : 'None'}
					</ThemedText>
				</View>

				{/* Action-by-action log */}
				<FlatList
					data={logGroups}
					keyExtractor={(item) => item.key}
					renderItem={renderLogGroup}
					contentContainerStyle={styles.logsContainer}
					style={{ flex: 1 }}
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
