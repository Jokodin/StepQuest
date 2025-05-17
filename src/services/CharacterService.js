// src/services/CharacterService.js
// Manages the player character: creation, storage, and retrieval.

import AsyncStorage from '@react-native-async-storage/async-storage';
import SkillService from './SkillService';

const STORAGE_KEY = 'currentCharacter';

class CharacterService {
	constructor() {
		this.currentCharacter = null;
		this._init();
	}

	async _init() {
		try {
			const stored = await AsyncStorage.getItem(STORAGE_KEY);
			if (stored) {
				this.currentCharacter = JSON.parse(stored);
			} else {
				await this.createNewCharacter();
			}
		} catch (e) {
			console.error('Failed to load character', e);
			await this.createNewCharacter();
		}
	}

	getCurrentCharacter() {
		if (!this.currentCharacter) {
			throw new Error('Character not initialized yet');
		}
		return this.currentCharacter;
	}

	async createNewCharacter() {
		const newChar = {
			id: Date.now().toString(),
			createdAt: Date.now(),
			name: 'Joko',
			level: 1,
			exp: 0,
			expToNextLevel: 100,
			stats: {
				health: 10,
				damage: 1,
				attackPower: 1,
				attackSpeed: 1,
				strength: 0,
				intelligence: 0,
				dexterity: 0,
				vitality: 0,
				willpower: 0,
				castSpeed: 1,
				mana: 10,
			},
			gear: [],            // list of equipped gear IDs
		};
		this.currentCharacter = newChar;
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newChar));
		} catch (e) {
			console.error('Failed to save new character', e);
		}
		return newChar;
	}

	/**
	 * Partially update character stats.
	 * @param {object} statsUpdates  e.g. { hp: 500, attackPower: 130 }
	 */
	async updateStats(statsUpdates) {
		const updated = {
			...this.getCurrentCharacter(),
			stats: {
				...this.getCurrentCharacter().stats,
				...statsUpdates,
			},
		};
		this.currentCharacter = updated;
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch (e) {
			console.error('Failed to save updated character', e);
		}
		return updated;
	}

	/**
	 * Completely override character data (e.g. name/avatar).
	 * @param {object} dataUpdates
	 */
	async updateCharacter(dataUpdates) {
		const updated = {
			...this.getCurrentCharacter(),
			...dataUpdates,
		};
		this.currentCharacter = updated;
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch (e) {
			console.error('Failed to save updated character', e);
		}
		return updated;
	}

	/**
	 * Equip an item: add its id to gear list and add its stats.
	 * @param {{ id: string, stats: Record<string,number> }} item
	 */
	async equipItem(item) {
		const char = this.getCurrentCharacter();
		// 1) merge gear array
		const newGear = Array.from(new Set([...(char.gear || []), item.id]));
		// 2) compute new stats by summing each stat
		const newStats = { ...char.stats };
		for (const [stat, bonus] of Object.entries(item.stats)) {
			newStats[stat] = (newStats[stat] || 0) + bonus;
		}
		// 3) persist both gear & stats
		await this.updateCharacter({ gear: newGear });
		return this.updateStats(newStats);
	}

	/**
	 * Unequip an item: remove its id and subtract its stats.
	 * @param {{ id: string, stats: Record<string,number> }} item
	 */
	async unequipItem(item) {
		const char = this.getCurrentCharacter();
		const newGear = (char.gear || []).filter(gid => gid !== item.id);
		const newStats = { ...char.stats };
		for (const [stat, bonus] of Object.entries(item.stats)) {
			newStats[stat] = (newStats[stat] || 0) - bonus;
		}
		await this.updateCharacter({ gear: newGear });
		return this.updateStats(newStats);
	}

	/**
	 * Calculate bonus attack power from Strength
	 * @returns {number} - Bonus attack power multiplier
	 */
	#calculateStrengthBonus() {
		const totalStrength = this.currentCharacter.stats.strength || 0;
		// Each point of strength adds 5% to attack power
		return 1 + (totalStrength * 0.05);
	}

	/**
	 * Calculate bonus cast chance from Intelligence
	 * @returns {number} - Bonus cast chance percentage
	 */
	#calculateIntelligenceBonus() {
		const totalIntelligence = this.currentCharacter.stats.intelligence || 0;
		// Each point of intelligence adds 2% to cast chance
		return totalIntelligence * 2;
	}

	/**
	 * Calculate bonus attack speed from Dexterity
	 * @returns {number} - Bonus attack speed multiplier
	 */
	#calculateDexterityBonus() {
		const totalDexterity = this.currentCharacter.stats.dexterity || 0;
		// Each point of dexterity adds 3% to attack speed
		return 1 + (totalDexterity * 0.03);
	}

	/**
	 * Calculate bonus health from Vitality
	 * @returns {number} - Bonus health multiplier
	 */
	#calculateVitalityBonus() {
		const totalVitality = this.currentCharacter.stats.vitality || 0;
		// Each point of vitality adds 10% to health
		return 1 + (totalVitality * 0.10);
	}

	/**
	 * Calculate bonus mana from Willpower
	 * @returns {number} - Bonus mana multiplier
	 */
	#calculateWillpowerBonus() {
		const totalWillpower = this.currentCharacter.stats.willpower || 0;
		// Each point of willpower adds 15% to mana
		return (totalWillpower * 0.15);
	}

	/**
	 * Get a character's final stat value including base stats, item bonuses, attribute bonuses, and skill bonuses
	 * @param {string} statName - Name of the stat to calculate
	 * @param {Array<{type: string, attribute: string, value: number}>} skillBonuses - Array of skill bonuses to apply
	 * @returns {number} - Final stat value
	 */
	async getStat(statName, skillBonuses = []) {
		const baseValue = this.currentCharacter.stats[statName] || 0;

		// Load equipped items from AsyncStorage
		let equippedItems = [];
		try {
			const equippedRaw = await AsyncStorage.getItem('equipped_items');
			equippedItems = equippedRaw ? JSON.parse(equippedRaw) : [];
		} catch (error) {
			console.error('Error loading equipped items:', error);
		}

		// Sum stat from equipped items
		const itemValue = equippedItems.reduce((sum, item) => {
			return sum + (item?.stats?.[statName] || 0);
		}, 0);

		// Apply attribute bonuses for specific stats
		switch (statName) {
			case 'attackPower':
				return (baseValue + itemValue) * this.#calculateStrengthBonus();

			case 'attackSpeed':
				return (baseValue + itemValue) * this.#calculateDexterityBonus();

			case 'castChance':
				return baseValue + itemValue + this.#calculateIntelligenceBonus();

			case 'health':
				return (baseValue + itemValue) * this.#calculateVitalityBonus();

			case 'mana':
				return (baseValue + itemValue) + this.#calculateWillpowerBonus();

			default:
				return baseValue + itemValue;
		}
	}

	static async getCharacter(characterId) {
		try {
			const character = await AsyncStorage.getItem(STORAGE_KEY);
			if (!character) return null;
			const parsedCharacter = JSON.parse(character);
			if (!parsedCharacter.spells) {
				parsedCharacter.spells = [];
			}
			return parsedCharacter;
		} catch (error) {
			console.error('Error getting character:', error);
			return null;
		}
	}

	static async saveCharacter(character) {
		try {
			// Ensure spells array exists
			if (!character.spells) {
				character.spells = [];
			}
			await AsyncStorage.setItem(`character_${character.id}`, JSON.stringify(character));
		} catch (error) {
			console.error('Error saving character:', error);
		}
	}

	static async addSpell(characterId, spellKey) {
		try {
			const character = await this.getCharacter(characterId);
			if (!character) return false;

			if (!character.spells.includes(spellKey)) {
				character.spells.push(spellKey);
				await this.saveCharacter(character);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error adding spell:', error);
			return false;
		}
	}

	static async removeSpell(characterId, spellKey) {
		try {
			const character = await this.getCharacter(characterId);
			if (!character) return false;

			const index = character.spells.indexOf(spellKey);
			if (index !== -1) {
				character.spells.splice(index, 1);
				await this.saveCharacter(character);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error removing spell:', error);
			return false;
		}
	}

	/**
	 * Add experience points to the character
	 * @param {number} exp - Amount of experience to add
	 * @returns {Promise<object>} - Updated character object
	 */
	async addExp(exp) {
		const char = this.getCurrentCharacter();
		char.exp += exp;

		// Check for level up
		while (char.exp >= char.expToNextLevel) {
			char.exp -= char.expToNextLevel;
			char.level += 1;
			// Increase exp requirement for next level (exponential scaling)
			char.expToNextLevel = Math.floor(100 * Math.pow(1.5, char.level - 1));

			// Add a skill point when leveling up
			await SkillService.addSkillPoint();
		}

		this.currentCharacter = char;
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(char));
		} catch (e) {
			console.error('Failed to save character after exp gain', e);
		}
		return char;
	}
}

export default new CharacterService();
