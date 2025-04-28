// src/services/WalkRewardService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterService from '@/services/CharacterService';
import BattleService from '@/services/BattleService';
import { StepServiceInstance } from '@/services/StepService';

const STEP_KEY = 'walk_total_steps';
const LOGS_KEY = 'walk_battle_logs';
const STEP_THRESHOLD = 10;
const MAX_LOG_ENTRIES = 50;

class WalkRewardService {
	constructor() {
		console.log('[WalkRewardService] ctor');
		this.totalSteps = 0;
		this.logs = [];
		this.listeners = new Set();

		// initialize persisted state
		this._init();

		// subscribe to daily step updates
		StepServiceInstance.on('update', ({ today }) => {
			this.processSteps(today);
		});
	}

	async _init() {
		// load stored totalSteps
		const storedSteps = await AsyncStorage.getItem(STEP_KEY);
		this.totalSteps = storedSteps ? parseInt(storedSteps, 10) : 0;

		// load stored logs
		const rawLogs = await AsyncStorage.getItem(LOGS_KEY);
		this.logs = rawLogs ? JSON.parse(rawLogs) : [];
		this._emitUpdate();

		// process any thresholds already passed
		this.processSteps(StepServiceInstance.getToday());
	}

	onUpdate(fn) {
		this.listeners.add(fn);
	}
	offUpdate(fn) {
		this.listeners.delete(fn);
	}
	_emitUpdate() {
		for (const fn of this.listeners) {
			try { fn(this.logs); } catch { }
		}
	}

	async processSteps(newTotalSteps) {
		console.log('[WalkRewardService] processSteps(', newTotalSteps, ')');

		const oldCount = Math.floor(this.totalSteps / STEP_THRESHOLD);
		const newCount = Math.floor(newTotalSteps / STEP_THRESHOLD);
		const toTrigger = newCount - oldCount;
		console.log("old = ", oldCount, ", new = ", newCount, ", toTrigger = ", toTrigger);

		// always persist updated totalSteps
		this.totalSteps = newTotalSteps;
		await AsyncStorage.setItem(STEP_KEY, String(this.totalSteps));

		if (toTrigger > 0) {
			for (let i = 0; i < toTrigger; i++) {
				// calculate the exact step count this battle corresponds to:
				const stepCountAtTrigger = (oldCount + i + 1) * STEP_THRESHOLD;
				await this._triggerBattle(stepCountAtTrigger);
			}
			this._emitUpdate();
		}
	}

	async _triggerBattle(stepCountAtTrigger) {
		try {
			// prepare hero and random monsters
			const hero = CharacterService.getCurrentCharacter();
			const types = ['Goblin', 'Orc', 'Skeleton', 'Troll', 'Bandit'];
			const type = types[Math.floor(Math.random() * types.length)];
			const count = Math.floor(Math.random() * 3) + 1;
			const monsters = Array.from({ length: count }, (_, i) => ({
				id: `${type} #${i + 1}`, level: 1
			}));

			// run the battle
			const { logs, success } = await BattleService.simulateBattle(hero, monsters);

			// record
			this.logs.unshift({
				stepCount: stepCountAtTrigger,       // record the total steps at this trigger
				success,
				monsters: monsters.map(m => m.id),
				logs
			});

			if (this.logs.length > MAX_LOG_ENTRIES) {
				this.logs.length = MAX_LOG_ENTRIES;
			}
			await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));
		} catch (e) {
			console.log(e);
		}
	}

	getHistory() {
		return this.logs;
	}
}

export default new WalkRewardService();
