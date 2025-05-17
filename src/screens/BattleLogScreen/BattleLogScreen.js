// screens/BattleLogScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
	SafeAreaView,
	FlatList,
	View,
	TouchableOpacity,
	Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import WalkRewardService from '@/services/WalkRewardService';
import CharacterService from '@/services/CharacterService';
import BattleService from '@/services/BattleService';
import { battleService } from '@/services/BattleService';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import Bar from '@/components/HealthBar';
import styles from './BattleLogScreen.styles';

export default function BattleLogScreen({ route, navigation }) {
	const { logIndex, logType } = route.params;
	const [activeTab, setActiveTab] = useState('logs');
	const [replayState, setReplayState] = useState(null);
	const lastUpdateTime = useRef(Date.now());
	const animationFrame = useRef(null);

	// Determine hero name dynamically
	const currentChar = CharacterService.getCurrentCharacter();
	const heroName = currentChar.name || 'Player';

	// Choose history based on logType
	const history = WalkRewardService.getHistory();
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

	// Initialize replay when switching to replay tab
	useEffect(() => {
		if (activeTab === 'replay' && !replayState) {
			//console.log('Initializing replay from entry:', entry);
			try {
				const replay = battleService.createBattleReplay(entry);
				if (!replay) {
					console.error('Failed to create replay state');
					return;
				}
				//console.log('Setting replay state with frames:', replay.frames.length);
				setReplayState(replay);
			} catch (error) {
				console.error('Error initializing battle replay:', error);
			}
		}
	}, [activeTab, entry]);

	// Render a single log entry
	const renderLogEntry = (entry, isPlayer) => {
		const hasHealth = entry.actorMaxHp > 0;
		return (
			<View style={styles.entryContent}>
				{hasHealth && (
					<Bar
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

	// Update replay state
	useEffect(() => {
		if (activeTab === 'replay' && replayState) {
			//console.log('Starting replay animation with frames:', replayState.frames.length);

			// Don't start a new animation if one is already running or if the battle is complete
			if (animationFrame.current || replayState.isComplete) {
				return;
			}

			const FRAMERATE = BattleService.FRAMERATE; // Use the FRAMERATE from battleService
			//console.log('FRAMERATE', FRAMERATE);
			const FRAME_INTERVAL = 1000 / FRAMERATE; // Time between frames in milliseconds
			let lastFrameTime = Date.now();

			const updateReplay = () => {
				try {
					const now = Date.now();
					const elapsed = now - lastFrameTime;

					// Only update if enough time has passed
					if (elapsed >= FRAME_INTERVAL) {
						lastFrameTime = now;

						// Ensure we have valid frames to work with
						if (!replayState.frames || replayState.frames.length === 0) {
							console.error('No frames available in replay state');
							return;
						}

						// Calculate the next frame index
						const nextFrameIndex = Math.min(
							replayState.currentFrameIndex + 1,
							replayState.frames.length - 1
						);

						//console.log(`Updating frame from ${replayState.currentFrameIndex} to ${nextFrameIndex}`);
						const updatedReplay = {
							...replayState,
							currentFrameIndex: nextFrameIndex,
							isComplete: nextFrameIndex >= replayState.frames.length - 1
						};

						// Force a re-render by creating a new state object
						setReplayState(updatedReplay);

						// Only continue if we haven't reached the end of the battle
						if (!updatedReplay.isComplete) {
							animationFrame.current = requestAnimationFrame(updateReplay);
						} else {
							//console.log('Replay completed');
							// Clear the animation frame when complete
							if (animationFrame.current) {
								cancelAnimationFrame(animationFrame.current);
								animationFrame.current = null;
							}
						}
					} else {
						// If not enough time has passed, schedule the next check
						animationFrame.current = requestAnimationFrame(updateReplay);
					}
				} catch (error) {
					console.error('Error in replay animation:', error);
					// Stop the animation if there's an error
					if (animationFrame.current) {
						cancelAnimationFrame(animationFrame.current);
						animationFrame.current = null;
					}
				}
			};

			// Start the animation
			animationFrame.current = requestAnimationFrame(updateReplay);

			return () => {
				//console.log('Cleaning up replay animation');
				if (animationFrame.current) {
					cancelAnimationFrame(animationFrame.current);
					animationFrame.current = null;
				}
			};
		}
	}, [activeTab, replayState]);

	// Render the replay tab content
	const renderReplayTab = () => {
		if (!replayState) {
			return (
				<View style={styles.replayContainer}>
					<ThemedText style={styles.replayText}>
						Loading battle replay...
					</ThemedText>
				</View>
			);
		}

		const currentFrame = replayState.frames[replayState.currentFrameIndex];
		if (!currentFrame) {
			return (
				<View style={styles.replayContainer}>
					<ThemedText style={styles.replayText}>
						No replay data available.
					</ThemedText>
				</View>
			);
		}

		//console.log('Rendering frame:', replayState.currentFrameIndex, currentFrame);

		return (
			<View style={styles.replayContainer}>
				<View style={styles.battleField}>
					{/* Player side */}
					<View style={styles.combatantContainer}>
						<View style={styles.combatantInfo}>
							<ThemedText style={styles.combatantName}>{currentFrame.player.name}</ThemedText>
							<Bar
								current={currentFrame.player.currentHp}
								max={currentFrame.player.maxHp}
								color={colors.error}
							/>
							<Bar
								current={currentFrame.player.currentMana}
								max={currentFrame.player.maxMana}
								color={colors.primary}
							/>
							<Bar
								current={currentFrame.player.attackCooldown}
								max={currentFrame.player.attackSpeed}
								color={colors.text}
								showText={false}
							/>
						</View>
					</View>

					{/* Enemies side */}
					<View style={styles.enemiesContainer}>
						{currentFrame.monsters.map((enemy, index) => (
							<View key={index} style={styles.combatantContainer}>
								<View style={styles.combatantInfo}>
									<ThemedText style={styles.combatantName}>{enemy.name}</ThemedText>
									<Bar
										current={enemy.currentHp}
										max={enemy.maxHp}
										color={colors.error}
										reversed={true}
									/>
									<Bar
										current={enemy.currentMana}
										max={enemy.maxMana}
										color={colors.primary}
										reversed={true}
									/>
									<Bar
										current={enemy.attackCooldown}
										max={enemy.attackSpeed}
										color={colors.text}
										showText={false}
										reversed={true}
									/>
								</View>
							</View>
						))}
					</View>
				</View>
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
							if (typeof monster === 'string') {
								return monster;
							}
							return `${monster.id} (Level ${monster.level})`;
						}).join(', ') : 'None'}
					</ThemedText>
					{success && (
						<ThemedText style={styles.metaText}>
							Experience Gained: {entry.isBoss ? 50 * entry.area : 10 * (entry.area - 1) * monsters.length + 10 * monsters.length} XP
						</ThemedText>
					)}
				</View>

				{/* Tabs */}
				<View style={styles.tabsContainer}>
					<TouchableOpacity
						style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
						onPress={() => setActiveTab('logs')}
					>
						<ThemedText style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
							Logs
						</ThemedText>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.tab, activeTab === 'replay' && styles.activeTab]}
						onPress={() => setActiveTab('replay')}
					>
						<ThemedText style={[styles.tabText, activeTab === 'replay' && styles.activeTabText]}>
							Replay
						</ThemedText>
					</TouchableOpacity>
				</View>

				{/* Tab Content */}
				{activeTab === 'logs' ? (
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
				) : (
					renderReplayTab()
				)}
			</SafeAreaView>
		</ScreenLayout>
	);
}
