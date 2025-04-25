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
			// AsyncStorage.removeItem(STORAGE_KEY);
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
			avatarUri: null,
			stats: {
				hp: 100,            // Health
				mp: 0,            // Mana
				stamina: 100,
				attackPower: 100,
				spellPower: 0,
				defensePower: 0,
				attackSpeed: 1,
				critChance: 0,     // percent
				dodgeChance: 0,    // percent
				accuracy: 50,       // percent
				castChance: 0,     // percent
				blockChance: 0,    // percent
				age: 0
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
}

export default new CharacterService();
