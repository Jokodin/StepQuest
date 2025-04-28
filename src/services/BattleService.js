// src/services/BattleService.js
// Simulates a battle between the player and a pack of monsters, producing an ordered log of actions.
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BattleService {
	/**
	 * Simulate a fight.
	 * @param {object} player
	 *   { name?: string,
	 *     stats: {
	 *       health: number,
	 *       attackPower: number,   // multiplier for weapon damage
	 *       attackSpeed?: number,
	 *       defense?: number,
	 *       stamina?: number,
	 *       accuracy?: number,   // integer 1-100
	 *       critChance?: number   // integer 1-100
	 *     },
	 *     weapon: { damage: number }  // base weapon damage
	 *   }
	 * @param {Array<object>} monsters
	 *   Each monster: { id: string, level: number, hp?: number, accuracy?: number, critChance?: number }
	 * @returns {{ logs: string[], success: boolean }}
	 */
	async simulateBattle(heroChar, monsters) {
		// Load equipped weapon
		let weapon = { stats: { damage: 1 } };
		try {
			const raw = await AsyncStorage.getItem('equipped_weapon');
			if (raw) weapon = JSON.parse(raw);
		} catch (e) {
			console.warn('Could not load equipped weapon:', e);
		}

		// Build full player object
		const player = {
			name: heroChar.name,
			stats: heroChar.stats,
			weapon,
		};

		// Initialize player state
		const playerName = player.name || 'Player';
		let playerHP = player.stats.health;
		const playerMaxHP = player.stats.health;
		const atkSpeed = player.stats.attackSpeed ?? 1;
		const playerInterval = 1 / atkSpeed;
		const defense = player.stats.defense ?? 0;
		const critChance = (player.stats.critChance ?? 0) / 100;
		const attackPower = player.stats.attackPower;
		const weaponDamage = player.weapon.damage;

		// Stamina settings
		const maxStamina = player.stats.stamina ?? Infinity;
		let stamina = maxStamina;
		const staminaCost = 10;
		const staminaRegenRate = 5; // per second

		// Initialize monsters state with HP, accuracy, and crit
		const mobs = monsters.map(m => {
			const initialHp = typeof m.hp === 'number' ? m.hp : m.level * 30;
			return {
				id: m.id,
				level: m.level,
				hp: initialHp,
				maxHp: initialHp,
				accuracy: (m.accuracy ?? 100) / 100,
				critChance: (m.critChance ?? 0) / 100,
				nextAttack: 1,
			};
		});

		let nextPlayerAttack = playerInterval;
		let lastTime = 0;
		const logs = [];

		// Helper: random integer [1..max]
		function rand(max) {
			return Math.floor(Math.random() * max) + 1;
		}

		// Battle loop
		while (playerHP > 0 && mobs.length > 0) {
			const nextEnemyTime = Math.min(...mobs.map(m => m.nextAttack));
			const isPlayerTurn = nextPlayerAttack <= nextEnemyTime;
			const eventTime = isPlayerTurn ? nextPlayerAttack : nextEnemyTime;

			// Regenerate stamina continuously
			const elapsed = eventTime - lastTime;
			if (elapsed > 0 && stamina < maxStamina) {
				stamina = Math.min(maxStamina, stamina + staminaRegenRate * elapsed);
			}
			lastTime = eventTime;

			if (isPlayerTurn) {
				if (stamina >= staminaCost) {
					// Attempt attack
					const idx = Math.floor(Math.random() * mobs.length);
					const mob = mobs[idx];

					// Hit lands
					let dmg = weaponDamage * attackPower;
					const critRoll = Math.random();
					let hitText = 'hits';
					if (critRoll <= critChance) {
						dmg *= 2;
						hitText = 'CRITS!';
					}
					mob.hp -= dmg;
					stamina -= staminaCost;
					const mobRemaining = Math.max(0, mob.hp);

					logs.push(
						`${playerName} ${hitText} ${mob.id} for ${dmg} damage (${mobRemaining}/${mob.maxHp}). Stamina: ${stamina.toFixed(0)}/${maxStamina}`
					);
					if (mob.hp <= 0) {
						logs.push(`${mob.id} is defeated.`);
						mobs.splice(idx, 1);
					}
					nextPlayerAttack += playerInterval;
				} else {
					// Recover stamina
					const needed = staminaCost - stamina;
					const waitTime = needed / staminaRegenRate;
					logs.push(
						`${playerName} is out of stamina and recovers for ${waitTime.toFixed(2)}s before attacking.`
					);
					nextPlayerAttack = eventTime + waitTime;
				}
			} else {
				// Monster's turn
				mobs.sort((a, b) => a.nextAttack - b.nextAttack);
				const mob = mobs[0];
				const hitRoll = Math.random();

				if (hitRoll <= mob.accuracy) {
					// Hit lands
					let rawDmg = rand(mob.level * 10);
					const critRoll = Math.random();
					let critText = '';
					if (critRoll <= mob.critChance) {
						rawDmg *= 2;
						critText = ' CRITICAL!';
					}
					const netDmg = Math.max(0, rawDmg - defense);
					const mitigated = rawDmg - netDmg;
					playerHP -= netDmg;
					const playerRemaining = Math.max(0, playerHP);
					logs.push(
						`${mob.id} hits ${playerName} for ${rawDmg} damage${critText}, mitigated by ${mitigated} (defense), net ${netDmg} damage (acc ${(mob.accuracy * 100).toFixed(0)}%) (${playerRemaining}/${playerMaxHP})`
					);
				} else {
					logs.push(
						`${mob.id} misses ${playerName} (acc ${(mob.accuracy * 100).toFixed(0)}%)`
					);
				}
				if (playerHP <= 0) {
					logs.push(`${playerName} has been defeated.`);
					break;
				}
				mob.nextAttack += 1;
			}
		}

		// End result
		const success = playerHP > 0;
		if (success) logs.push(`All monsters have been defeated!`);

		return { logs, success };
	}
}

export default new BattleService();
