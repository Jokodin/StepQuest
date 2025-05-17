import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterService from '@/services/CharacterService';
import BattleService from '@/services/BattleService';
import { StepServiceInstance } from '@/services/StepService';
import QuestService from '@/services/QuestService';

const LOGS_KEY = 'walk_battle_logs';
const AREA_KEY = 'walk_current_area';
const LAST_STEPS_KEY = 'walk_last_steps';
const BOXES_KEY = 'walk_reward_boxes';
export const STEP_THRESHOLD = 500;
export const BOSS_THRESHOLD = 10000;
const MAX_LOG_ENTRIES = 20;
const ITEM_BOX_CHANCE = 0.05;
const ITEM_BOX_STEP_INTERVAL = 100;

// Define themed monster lists per area
const areaThemes = {
	1: ['Zombie', 'Skeleton', 'Ghoul', 'Vampire'],
	2: ['Slime', 'Evil Tree', 'Fungus Monster', 'Gelatinous Cube'],
	3: ['Pirate Ghost', 'Cursed Parrot', 'Kraken Spawn', 'Drowned Sailor'],
	4: ['Fire Imp', 'Lava Golem', 'Ash Wraith', 'Magma Serpent'],
};

// Thematic names for each area
export const areaNames = {
	1: 'Crypt of the Damned',
	2: 'Slime Bog',
	3: 'Pirate Cove',
	4: 'Volcanic Crater',
};

class WalkRewardService {
	constructor() {
		this.logs = [];
		this.listeners = new Set();
		this.currentArea = 1;
		this.stepsInArea = 0;
		this.lastLifetimeSteps = 0;
		this.isInitialized = false;

		this._init();
		this._onStepUpdate = this._onStepUpdate.bind(this);
		StepServiceInstance.on('update', this._onStepUpdate);
	}

	async _init() {
		const rawLogs = await AsyncStorage.getItem(LOGS_KEY);
		this.logs = rawLogs ? JSON.parse(rawLogs) : [];

		const rawArea = await AsyncStorage.getItem(AREA_KEY);
		this.currentArea = rawArea ? +rawArea : 1;

		// Wait for StepService to be ready
		await new Promise(resolve => {
			let attempts = 0;
			const maxAttempts = 10; // 5 seconds total
			const interval = 500; // Check every 500ms

			const check = () => {
				const lifetime = StepServiceInstance.getLifetime();
				this.lastLifetimeSteps = lifetime;
				this.isInitialized = true;
				resolve();
			};

			// Start checking
			check();
		});

		await AsyncStorage.setItem(LAST_STEPS_KEY, String(this.lastLifetimeSteps));
		this._emitUpdate();
	}

	// Call this when app becomes active
	async startSession() {
		if (!this.isInitialized) {
			return;
		}

		const currentLifetimeSteps = StepServiceInstance.getLifetime();
		const newSteps = currentLifetimeSteps - this.lastLifetimeSteps;

		if (newSteps > 0) {
			await this.processSteps(newSteps);
		}
	}

	// Call this when app becomes inactive
	endSession() {
		if (!this.isInitialized) return;

		this.lastLifetimeSteps = StepServiceInstance.getLifetime();
		AsyncStorage.setItem(LAST_STEPS_KEY, String(this.lastLifetimeSteps));
	}

