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

	getStats() {
		return this.getCurrentCharacter().stats;
	}

	getStat(key) {
		return this.getStats()[key];
	}

	async createNewCharacter() {
		const newChar = {
			id: Date.now().toString(),
			createdAt: Date.now(),
			name: 'Joko',
			stats: {
				health: 10,
				attackPower: 1,
				defense: 0,
				attackSpeed: 1,
				mana: 0,
				castChance: 0,
				spellPower: 0,
			},
			gear: [],            // list of equipped gear IDs
			skills: [],          // list of learned skill IDs
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
}

export default new CharacterService();
