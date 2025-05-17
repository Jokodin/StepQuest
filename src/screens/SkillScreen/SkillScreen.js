import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import SkillService from '@/services/SkillService';
import CharacterService from '@/services/CharacterService';
import { colors } from '@/constants/theme';
import ScreenLayout from '@/components/ScreenLayout';
import ThemedText from '@/components/ThemedText';

export default function SkillScreen() {
	const [skillState, setSkillState] = useState(null);
	const [character, setCharacter] = useState(null);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		const state = SkillService.getCurrentState();
		const char = await CharacterService.getCurrentCharacter();
		setSkillState(state);
		setCharacter(char);
	};

	const handleSkillSelect = async (index) => {
		try {
			await SkillService.selectSkill(index);
			await loadData();
		} catch (error) {
			console.error('Failed to select skill:', error);
		}
	};

	if (!skillState || !character) {
		return (
			<ScreenLayout title="Skills">
				<View style={styles.container}>
					<ThemedText style={styles.loadingText}>Loading...</ThemedText>
				</View>
			</ScreenLayout>
		);
	}

	return (
		<ScreenLayout title="Skills">
			<ScrollView style={styles.container}>
				<View style={styles.header}>
					<ThemedText style={styles.title}>Skills</ThemedText>
					<ThemedText style={styles.subtitle}>
						Available Points: {skillState.availablePoints}
					</ThemedText>
				</View>

				{skillState.availablePoints > 0 && (
					<View style={styles.section}>
						<ThemedText style={styles.sectionTitle}>
							Choose a Skill
						</ThemedText>
						{skillState.currentOptions.length === 0 && (
							<TouchableOpacity
								style={styles.button}
								onPress={() => {
									SkillService.generateSkillOptions();
									loadData();
								}}
							>
								<ThemedText style={styles.buttonText}>
									Generate Options
								</ThemedText>
							</TouchableOpacity>
						)}
						{skillState.currentOptions.map((option, index) => (
							<TouchableOpacity
								key={index}
								style={styles.optionCard}
								onPress={() => handleSkillSelect(index)}
							>
								<ThemedText style={styles.optionTitle}>
									{option.description}
								</ThemedText>
								{option.type === 'item' && (
									<ThemedText style={styles.optionSubtitle}>
										{Object.entries(option.item.stats)
											.map(([stat, value]) => `${stat}: ${value}`)
											.join(', ')}
									</ThemedText>
								)}
							</TouchableOpacity>
						))}
					</View>
				)}

				{skillState.selectedSkills.length > 0 && (
					<View style={styles.section}>
						<ThemedText style={styles.sectionTitle}>
							Selected Skills
						</ThemedText>
						{skillState.selectedSkills.map((skill, index) => (
							<View
								key={index}
								style={styles.selectedCard}
							>
								<ThemedText style={styles.selectedTitle}>
									{skill.description}
								</ThemedText>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</ScreenLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	header: {
		marginBottom: 24,
		padding: 16,
		backgroundColor: colors.surface,
		borderRadius: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	button: {
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 16,
		backgroundColor: colors.primary,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	optionCard: {
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		backgroundColor: colors.surface,
	},
	optionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	optionSubtitle: {
		fontSize: 14,
	},
	selectedCard: {
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		backgroundColor: colors.surface,
	},
	selectedTitle: {
		fontSize: 16,
	},
	loadingText: {
		fontSize: 16,
		textAlign: 'center',
		marginTop: 24,
	},
}); 