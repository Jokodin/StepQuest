import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterService from '@/services/CharacterService';
import BattleService from '@/services/BattleService';
import { StepServiceInstance } from '@/services/StepService';
import QuestService from '@/services/QuestService';

const LOGS_KEY = 'walk_battle_logs';
const BOXES_KEY = 'walk_reward_boxes';
const AREA_KEY = 'walk_current_area';
const LAST_STEPS_KEY = 'walk_last_steps';
const STEP_THRESHOLD = 5;
export const BOSS_THRESHOLD = 20;
const MAX_LOG_ENTRIES = 50;

// Define themed monster lists per area
const areaThemes = {
	1: ['Skeleton', 'Ghost', 'Zombie', 'Wraith'],
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
		// //console.log('[WalkRewardService] Initializing');
		const rawLogs = await AsyncStorage.getItem(LOGS_KEY);
		// //console.log('[WalkRewardService] Raw logs from storage:', rawLogs);
		this.logs = rawLogs ? JSON.parse(rawLogs) : [];
		// //console.log('[WalkRewardService] Parsed logs:', this.logs);

		if (!(await AsyncStorage.getItem(BOXES_KEY))) {
			await AsyncStorage.setItem(BOXES_KEY, JSON.stringify([]));
		}

		const rawArea = await AsyncStorage.getItem(AREA_KEY);
		this.currentArea = rawArea ? +rawArea : 1;

		// Wait for StepService to be ready
		await new Promise(resolve => {
			let attempts = 0;
			const maxAttempts = 10; // 5 seconds total
			const interval = 500; // Check every 500ms

			const check = () => {
				const lifetime = StepServiceInstance.getLifetime();
				////console.log('[WalkRewardService] Checking StepService lifetime:', lifetime);

				// Initialize with whatever value we get, even if it's 0
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
		//console.log('[WalkRewardService] Starting session');
		if (!this.isInitialized) {
			//console.log('[WalkRewardService] Not initialized yet, waiting...');
			return;
		}

		const currentLifetimeSteps = StepServiceInstance.getLifetime();
		const newSteps = currentLifetimeSteps - this.lastLifetimeSteps;

		if (newSteps > 0) {
			//console.log(`[WalkRewardService] Processing ${newSteps} new steps since last check`);
			await this.processSteps(newSteps);
		}
	}

	// Call this when app becomes inactive
	endSession() {
		//console.log('[WalkRewardService] Ending session');
		if (!this.isInitialized) return;

		this.lastLifetimeSteps = StepServiceInstance.getLifetime();
		AsyncStorage.setItem(LAST_STEPS_KEY, String(this.lastLifetimeSteps));
	}

	async processSteps(newSteps) {
		if (!this.isInitialized) return;

		//console.log(`[WalkRewardService] Processing ${newSteps} new steps (current area steps: ${this.stepsInArea})`);
		if (newSteps < STEP_THRESHOLD) {
			//console.log('[WalkRewardService] Not enough steps for a battle');
			return;
		}

		// Process battles one at a time until we run out of steps
		while (newSteps >= STEP_THRESHOLD) {
			this.stepsInArea += STEP_THRESHOLD;
			const isBoss = this.stepsInArea >= BOSS_THRESHOLD && (this.stepsInArea - STEP_THRESHOLD) < BOSS_THRESHOLD;

			//console.log(`[WalkRewardService] Triggering battle at ${this.stepsInArea} steps (${isBoss ? 'BOSS' : 'regular'})`);
			const battleLog = await this._runBattle(this.stepsInArea, isBoss);
			this.logs = [battleLog, ...this.logs].slice(0, MAX_LOG_ENTRIES);
			await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));

			newSteps -= STEP_THRESHOLD;

			if (!battleLog.success) {
				// On any battle loss, reset area progress
				//console.log('[WalkRewardService] Battle lost, resetting area progress');
				this.stepsInArea = 0;
			} else if (isBoss) {
				// On boss victory, move to next area
				//console.log('[WalkRewardService] Boss defeated, moving to next area');
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

		//console.log(`[WalkRewardService] Received ${newSteps} new steps`);
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
		//console.log(`[WalkRewardService] Running ${isBoss ? 'boss' : 'regular'} battle in area ${this.currentArea}`);
		const hero = CharacterService.getCurrentCharacter();
		let monsters;
		if (isBoss) {
			monsters = [{ id: `Boss of ${this.getCurrentAreaName()}`, level: this.currentArea * 5 }];
		} else {
			const themeList = areaThemes[this.currentArea] || [];
			const count = themeList.length;
			const baseLevel = (this.currentArea - 1) * count;
			const idx = Math.floor(Math.random() * count);
			const type = themeList[idx];
			const level = baseLevel + idx + 1;
			monsters = [{ id: type, level }];
		}

		const { logs, success } = await BattleService.simulateBattle(hero, monsters);
		//console.log(`[WalkRewardService] Battle ${success ? 'won' : 'lost'} against ${monsters.map(m => m.id).join(', ')}`);

		const entry = {
			area: this.currentArea,
			areaName: this.getCurrentAreaName(),
			stepCount: stepCountAtTrigger,
			success,
			monsters: monsters.map(m => m.id),
			logs,
			isBoss,
		};

		//console.log('[WalkRewardService] Created battle entry:', entry);

		if (success) {
			const rawBoxes = await AsyncStorage.getItem(BOXES_KEY);
			const boxes = rawBoxes ? JSON.parse(rawBoxes) : [];
			boxes.push({ earnedAt: Date.now(), area: this.currentArea });
			await AsyncStorage.setItem(BOXES_KEY, JSON.stringify(boxes));

			if (isBoss) {
				this.currentArea++;
				await AsyncStorage.setItem(AREA_KEY, String(this.currentArea));
				//console.log('[WalkRewardService] Boss defeated, moving to area', this.currentArea);
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
		//console.log('[WalkRewardService] Resetting service');
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