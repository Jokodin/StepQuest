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

	// Group logs by timestamp
	const groupedLogs = logs.reduce((acc, log) => {
		if (!acc[log.timestamp]) {
			acc[log.timestamp] = [];
		}
		acc[log.timestamp].push(log);
		return acc;
	}, {});

	// Convert grouped logs to array for FlatList
	const logGroups = Object.entries(groupedLogs).map(([timestamp, entries]) => ({
		timestamp: parseInt(timestamp),
		entries
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
	const renderLogGroup = ({ item: group }) => {
		const isSimultaneous = group.entries.length > 1;
		const playerEntry = group.entries.find(entry => entry.actor === heroName);
		const enemyEntry = group.entries.find(entry => entry.actor !== heroName && entry.actor !== 'System');
		const systemEntry = group.entries.find(entry => entry.actor === 'System');

		return (
			<View style={[
				styles.entryRow,
				isSimultaneous && styles.simultaneousRow
			]}>
				{systemEntry && (
					<View style={[styles.entryContainer, styles.systemEntry]}>
						<ThemedText style={[styles.entryText, { textAlign: 'center' }]}>
							{systemEntry.displayText}
						</ThemedText>
					</View>
				)}
				{playerEntry && (
					<View
						style={[
							styles.entryContainer,
							styles.playerEntry,
							isSimultaneous && styles.simultaneousEntry
						]}
					>
						{renderLogEntry(playerEntry, true)}
					</View>
				)}
				{enemyEntry && (
					<View
						style={[
							styles.entryContainer,
							styles.enemyEntry,
							isSimultaneous && styles.simultaneousEntry
						]}
					>
						{renderLogEntry(enemyEntry, false)}
					</View>
				)}
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
				<View style={styles.logsContainer}>
					<FlatList
						data={logGroups}
						keyExtractor={(item) => String(item.timestamp)}
						renderItem={renderLogGroup}
						contentContainerStyle={{ paddingHorizontal: 16 }}
						ListEmptyComponent={
							<View style={styles.entryRow}>
								<ThemedText>No detailed logs available.</ThemedText>
							</View>
						}
					/>
				</View>
			</SafeAreaView>
		</ScreenLayout>
	);
}
