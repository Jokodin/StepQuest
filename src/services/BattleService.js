// src/services/BattleService.js
// Simulates a battle between the player and a pack of monsters, producing an ordered log of actions.

export class BattleService {
	/**
	 * Simulate a fight.
	 * @param {object} player
	 *   { name?: string, hp: number, attackPower: number, speed: number }
	 * @param {Array<object>} monsters
	 *   Each monster: { id: string, level: number, hp?: number }
	 * @returns {{ logs: string[], success: boolean }}
	 */
	simulateBattle(player, monsters) {
		// Initialize player state
		const playerName = player.name || 'Player';
		let playerHP = player.hp;
		const playerMaxHP = player.hp;
		const atkPow = player.attackPower;
		const atkSpeed = player.speed > 0 ? player.speed : 1;
		const playerInterval = 1 / atkSpeed;

		// Initialize monsters state with their max HP
		const mobs = monsters.map(m => {
			const initialHp = typeof m.hp === 'number' ? m.hp : m.level * 30;
			return {
				id: m.id,
				level: m.level,
				hp: initialHp,
				maxHp: initialHp,
				nextAttack: 1, // first attack at t=1s
			};
		});

		let nextPlayerAttack = playerInterval;
		const logs = [];

		// Helper: random integer [1..max]
		function rand(max) {
			return Math.floor(Math.random() * max) + 1;
		}

		// Battle loop
		while (playerHP > 0 && mobs.length > 0) {
			// Determine whose turn is next
			const nextEnemyTime = Math.min(...mobs.map(m => m.nextAttack));
			if (nextPlayerAttack <= nextEnemyTime) {
				// Player's turn
				const idx = Math.floor(Math.random() * mobs.length);
				const mob = mobs[idx];
				const dmg = rand(atkPow);
				mob.hp -= dmg;
				const mobRemaining = Math.max(0, mob.hp);
				logs.push(
					`${playerName} hits ${mob.id} for ${dmg} damage (${mobRemaining}/${mob.maxHp})`
				);
				if (mob.hp <= 0) {
					logs.push(`${mob.id} is defeated.`);
					mobs.splice(idx, 1);
				}
				nextPlayerAttack += playerInterval;
			} else {
				// Monster's turn
				mobs.sort((a, b) => a.nextAttack - b.nextAttack);
				const mob = mobs[0];
				const dmg = rand(mob.level * 10);
				playerHP -= dmg;
				const playerRemaining = Math.max(0, playerHP);
				logs.push(
					`${mob.id} hits ${playerName} for ${dmg} damage (${playerRemaining}/${playerMaxHP})`
				);
				if (playerHP <= 0) {
					logs.push(`${playerName} has been defeated.`);
					break;
				}
				mob.nextAttack += 1; // each monster attacks every second
			}
		}

		// End result
		const success = playerHP > 0;
		if (success) {
			logs.push(`All monsters have been defeated!`);
		}

		return { logs, success };
	}
}

// Export a singleton instance
export default new BattleService();
