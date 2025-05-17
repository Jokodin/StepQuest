import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '@/components/ScreenLayout';
import QuestService from '@/services/QuestService';

const QuestsScreen = () => {
	const [hourlyQuest, setHourlyQuest] = useState(null);
	const [dailyQuest, setDailyQuest] = useState(null);
	const [timeLeft, setTimeLeft] = useState(0);

	useEffect(() => {
		loadQuests();
		const timer = setInterval(() => {
			if (hourlyQuest) {
				const remaining = Math.max(0, hourlyQuest.expiresAt - Date.now());
				setTimeLeft(remaining);
				if (remaining === 0) {
					loadQuests();
				}
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [hourlyQuest]);

	const loadQuests = async () => {
		try {
			const [hourly, daily] = await Promise.all([
				QuestService.getCurrentHourlyQuest(),
				QuestService.getCurrentDailyQuest()
			]);
			setHourlyQuest(hourly);
			setDailyQuest(daily);
			if (hourly) {
				setTimeLeft(Math.max(0, hourly.expiresAt - Date.now()));
			}
		} catch (error) {
			console.error('Error loading quests:', error);
		}
	};

	const formatTime = (ms) => {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const handleClaimReward = async (questType) => {
		const quest = await QuestService.claimQuestReward(questType);
		if (quest) {
			if (questType === 'hourly') {
				// Add an item box for hourly quests
				const rawBoxes = await AsyncStorage.getItem('walk_reward_boxes');
				const boxes = rawBoxes ? JSON.parse(rawBoxes) : [];
				boxes.push({ area: 1 }); // Use area 1 for quest rewards
				await AsyncStorage.setItem('walk_reward_boxes', JSON.stringify(boxes));
			} else {
				// Daily quests still give attributes
				const character = await AsyncStorage.getItem('currentCharacter');
				if (character) {
					const charData = JSON.parse(character);
					charData.stats[quest.attribute] += 1;
					await AsyncStorage.setItem('currentCharacter', JSON.stringify(charData));
				}
			}
			loadQuests();
		}
	};

	const renderQuestCard = (quest, type) => {
		if (!quest) return null;

		const timeLeftText = type === 'Daily'
			? 'Ends at midnight'
			: `Time left: ${formatTime(timeLeft)}`;

		return (
			<View style={styles.questCard}>
				<View style={styles.questHeader}>
					<Text style={styles.questTitle}>Step Challenge</Text>
					<Text style={styles.timeLeft}>{timeLeftText}</Text>
				</View>
				<Text style={styles.questDescription}>
					{type === 'Daily'
						? `Walk ${quest.stepGoal} steps to increase your ${quest.attribute}`
						: `Walk ${quest.stepGoal} steps to earn an item box`}
				</Text>
				<View style={styles.progressBar}>
					<View
						style={[
							styles.progressFill,
							{ width: `${Math.min(100, (quest.progress / quest.stepGoal) * 100)}%` }
						]}
					/>
				</View>
				<Text style={styles.progressText}>
					{quest.progress}/{quest.stepGoal} steps
				</Text>
				{quest.progress >= quest.stepGoal && !quest.completed && (
					<TouchableOpacity
						style={styles.claimButton}
						onPress={() => handleClaimReward(type.toLowerCase())}
					>
						<Text style={styles.claimButtonText}>Claim Reward</Text>
					</TouchableOpacity>
				)}
				{quest.completed && (
					<Text style={styles.completedText}>Completed!</Text>
				)}
			</View>
		);
	};

	return (
		<ScreenLayout title="Quests">
			<ScrollView style={styles.container}>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Daily Quest</Text>
					{renderQuestCard(dailyQuest, 'Daily')}
				</View>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Hourly Quest</Text>
					{renderQuestCard(hourlyQuest, 'Hourly')}
				</View>
			</ScrollView>
		</ScreenLayout>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: colors.background,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		color: colors.primary,
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	questCard: {
		backgroundColor: colors.card,
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	questHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	questTitle: {
		color: colors.text,
		fontSize: 18,
		fontWeight: 'bold',
	},
	timeLeft: {
		color: colors.primary,
		fontSize: 16,
		fontWeight: 'bold',
	},
	questDescription: {
		color: colors.text,
		fontSize: 14,
		marginBottom: 8,
	},
	progressBar: {
		height: 8,
		backgroundColor: colors.border,
		borderRadius: 4,
		marginBottom: 8,
	},
	progressFill: {
		height: '100%',
		backgroundColor: colors.primary,
		borderRadius: 4,
	},
	progressText: {
		color: colors.text,
		fontSize: 14,
		textAlign: 'right',
	},
	claimButton: {
		backgroundColor: colors.primary,
		padding: 8,
		borderRadius: 4,
		marginTop: 8,
	},
	claimButtonText: {
		color: colors.white,
		fontSize: 14,
		textAlign: 'center',
		fontWeight: 'bold',
	},
	completedText: {
		color: colors.success,
		fontSize: 14,
		textAlign: 'center',
		marginTop: 8,
		fontWeight: 'bold',
	},
});

export default QuestsScreen; 