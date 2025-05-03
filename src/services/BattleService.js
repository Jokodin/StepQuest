// src/services/BattleService.js
// Simulates a battle between the player and a pack of monsters, producing an ordered log of actions.
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BattleService {
	/**
	 * Calculate monster health based on level
	 * @param {number} level - Monster level
	 * @returns {number} - Monster's max HP
	 */
	static calculateMonsterHealth(level) {
		// Base health of 10 at level 1, scaling by 5 per level
		const baseHealth = 10 + (level - 1) * 3;
		// Random variation between -20% and +20%
		const variation = (Math.random() * 0.4 - 0.2) * baseHealth;
		return Math.max(1, Math.floor(baseHealth + variation));
	}

	/**
	 * Calculate monster damage based on level
	 * @param {number} level - Monster level
	 * @returns {number} - Monster's base damage
	 */
	static calculateMonsterDamage(level) {
		// Base damage of 2 at level 1, scaling by 1 per level
		return 1 + (level - 1) / 2;
	}

	/**
	 * Calculate monster attack speed based on level
	 * @param {number} level - Monster level
	 * @returns {number} - Monster's attack speed (attacks per second)
	 */
	static calculateMonsterAttackSpeed(level) {
		// Base speed of 1
		return 1;
	}

	/**
	 * Calculate damage with mitigation
	 * @param {number} attack - Attack power
	 * @param {number} defense - Defense power
	 * @param {boolean} isPlayer - Whether the attack is from the player
	 * @returns {object} - Contains final damage and log text
	 */
	static calculateDamage(attack, defense, isPlayer) {
		const baseDamage = Math.max(0, attack - defense);
		const mitigatedDamage = Math.max(1, Math.floor(baseDamage * 0.5));
		const finalDamage = isPlayer ? mitigatedDamage : Math.round(baseDamage * 10) / 10;

		const logText = isPlayer
			? `deals ${finalDamage} damage${mitigatedDamage < baseDamage ? ` (mitigated by ${Math.round((baseDamage - mitigatedDamage) * 10) / 10})` : ''}`
			: `deals ${finalDamage} damage`;

		return {
			damage: finalDamage,
			logText
		};
	}

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
		console.log('[BattleService] Simulating battle with:', { playerChar, monsters });
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

		// Initialize battle state
		const battleStartTime = Date.now();
		let currentTime = battleStartTime;
		let nextPlayerAttack = currentTime + (1000 / atkSpeed); // Convert attacks/sec to milliseconds
		const logs = [];

		// Initialize monsters with their attack times
		const mobs = monsters.map(m => {
			const maxHp = BattleService.calculateMonsterHealth(m.level);
			const baseDamage = BattleService.calculateMonsterDamage(m.level);
			const attackSpeed = BattleService.calculateMonsterAttackSpeed(m.level);
			return {
				id: m.id,
				level: m.level,
				hp: maxHp,
				maxHp,
				baseDamage,
				attackSpeed,
				nextAttack: currentTime + (1000 / attackSpeed), // Convert attacks/sec to milliseconds
			};
		});

		// Helper: random integer [1..max]
		function rand(max) {
			return Math.floor(Math.random() * max) + 1;
		}

		// Helper: random float [0..max] rounded to 1 decimal place
		function randFloat(max) {
			return Math.round(Math.random() * max * 10) / 10;
		}

		// Helper: create a log entry
		function createLogEntry(actor, actorMaxHp, actorCurrentHp, displayText, timestamp, monsterStats = null) {
			return {
				actor,
				actorMaxHp,
				actorCurrentHp,
				timestamp,
				displayText,
				monsterStats
			};
		}

		// Add initial monster stats to the log
		const initialMonsterStats = mobs.map(m => ({
			id: m.id,
			level: m.level,
			maxHp: m.maxHp,
			baseDamage: m.baseDamage
		}));

		console.log('Initial monster stats:', initialMonsterStats);

		logs.push(createLogEntry(
			'System',
			0,
			0,
			'Battle begins!',
			currentTime,
			initialMonsterStats
		));

		// Battle loop
		while (playerHP > 0 && mobs.length > 0) {
			// Find the next attack time among all actors
			const nextMonsterAttack = Math.min(...mobs.map(m => m.nextAttack));
			const nextAttackTime = Math.min(nextPlayerAttack, nextMonsterAttack);

			// Advance time to the next attack
			currentTime = nextAttackTime;

			// Determine who attacks at this time
			const isPlayerTurn = nextPlayerAttack <= nextMonsterAttack;
			let shouldPlayerAttack = isPlayerTurn;

			// If multiple actors are ready at the same time, randomly choose one
			if (nextPlayerAttack === nextMonsterAttack) {
				shouldPlayerAttack = Math.random() < 0.5;
				console.log('[BattleService] Multiple actors ready, randomly choosing:', {
					time: currentTime - battleStartTime,
					playerReady: nextPlayerAttack === currentTime,
					monstersReady: mobs.filter(m => m.nextAttack === currentTime).map(m => m.id),
					playerAttacks: shouldPlayerAttack
				});
			}

			if (shouldPlayerAttack) {
				// Player attack
				const idx = Math.floor(Math.random() * mobs.length);
				const mob = mobs[idx];

				const maxDmg = weaponDamage;
				let dmg = randFloat(maxDmg);
				dmg = dmg * attackPower;
				const critRoll = Math.random();
				let hitText = 'hits';
				if (critRoll <= critChance) {
					dmg *= 2;
					hitText = 'CRITS!';
				}
				mob.hp -= dmg;
				const mobRemaining = Math.max(0, mob.hp);

				// Use currentTime for the attack, then increment for the defeat message if needed
				logs.push(createLogEntry(
					playerName,
					playerMaxHP,
					playerHP,
					`${playerName} ${hitText} ${mob.id} for ${Math.round(dmg * 10) / 10} damage`,
					currentTime,
					{
						id: mob.id,
						level: mob.level,
						maxHp: mob.maxHp,
						baseDamage: mob.baseDamage
					}
				));

				if (mob.hp <= 0) {
					// Use a slightly later timestamp for the defeat message
					logs.push(createLogEntry(
						mob.id,
						mob.maxHp,
						0,
						`${mob.id} is defeated.`,
						currentTime + 1,
						{
							id: mob.id,
							level: mob.level,
							maxHp: mob.maxHp,
							baseDamage: mob.baseDamage
						}
					));
					mobs.splice(idx, 1);
				}
				nextPlayerAttack = currentTime + (1000 / atkSpeed);
			} else {
				// Monster's turn - find all monsters ready to attack
				const readyMonsters = mobs.filter(m => m.nextAttack === currentTime);
				for (const mob of readyMonsters) {
					// Calculate damage using monster's base damage
					let rawDmg = randFloat(mob.baseDamage);
					const armor = getStat('armor') || 0;
					const { damage: netDmg, logText } = BattleService.calculateDamage(rawDmg, armor, false);
					playerHP -= netDmg;
					const playerRemaining = Math.max(0, playerHP);

					// Use currentTime for the attack, then increment for each subsequent action
					logs.push(createLogEntry(
						mob.id,
						mob.maxHp,
						mob.hp,
						`${mob.id} ${logText}`,
						currentTime,
						{
							id: mob.id,
							level: mob.level,
							maxHp: mob.maxHp,
							baseDamage: mob.baseDamage
						}
					));

					if (playerHP <= 0) {
						// Use a slightly later timestamp for the defeat message
						logs.push(createLogEntry(
							playerName,
							playerMaxHP,
							0,
							`${playerName} has been defeated.`,
							currentTime + 1,
							{
								id: 'All',
								maxHp: 0,
								currentHp: 0
							}
						));
						break;
					}
					mob.nextAttack = currentTime + (1000 / mob.attackSpeed);
				}
				if (playerHP <= 0) break;
			}
		}

		// End result
		const success = playerHP > 0;
		if (success) {
			logs.push(createLogEntry(
				'All',
				0,
				0,
				'All monsters have been defeated!',
				currentTime + 2,
				{
					id: 'All',
					maxHp: 0,
					currentHp: 0
				}
			));
		}
		return { logs, success };
	}
}

export default new BattleService();