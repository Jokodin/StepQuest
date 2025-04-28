// src/services/TownDefenseService.js

import CharacterService from '@/services/CharacterService';
import BattleService from '@/services/BattleService';

class TownDefenseService {
	constructor({ attackIntervalMs = 60 * 1000 } = {}) {
		this.attackIntervalMs = attackIntervalMs;
		this.attackTimer = null;
		this.listeners = {};

		this.threatLevel = 5;
		this.history = [];
		// track when the last attack actually occurred
		this.lastAttackTime = Date.now();
		this._generateNextAttackMonsters();
	}

	on(event, fn) {
		if (!this.listeners[event]) this.listeners[event] = new Set();
		this.listeners[event].add(fn);
	}
	off(event, fn) {
		this.listeners[event]?.delete(fn);
	}
	emit(event, payload) {
		this.listeners[event]?.forEach(fn => {
			try { fn(payload); } catch { }
		});
	}

	startAttacks() {
		this.stopAttacks();
		this.lastAttackTime = Date.now();
		this._generateNextAttackMonsters();
		this._scheduleNext();
	}

	stopAttacks() {
		clearTimeout(this.attackTimer);
		this.attackTimer = null;
	}

	_scheduleNext() {
		clearTimeout(this.attackTimer);
		const nextDue = this.lastAttackTime + this.attackIntervalMs;
		const delay = Math.max(0, nextDue - Date.now());
		this.attackTimer = setTimeout(() => this._runSingleAttack(false), delay);
	}

	async processMissedAttacks() {
		// clear any in-flight timer
		this.stopAttacks();

		const now = Date.now();
		const interval = this.attackIntervalMs;
		// how many intervals have passed since lastAttackTime?
		let missed = Math.floor((now - this.lastAttackTime) / interval);
		if (missed < 0) missed = 0;

		// run each missed attack with its scheduled timestamp
		for (let i = 0; i < missed; i++) {
			const scheduledTime = this.lastAttackTime + interval;
			await this._runSingleAttack(true, scheduledTime);
			this.lastAttackTime += interval;
		}

		// finally, schedule one timer for the next real attack
		this._scheduleNext();
	}

	/**
	 * Run one attack.  If scheduledTime is provided, use it for the log timestamp;
	 * otherwise (normal mode) use actual now.
	 * @param {boolean} isCatchUp  whether we're in catch-up mode
	 * @param {number} [scheduledTime]  millis when this attack was due
	 */
	async _runSingleAttack(isCatchUp, scheduledTime) {
		const hero = CharacterService.getCurrentCharacter();

		// build monster list
		const parts = this._pendingMonstersDesc.split(' ');
		const count = parseInt(parts[0], 10) || this.threatLevel;
		let type = parts.slice(1).join(' ');
		if (type.endsWith('s')) type = type.slice(0, -1);
		const monsters = Array.from({ length: count }, (_, i) => ({
			id: `${type} #${i + 1}`, level: 1
		}));

		// simulate
		const { logs, success } = await BattleService.simulateBattle(
			hero,  // now passing full heroChar
			monsters
		);

		// adjust threat
		this.threatLevel = success
			? Math.min(10, this.threatLevel + 1)
			: Math.max(1, this.threatLevel - 1);

		// choose the correct timestamp
		const timestamp = scheduledTime != null ? scheduledTime : Date.now();
		const timeLabel = new Date(timestamp).toLocaleTimeString([], {
			hour: '2-digit', minute: '2-digit'
		});

		// record
		this.history.unshift({
			time: timeLabel,
			event: success ? 'Defended Attack' : 'Town Fell',
			success,
			hero: hero.name,
			monsters: monsters.map(m => m.id),
			logs,
		});
		if (this.history.length > 50) this.history.pop();

		// emit
		this.emit('attack', { success, logs });

		// schedule next if not catch-up
		if (!isCatchUp) {
			this.lastAttackTime = Date.now();
			this._generateNextAttackMonsters();
			this._scheduleNext();
		}
	}

	_generateNextAttackMonsters() {
		const types = ['Goblin', 'Orc', 'Skeleton', 'Troll', 'Bandit'];
		const type = types[Math.floor(Math.random() * types.length)];
		const count = this.threatLevel;
		this._pendingMonstersDesc = `${count} ${type}${count > 1 ? 's' : ''}`;
	}

	// Public API
	getThreatLevel() { return this.threatLevel; }
	getNextAttackCountdown() {
		const nextDue = this.lastAttackTime + this.attackIntervalMs;
		return Math.max(0, Math.floor((nextDue - Date.now()) / 1000));
	}
	getHistory() { return this.history; }
	getNextAttackMonsters() { return this._pendingMonstersDesc; }
	levelUp() { this.townLevel += 1; }
}

export default new TownDefenseService();
