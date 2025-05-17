import React, { useState, useEffect } from 'react';
import {
	SafeAreaView,
	View,
	FlatList,
	TouchableHighlight,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import WalkRewardService, { BOSS_THRESHOLD, areaNames, STEP_THRESHOLD } from '@/services/WalkRewardService';
import { StepServiceInstance } from '@/services/StepService';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '@/constants/theme';
import styles from '../LogsScreen/LogsScreen.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LogsScreen({ navigation }) {
	const isFocused = useIsFocused();
	const [logs, setLogs] = useState([]);
	const [area, setArea] = useState(WalkRewardService.getCurrentAreaName());
	const [progress, setProgress] = useState(0);

	// Recompute logs, area, and progress
	const refresh = () => {
		const hist = WalkRewardService.getHistory();
		setLogs(hist);
		setArea(WalkRewardService.getCurrentAreaName());

		// Find the most recent reset point: last failure log
		const lastReset = hist.slice().reverse().find(log => !log.success);
		const baseline = lastReset ? lastReset.stepCount : 0;

		// Calculate progress based on current steps in area
		const currentSteps = WalkRewardService.stepsInArea;
		const pct = Math.max(
			0,
			Math.min(currentSteps / BOSS_THRESHOLD, 1)
		);
		setProgress(pct);
	};

	// Initial load + subscribe
	useEffect(() => {
		refresh();
		WalkRewardService.onUpdate(refresh);
		return () => WalkRewardService.offUpdate(refresh);
	}, []);

	// Handle session start/end when screen gains/loses focus
	useEffect(() => {
		if (isFocused) {
			WalkRewardService.startSession();
			refresh();
		} else {
			WalkRewardService.endSession();
		}
	}, [isFocused]);

	const handleTestBattle = async () => {
		try {
			await WalkRewardService.processSteps(STEP_THRESHOLD);
			// Refresh to show the new battle
			refresh();
		} catch (error) {
			console.error('Error running test battle:', error);
		}
	};

	const renderLog = ({ item, index }) => (
		<View>
			{!item.success && (
				<View style={styles.resetNotice}>
					<ThemedText style={styles.resetText}>
						💀 You died - Area progress reset 💀
					</ThemedText>
				</View>
			)}
			{item.success && item.isBoss && (
				<View style={styles.victoryNotice}>
					<ThemedText style={styles.victoryText}>
						🎉 Area unlocked: {areaNames[item.area + 1]}
					</ThemedText>
				</View>
			)}
			<TouchableHighlight
				style={[
					styles.logRow,
					{
						borderStartWidth: 4,
						borderStartColor: item.isItemBox
							? colors.secondary
							: item.success
								? colors.primary
								: colors.error,
					},
				]}
				underlayColor={styles.logRow.underlayColor}
				onPress={item.isItemBox ? undefined : () =>
					navigation.navigate('LogDetails', {
						logType: 'walk',
						logIndex: index,
					})
				}
			>
				<View style={styles.logRowContent}>
					<View style={styles.logRowTextContainer}>
						<View style={styles.monsterAndExpContainer}>
							{item.isItemBox ? (
								<ThemedText>📦 Item Box Found</ThemedText>
							) : (
								<>
									<ThemedText>
										{item.monsters.map(m => {
											if (typeof m === 'string') {
												return m;
											}
											return `${m.id}${m.suffix ? ` (${m.suffix})` : ''}`;
										}).join(', ')}
									</ThemedText>
									{item.success && (
										<ThemedText style={styles.expText}>
											+{item.isBoss
												? (item.area * 5 - 1) * 5 + 10
												: (item.monsters[0].level - 1) * 5 + 10} XP
										</ThemedText>
									)}
								</>
							)}
						</View>
					</View>
					{!item.isItemBox && <ChevronRight size={20} color={colors.textSecondary} />}
				</View>
			</TouchableHighlight>
		</View>
	);

	return (
		<ScreenLayout title="Walk Logs">
			<SafeAreaView style={styles.container}>
				{/* Test Battle Button */}
				<TouchableOpacity
					style={styles.testButton}
					onPress={handleTestBattle}
				>
					<ThemedText style={styles.testButtonText}>
						Test Battle ({STEP_THRESHOLD} steps)
					</ThemedText>
				</TouchableOpacity>

				<View style={styles.areaHeader}>
					<ThemedText style={styles.areaText}>{area}</ThemedText>

					<View style={styles.progressBarRow}>
						<View style={styles.progressBarContainer}>
							<View
								style={[
									styles.progressBarFill,
									{ width: `${Math.round(progress * 100)}%` },
								]}
							/>
						</View>
					</View>

					<ThemedText style={styles.progressText}>
						{Math.round(progress * 100)}%
					</ThemedText>
				</View>

				<FlatList
					data={logs}
					renderItem={renderLog}
					keyExtractor={(_, i) => String(i)}
					contentContainerStyle={styles.scrollContent}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<ThemedText style={styles.emptyText}>
								Walk to encounter enemies
							</ThemedText>
						</View>
					}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
