import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StatsTab = ({ character }) => {
	const [equippedItems, setEquippedItems] = useState([]);

	useEffect(() => {
		const loadEquippedItems = async () => {
			try {
				const eqRaw = await AsyncStorage.getItem('equipped_items');
				const eqArr = eqRaw ? JSON.parse(eqRaw) : [];
				setEquippedItems(eqArr);
			} catch (error) {
				console.error('Error loading equipped items:', error);
			}
		};
		loadEquippedItems();
	}, []);

	if (!character) return null;

	// Calculate total stats including equipped items
	const calculateTotalStats = () => {
		const totalStats = { ...character.stats };

		equippedItems.forEach(item => {
			if (item.stats) {
				Object.entries(item.stats).forEach(([stat, value]) => {
					if (totalStats[stat] !== undefined) {
						totalStats[stat] += value;
					}
				});
			}
		});

		return totalStats;
	};

	const totalStats = calculateTotalStats();

	const renderStatRow = (label, value, unit = '') => (
		<View style={styles.statRow}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text style={styles.statValue}>{value}{unit}</Text>
		</View>
	);

	// Calculate DPS
	const dps = totalStats.attackSpeed * totalStats.damage * totalStats.attackPower;

	return (
		<ScrollView style={styles.container}>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Combat Stats</Text>
				{renderStatRow('Health', totalStats.health)}
				{renderStatRow('Damage', totalStats.damage)}
				{renderStatRow('Attack Power', totalStats.attackPower)}
				{renderStatRow('Armor', totalStats.armor || 0)}
				{renderStatRow('Attack Speed', totalStats.attackSpeed, "/s")}
				{renderStatRow('DPS', dps.toFixed(1), "/s")}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Magic Stats</Text>
				{renderStatRow('Mana', totalStats.willpower * 100)}
				{renderStatRow('Cast Speed', totalStats.castSpeed || 0, "/s")}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Attributes</Text>
				{renderStatRow('Strength', totalStats.strength)}
				{renderStatRow('Intelligence', totalStats.intelligence)}
				{renderStatRow('Dexterity', totalStats.dexterity)}
				{renderStatRow('Vitality', totalStats.vitality)}
				{renderStatRow('Willpower', totalStats.willpower)}
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
});

export default StatsTab; 