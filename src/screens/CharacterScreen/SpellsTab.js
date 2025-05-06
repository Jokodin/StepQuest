import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/constants/theme';
import SpellService from '@/services/SpellService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SpellsTab = ({ character }) => {
	const [equippedItems, setEquippedItems] = useState([]);

	useEffect(() => {
		const loadEquippedItems = async () => {
			try {
				const eqRaw = await AsyncStorage.getItem('equipped_items');
				const eqArr = eqRaw ? JSON.parse(eqRaw) : [];
				//console.log('Loaded equipped items:', eqArr);
				setEquippedItems(eqArr);
			} catch (error) {
				console.error('Error loading equipped items:', error);
			}
		};
		loadEquippedItems();
	}, []);

	// Get all spells from character and equipped amulets
	const getAllSpells = () => {
		const spells = new Set();

		// Add character's spells
		if (character?.spells) {
			//console.log('Character spells:', character.spells);
			character.spells.forEach(spell => spells.add(spell));
		}

		// Add spells from equipped amulets
		equippedItems.forEach(item => {
			//console.log('Checking item:', item);
			if (item.type === 'amulet' && item.stats?.spell) {
				//console.log('Found spell in amulet:', item.stats.spell);
				spells.add(item.stats.spell);
			}
		});

		const spellArray = Array.from(spells);
		//console.log('All spells:', spellArray);
		return spellArray;
	};

	const spells = getAllSpells();

	if (spells.length === 0) {
		return (
			<View style={styles.container}>
				<Text style={styles.emptyText}>No spells equipped</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			{spells.map((spellKey, index) => {
				const spell = SpellService.getSpell(spellKey);
				//console.log('Rendering spell:', spellKey, spell);
				if (!spell) return null;

				return (
					<View key={`${spellKey}-${index}`} style={styles.spellCard}>
						<View style={styles.spellHeader}>
							<Text style={styles.spellName}>{spell.name}</Text>
							<Text style={styles.manaCost}>{spell.manaCost} Mana</Text>
						</View>
						<Text style={styles.spellDescription}>{spell.description}</Text>
						<View style={styles.spellStats}>
							{spell.damage && (
								<Text style={styles.statText}>Damage: {spell.damage}</Text>
							)}
							{spell.healing && (
								<Text style={styles.statText}>Healing: {spell.healing}</Text>
							)}
						</View>
					</View>
				);
			})}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: colors.background,
	},
	emptyText: {
		color: colors.text,
		fontSize: 16,
		textAlign: 'center',
		marginTop: 20,
	},
	spellCard: {
		backgroundColor: colors.card,
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	spellHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	spellName: {
		color: colors.text,
		fontSize: 18,
		fontWeight: 'bold',
	},
	manaCost: {
		color: colors.primary,
		fontSize: 16,
		fontWeight: 'bold',
	},
	spellDescription: {
		color: colors.text,
		fontSize: 14,
		marginBottom: 8,
	},
	spellStats: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	statText: {
		color: colors.text,
		fontSize: 14,
	},
});

export default SpellsTab; 