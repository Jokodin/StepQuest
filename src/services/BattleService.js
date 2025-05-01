// src/services/BattleService.js
// Simulates a battle between the player and a pack of monsters, producing an ordered log of actions.
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BattleService {
	/**
	 * Simulate a fight.
	 * @param {object} playerChar
	 *   { name?: string,
	 *     stats: {
	 *       health: number,
	 *       attackPower: number,
	 *       attackSpeed?: number,
	 *       defense?: number,
	 *       accuracy?: number,
	 *       critChance?: number,
	 *       damage?: number
	 *     }
	 *   }
	 * @param {Array<object>} monsters
	 *   Each monster: { id: string, level: number, hp?: number, accuracy?: number, critChance?: number }
	 * @returns {{ logs: Array<{actor: string, actorMaxHp: number, actorCurrentHp: number, timestamp: number, displayText: string}>, success: boolean }}
	 */
	async simulateBattle(playerChar, monsters) {
		// Load equipped items
		let equippedItems = [];
		try {
			const rawEq = await AsyncStorage.getItem('equipped_items');
			if (rawEq) equippedItems = JSON.parse(rawEq);
		} catch (e) {
			console.warn('Could not load equipped items:', e);
		}

		// Helper to aggregate stat from base + equipped items
		function getStat(key) {
			const baseVal = playerChar.stats[key] || 0;
			const equipVal = equippedItems.reduce((sum, item) => {
				const v = item.stats?.[key] || 0;
				return sum + v;
			}, 0);
			return baseVal + equipVal;
		}

		// Initialize player state with aggregated stats
		const playerName = playerChar.name || 'Player';
		let playerHP = getStat('health');
		const playerMaxHP = playerHP;
		const atkSpeed = getStat('attackSpeed') || 1;
		const playerInterval = 1 / atkSpeed;
		const defense = getStat('defense') || 0;
		const critChance = (getStat('critChance') || 0) / 100;
		const attackPower = getStat('attackPower') || 1;
		const weaponDamageRaw = getStat('damage');
		const weaponDamage = weaponDamageRaw > 0 ? weaponDamageRaw : 1;

		// Initialize monsters state with HP, accuracy, and crit
		const mobs = monsters.map(m => {
			const initialHp = typeof m.hp === 'number' ? m.hp : m.level * 2;
			return {
				id: m.id,
				level: m.level,
				hp: initialHp,
				maxHp: initialHp,
				nextAttack: 1,
			};
		});

		let nextPlayerAttack = playerInterval;
		const logs = [];

		// Helper: random integer [1..max]
		function rand(max) {
			return Math.floor(Math.random() * max) + 1;
		}

		// Helper: create a log entry
		function createLogEntry(actor, actorMaxHp, actorCurrentHp, displayText) {
			return {
				actor,
				actorMaxHp,
				actorCurrentHp,
				timestamp: Date.now(),
				displayText
			};
		}

		// Battle loop
		while (playerHP > 0 && mobs.length > 0) {
			const nextEnemyTime = Math.min(...mobs.map(m => m.nextAttack));
			const isPlayerTurn = nextPlayerAttack <= nextEnemyTime;
			const eventTime = isPlayerTurn ? nextPlayerAttack : nextEnemyTime;

			if (isPlayerTurn) {
				// Player attack
				const idx = Math.floor(Math.random() * mobs.length);
				const mob = mobs[idx];

				const maxDmg = weaponDamage * attackPower;
				let dmg = rand(Math.max(1, Math.floor(maxDmg)));
				const critRoll = Math.random();
				let hitText = 'hits';
				if (critRoll <= critChance) {
					dmg *= 2;
					hitText = 'CRITS!';
				}
				mob.hp -= dmg;
				const mobRemaining = Math.max(0, mob.hp);

				logs.push(createLogEntry(
					playerName,
					playerMaxHP,
					playerHP,
					`${playerName} ${hitText} ${mob.id} for ${dmg} damage`
				));

				if (mob.hp <= 0) {
					logs.push(createLogEntry(
						mob.id,
						mob.maxHp,
						0,
						`${mob.id} is defeated.`
					));
					mobs.splice(idx, 1);
				}
				nextPlayerAttack += playerInterval;
			} else {
				// Monster's turn
				mobs.sort((a, b) => a.nextAttack - b.nextAttack);
				const mob = mobs[0];

				let rawDmg = rand(mob.level);
				const netDmg = Math.max(0, rawDmg - defense);
				const mitigated = rawDmg - netDmg;
				playerHP -= netDmg;
				const playerRemaining = Math.max(0, playerHP);

				logs.push(createLogEntry(
					mob.id,
					mob.maxHp,
					mob.hp,
					`${mob.id} hits ${playerName} for ${rawDmg} damage, mitigated by ${mitigated} (defense), net ${netDmg} damage`
				));

				if (playerHP <= 0) {
					logs.push(createLogEntry(
						playerName,
						playerMaxHP,
						0,
						`${playerName} has been defeated.`
					));
					break;
				}
				mob.nextAttack += 1;
			}
		}

		// End result
		const success = playerHP > 0;
		if (success) {
			logs.push(createLogEntry(
				'All',
				0,
				0,
				'All monsters have been defeated!'
			));
		}
		return { logs, success };
	}
}

export default new BattleService();