	async processSteps(newSteps) {
		if (!this.isInitialized) return;

		// Check for item boxes every ITEM_BOX_STEP_INTERVAL steps
		for (let i = 0; i < newSteps; i += ITEM_BOX_STEP_INTERVAL) {
			if (Math.random() < ITEM_BOX_CHANCE) {
				// Found an item box
				const rawBoxes = await AsyncStorage.getItem(BOXES_KEY);
				const boxes = rawBoxes ? JSON.parse(rawBoxes) : [];
				boxes.push({ area: this.currentArea });
				await AsyncStorage.setItem(BOXES_KEY, JSON.stringify(boxes));

				// Add item box discovery to logs
				const itemBoxEntry = {
					area: this.currentArea,
					areaName: this.getCurrentAreaName(),
					stepCount: this.stepsInArea + i,
					success: true,
					isItemBox: true,
					monsters: [],
					logs: [{
						actor: 'system',
						actorMaxHp: 0,
						actorCurrentHp: 0,
						timestamp: 0,
						displayText: `You found an item box!`
					}]
				};
				this.logs = [itemBoxEntry, ...this.logs].slice(0, MAX_LOG_ENTRIES);
				await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));
			}
		}

		if (newSteps < STEP_THRESHOLD) {
			return;
		}

		// Process battles one at a time until we run out of steps
		while (newSteps >= STEP_THRESHOLD) {
			this.stepsInArea += STEP_THRESHOLD;
			const isBoss = this.stepsInArea >= BOSS_THRESHOLD && (this.stepsInArea - STEP_THRESHOLD) < BOSS_THRESHOLD;

			const battleLog = await this._runBattle(this.stepsInArea, isBoss);
			this.logs = [battleLog, ...this.logs].slice(0, MAX_LOG_ENTRIES);
			await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));

			newSteps -= STEP_THRESHOLD;

			if (!battleLog.success) {
				this.stepsInArea = 0;
			} else if (isBoss) {
				this.stepsInArea = 0;
			}
		}

		this._emitUpdate();
	}

	async _onStepUpdate({ lifetime }) {
		if (!this.isInitialized) return;

		const newSteps = lifetime - this.lastLifetimeSteps;
		if (newSteps <= 0) {
			return;
		}

		await this.processSteps(newSteps);
		this.lastLifetimeSteps = lifetime;
		await AsyncStorage.setItem(LAST_STEPS_KEY, String(this.lastLifetimeSteps));

		// Update quest progress for both daily and hourly quests
		try {
			await QuestService.updateQuestProgress(lifetime);
		} catch (error) {
			console.error('Error updating quest progress:', error);
		}
	}

	async _runBattle(stepCountAtTrigger, isBoss) {
		let monsters;
		if (isBoss) {
			monsters = [{ id: `Boss of ${this.getCurrentAreaName()}`, level: this.currentArea * 5 }];
		} else {
			const themeList = areaThemes[this.currentArea] || [];
			const count = themeList.length;
			const baseLevel = (this.currentArea - 1) * count;

			// Calculate progress percentage
			const progress = (this.stepsInArea / BOSS_THRESHOLD) * 100;

			// Determine monster index based on progress
			let monsterIndex;
			if (progress < 25) {
				monsterIndex = 0; // First monster
			} else if (progress < 50) {
				monsterIndex = 1; // Second monster
			} else if (progress < 75) {
				monsterIndex = 2; // Third monster
			} else {
				monsterIndex = 3; // Fourth monster
			}

			const type = themeList[monsterIndex];
			const level = baseLevel + monsterIndex + 1;
			monsters = [{ id: type, level }];
		}

		const { logs, success } = await BattleService.simulateBattle(monsters);

		const entry = {
			area: this.currentArea,
			areaName: this.getCurrentAreaName(),
			stepCount: stepCountAtTrigger,
			success,
			monsters: monsters.map(m => {
				// Get the monster's suffix from the battle log
				const monsterLog = logs.find(log => log.actor === m.id);
				const suffix = monsterLog ? monsterLog.suffix : 'Normal';
				return {
					id: m.id,
					level: m.level,
					suffix: suffix
				};
			}),
			logs,
			isBoss,
		};

		if (success) {
			// Award EXP based on monster level and type
			const expGain = isBoss
				? (this.currentArea * 5 - 1) * 5 + 10 // Boss EXP using the same formula
				: (monsters[0].level - 1) * 5 + 10; // Regular monster EXP

			await CharacterService.addExp(expGain);

			if (isBoss) {
				this.currentArea++;
				await AsyncStorage.setItem(AREA_KEY, String(this.currentArea));
			}
		}

		return entry;
	}

	getCurrentAreaName() {
		return areaNames[this.currentArea] || `Area ${this.currentArea}`;
	}

	getHistory() {
		return this.logs;
	}

	async reset() {
		this.logs = [];
		await AsyncStorage.removeItem(LOGS_KEY);
		this.currentArea = 1;
		this.stepsInArea = 0;
		this.lastLifetimeSteps = StepServiceInstance.getLifetime();
		await AsyncStorage.removeItem(AREA_KEY);
		await AsyncStorage.setItem(LAST_STEPS_KEY, String(this.lastLifetimeSteps));
		this._emitUpdate();
	}

	onUpdate(fn) { this.listeners.add(fn); }
	offUpdate(fn) { this.listeners.delete(fn); }
	_emitUpdate() { this.listeners.forEach(fn => fn(this.logs)); }
}

export default new WalkRewardService();