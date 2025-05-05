// src/services/CharacterService.js
// Manages the player character: creation, storage, and retrieval.

import AsyncStorage from '@react-native-async-storage/async-storage';

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
			stats: {
				health: 100,
				damage: 1,
				attackPower: 1,
				attackSpeed: 1,
				strength: 1,
				intelligence: 1,
				dexterity: 1,
				vitality: 1,
				willpower: 1,
				castSpeed: 0.2,
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
		const totalStrength = this.getStat(this.currentCharacter, 'strength');
		// Each point of strength adds 5% to attack power
		return 1 + (totalStrength * 0.05);
	}

	/**
	 * Calculate bonus cast chance from Intelligence
	 * @returns {number} - Bonus cast chance percentage
	 */
	#calculateIntelligenceBonus() {
		const totalIntelligence = this.getStat(this.currentCharacter, 'intelligence');
		// Each point of intelligence adds 2% to cast chance
		return totalIntelligence * 2;
	}

	/**
	 * Calculate bonus attack speed from Dexterity
	 * @returns {number} - Bonus attack speed multiplier
	 */
	#calculateDexterityBonus() {
		const totalDexterity = this.getStat(this.currentCharacter, 'dexterity');
		// Each point of dexterity adds 3% to attack speed
		return 1 + (totalDexterity * 0.03);
	}

	/**
	 * Calculate bonus health from Vitality
	 * @returns {number} - Bonus health multiplier
	 */
	#calculateVitalityBonus() {
		const totalVitality = this.getStat('vitality');
		// Each point of vitality adds 10% to health
		return 1 + (totalVitality * 0.10);
	}

	/**
	 * Calculate bonus mana from Willpower
	 * @returns {number} - Bonus mana multiplier
	 */
	#calculateWillpowerBonus() {
		const totalWillpower = this.getStat('willpower');
		// Each point of willpower adds 15% to mana
		return 1 + (totalWillpower * 0.15);
	}

	/**
	 * Get a character's final stat value including base stats, item bonuses, and attribute bonuses
	 * @param {string} statName - Name of the stat to calculate
	 * @returns {number} - Final stat value
	 */
	getStat(statName) {
		const baseValue = this.currentCharacter.stats[statName] || 0;

		// Sum stat from equipped items
		const itemValue = this.currentCharacter.gear.reduce((sum, itemId) => {
			const item = this.getItem(itemId);
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
				return (baseValue + itemValue) * this.#calculateWillpowerBonus();

			default:
				return baseValue + itemValue;
		}
	}

	static async getCharacter(characterId) {
		try {
			const character = await AsyncStorage.getItem(`character_${characterId}`);
			if (!character) return null;

			const parsedCharacter = JSON.parse(character);
			// Ensure spells array exists
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
}

export default new CharacterService();
