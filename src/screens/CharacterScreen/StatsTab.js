import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterService from '@/services/CharacterService';
import SkillService from '@/services/SkillService';

const StatsTab = ({ character }) => {
	const [equippedItems, setEquippedItems] = useState([]);
	const [skillBonuses, setSkillBonuses] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState({});

	useEffect(() => {
		const loadData = async () => {
			try {
				// Load equipped items
				const eqRaw = await AsyncStorage.getItem('equipped_items');
				const eqArr = eqRaw ? JSON.parse(eqRaw) : [];
				setEquippedItems(eqArr);

				// Load skill bonuses
				const state = SkillService.getCurrentState();
				if (state && Array.isArray(state.selectedSkills)) {
					setSkillBonuses(state.selectedSkills);
				} else {
					setSkillBonuses([]);
				}

				// Calculate all stats
				const calculatedStats = {
					health: await CharacterService.getStat('health', state?.selectedSkills || []),
					damage: await CharacterService.getStat('damage', state?.selectedSkills || []),
					attackPower: await CharacterService.getStat('attackPower', state?.selectedSkills || []),
					armor: await CharacterService.getStat('armor', state?.selectedSkills || []),
					attackSpeed: await CharacterService.getStat('attackSpeed', state?.selectedSkills || []),
					mana: await CharacterService.getStat('mana', state?.selectedSkills || []),
					castSpeed: await CharacterService.getStat('castSpeed', state?.selectedSkills || []),
					strength: await CharacterService.getStat('strength', state?.selectedSkills || []),
					intelligence: await CharacterService.getStat('intelligence', state?.selectedSkills || []),
					dexterity: await CharacterService.getStat('dexterity', state?.selectedSkills || []),
					vitality: await CharacterService.getStat('vitality', state?.selectedSkills || []),
					willpower: await CharacterService.getStat('willpower', state?.selectedSkills || [])
				};
				setStats(calculatedStats);
			} catch (error) {
				console.error('Error loading data:', error);
				setSkillBonuses([]);
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, []);

	if (!character || isLoading) {
		return (
			<View style={styles.container}>
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		);
	}

	const renderStatRow = (label, value, unit = '') => (
		<View style={styles.statRow}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={styles.statValue}>{typeof value === 'number' && label === 'Armor' ? value.toFixed(1) : value}{unit}</Text>
		</View>
	);

	// Calculate DPS using stats
	const dps = stats.attackSpeed * stats.damage * stats.attackPower;

	return (
		<ScrollView style={styles.container}>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Character</Text>
				{renderStatRow('Level', character.level)}
				{renderStatRow('Experience', `${character.exp}/${character.expToNextLevel}`)}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Combat Stats</Text>
				{renderStatRow('Health', stats.health)}
				{renderStatRow('Damage', stats.damage)}
				{renderStatRow('Attack Power', stats.attackPower)}
				{renderStatRow('Armor', stats.armor)}
				{renderStatRow('Attack Speed', stats.attackSpeed, "/s")}
				{renderStatRow('DPS', dps.toFixed(1), "/s")}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Magic Stats</Text>
				{renderStatRow('Mana', stats.mana)}
				{renderStatRow('Cast Speed', stats.castSpeed, "/s")}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Attributes</Text>
				{renderStatRow('Strength', stats.strength)}
				{renderStatRow('Intelligence', stats.intelligence)}
				{renderStatRow('Dexterity', stats.dexterity)}
				{renderStatRow('Vitality', stats.vitality)}
				{renderStatRow('Willpower', stats.willpower)}
			</View>
		</ScrollView>
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
		backgroundColor: colors.card,
		borderRadius: 8,
		padding: 16,
		borderWidth: 1,
		borderColor: colors.border,
	},
	sectionTitle: {
		color: colors.primary,
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	statRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	statLabel: {
		color: colors.text,
		fontSize: 16,
	},
	statValue: {
		color: colors.text,
		fontSize: 16,
		fontWeight: 'bold',
	},
	loadingText: {
		color: colors.text,
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
		marginTop: 24,
	},
});

export default StatsTab; 