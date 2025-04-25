// src/services/TownDefenseService.js

import CharacterService from '@/services/CharacterService';
import BattleService from '@/services/BattleService';

class TownDefenseService {
	constructor({ attackIntervalMs = 10 * 1000 } = {}) {
		this.attackIntervalMs = attackIntervalMs;
		this.attackTimer = null;
		this.listeners = {};

		// internal state
		this.townLevel = 1;
		this.history = [];
		this._nextAttackTime = Date.now() + attackIntervalMs;
		this.threatLevel = 5;

		// prepare the first incoming monsters
		this._generateNextAttackMonsters();
	}

	// subscribe / unsubscribe
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

	// start/stop attack loop
	startAttacks() {
		this.stopAttacks();
		this._generateNextAttackMonsters();
		this._scheduleNext();
	}
	stopAttacks() {
		if (this.attackTimer) clearTimeout(this.attackTimer);
		this.attackTimer = null;
	}

	_scheduleNext() {
		const delay = Math.max(0, this._nextAttackTime - Date.now());
		this.attackTimer = setTimeout(() => this._launchAttack(), delay);
	}

	_launchAttack() {
		// 1) Prepare player
		const heroChar = CharacterService.getCurrentCharacter();
		const player = {
			name: heroChar.name,
			hp: heroChar.stats.hp,
			attackPower: heroChar.stats.attackPower,
			speed: heroChar.stats.speed,
		};

		// 2) Build monster list from the last-generated desc
		const desc = this._pendingMonstersDesc;
		const [countStr, ...typeParts] = desc.split(' ');
		const count = parseInt(countStr, 10) || this.threatLevel;
		let type = typeParts.join(' ');
		if (type.endsWith('s')) type = type.slice(0, -1);
		const monsters = Array.from({ length: count }, (_, i) => ({
			id: `${type} #${i + 1}`, level: 1
		}));

		// 3) Simulate the fight
		const { logs, success } = BattleService.simulateBattle(player, monsters);

		// 4) Adjust threat/gold
		if (success) this.threatLevel = Math.min(10, this.threatLevel + 1);
		else this.threatLevel = Math.max(1, this.threatLevel - 1);

		// 5) Record timestamp & history
		const hhmm = new Date().toLocaleTimeString([], {
			hour: '2-digit', minute: '2-digit'
		});
		this.history.unshift({
			time: hhmm,
			event: success ? 'Defended Attack' : 'Town Fell',
			success,
			hero: heroChar.name,
			monsters: monsters.map(m => m.id),
			logs,
		});
		if (this.history.length > 50) this.history.pop();

		// 6) Schedule next attack *before* emitting
		this._nextAttackTime = Date.now() + this.attackIntervalMs;
		this._generateNextAttackMonsters();
		this.emit('attack', { success });
		this._scheduleNext();
	}

	_computeDefenseChance() {
		return 0;
	}

	_rewardOnSuccess() {
		return 0;
	}

	_generateNextAttackMonsters() {
		const types = ['Goblin', 'Orc', 'Skeleton', 'Troll', 'Bandit'];
		const type = types[Math.floor(Math.random() * types.length)];
		const count = this.threatLevel;
		this._pendingMonstersDesc = `${count} ${type}${count > 1 ? 's' : ''}`;
	}

	// Public API
	getThreatLevel() { return this.threatLevel; }
	getDefenseChance() { return this._computeDefenseChance(); }
	getNextAttackCountdown() {
		const secs = (this._nextAttackTime - Date.now()) / 1000;
		return Math.floor(Math.max(0, secs));
	}
	getHistory() { return this.history; }
	getTownLevel() { return this.townLevel; }
	getNextAttackMonsters() { return this._pendingMonstersDesc; }
	levelUp() { this.townLevel += 1; }
}

export default new TownDefenseService();
