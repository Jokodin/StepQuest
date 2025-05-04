// src/services/BattleService.js
// Simulates a battle between the player and a pack of monsters, producing an ordered log of actions.
import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterService from './CharacterService';
import SpellService from './SpellService';

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

		// Get spells from equipped amulets
		const equippedSpells = equippedItems
			.filter(item => item.type === 'amulet' && item.stats?.spell)
			.map(item => item.stats.spell);

		// Initialize player state with final stats
		const playerName = playerChar.name || 'Player';
		const playerHP = CharacterService.getStat('health');
		const playerMaxHP = playerHP;
		let playerCurrentHP = playerHP;
		const atkSpeed = CharacterService.getStat('attackSpeed');
		const armor = CharacterService.getStat('armor');
		const critChance = (CharacterService.getStat('critChance') || 0) / 100;
		const attackPower = CharacterService.getStat('attackPower');
		const weaponDamage = CharacterService.getStat('damage');
		const castSpeed = CharacterService.getStat('castSpeed') || 1;
		let playerCurrentMana = CharacterService.getStat('mana') || 100;

		// Initialize battle state
		const battleStartTime = Date.now();
		let currentTime = battleStartTime;
		let nextPlayerAttack = currentTime + (1000 / atkSpeed);
		let nextPlayerSpell = currentTime + (1000 / castSpeed);
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
		while (playerCurrentHP > 0 && mobs.length > 0) {
			// Find the next action time among all actors
			const nextMonsterAttack = Math.min(...mobs.map(m => m.nextAttack));
			const nextActionTime = Math.min(nextPlayerAttack, nextPlayerSpell, nextMonsterAttack);

			// Advance time to the next action
			currentTime = nextActionTime;

			// Determine who acts at this time
			let actionType = 'monster';
			if (nextPlayerAttack <= nextActionTime) {
				actionType = 'attack';
			} else if (nextPlayerSpell <= nextActionTime && equippedSpells.length > 0) {
				actionType = 'spell';
			}

			if (actionType === 'attack') {
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
					playerCurrentHP,
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
			} else if (actionType === 'spell') {
				// Cast a random spell from equipped amulets
				const spellKey = equippedSpells[Math.floor(Math.random() * equippedSpells.length)];
				const spell = SpellService.getSpell(spellKey);

				if (spell && playerCurrentMana >= spell.manaCost) {
					playerCurrentMana -= spell.manaCost;

					// Apply spell effects
					if (spell.damage) {
						const idx = Math.floor(Math.random() * mobs.length);
						const mob = mobs[idx];
						const dmg = spell.damage * attackPower;
						mob.hp -= dmg;

						logs.push(createLogEntry(
							playerName,
							playerMaxHP,
							playerCurrentHP,
							`${playerName} casts ${spell.name} for ${Math.round(dmg * 10) / 10} damage`,
							currentTime
						));

						if (mob.hp <= 0) {
							logs.push(createLogEntry(
								mob.id,
								mob.maxHp,
								0,
								`${mob.id} is defeated.`,
								currentTime + 1
							));
							mobs.splice(idx, 1);
						}
					}
				}
				nextPlayerSpell = currentTime + (1000 / castSpeed);
			} else {
				// Monster's turn - find all monsters ready to attack
				const readyMonsters = mobs.filter(m => m.nextAttack === currentTime);
				for (const mob of readyMonsters) {
					// Calculate damage using monster's base damage
					let rawDmg = randFloat(mob.baseDamage);
					let netDmg = Math.max(0, rawDmg - armor);
					playerCurrentHP -= netDmg;

					// Use currentTime for the attack, then increment for each subsequent action
					logs.push(createLogEntry(
						mob.id,
						mob.maxHp,
						mob.hp,
						`${mob.id} deals ${netDmg} damage`,
						currentTime,
						{
							id: mob.id,
							level: mob.level,
							maxHp: mob.maxHp,
							baseDamage: mob.baseDamage
						}
					));

					if (playerCurrentHP <= 0) {
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
				if (playerCurrentHP <= 0) break;
			}
		}

		// End result
		const success = playerCurrentHP > 0;
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

	static async simulateBattle(player, monsters) {
		const battleLog = [];
		let playerCurrentHP = player.health;
		let playerCurrentMana = player.willpower * 100; // Always start with full mana
		const monsterHP = {};

		// Initialize monster HP
		monsters.forEach(monster => {
			monsterHP[monster.id] = monster.maxHp;
		});

		// Add initial battle log
		battleLog.push({
			timestamp: Date.now(),
			actor: 'System',
			displayText: 'Battle Begins!',
			monsterStats: monsters
		});

		// Battle loop
		while (playerCurrentHP > 0 && Object.values(monsterHP).some(hp => hp > 0)) {
			const currentTime = Date.now();

			// Regenerate mana
			const timeSinceLastRegen = (currentTime - (player.lastManaRegen || currentTime)) / 1000;
			const manaToRegen = Math.floor(timeSinceLastRegen * 10); // 10 mana per second
			if (manaToRegen > 0) {
				playerCurrentMana = Math.min(
					playerCurrentMana + manaToRegen,
					player.willpower * 100
				);
				player.lastManaRegen = currentTime;
			}

			// Player's turn
			if (playerCurrentHP > 0) {
				// Check for spell casting
				if (player.spells && player.spells.length > 0) {
					for (const spellKey of player.spells) {
						if (SpellService.canCastSpell(spellKey, { ...player, currentMana: playerCurrentMana }, player.spellCooldowns[spellKey] || 0)) {
							const spellResult = SpellService.castSpell(spellKey, { ...player, currentMana: playerCurrentMana }, monsters[0]);
							if (spellResult) {
								if (spellResult.damage) {
									const targetMonster = monsters[0];
									monsterHP[targetMonster.id] -= spellResult.damage;
									battleLog.push({
										timestamp: currentTime,
										actor: player.name,
										displayText: spellResult.text,
										actorCurrentHp: playerCurrentHP,
										actorMaxHp: player.health
									});
								}
								if (spellResult.healing) {
									playerCurrentHP = Math.min(playerCurrentHP + spellResult.healing, player.health);
									battleLog.push({
										timestamp: currentTime,
										actor: player.name,
										displayText: spellResult.text,
										actorCurrentHp: playerCurrentHP,
										actorMaxHp: player.health
									});
								}
								await CharacterService.updateSpellCooldown(player.id, spellKey, currentTime);
							}
						}
					}
				}

				// Regular attack
				const targetMonster = monsters[0];
				if (targetMonster && monsterHP[targetMonster.id] > 0) {
					const damage = this.calculateDamage(player.attackPower, targetMonster.defense, true, player.strength);
					monsterHP[targetMonster.id] -= damage;
					battleLog.push({
						timestamp: currentTime,
						actor: player.name,
						displayText: `${player.name} attacks for ${Math.floor(damage)} damage!`,
						actorCurrentHp: playerCurrentHP,
						actorMaxHp: player.health
					});
				}
			}

			// Monsters' turn
			monsters.forEach(monster => {
				if (monsterHP[monster.id] > 0 && playerCurrentHP > 0) {
					const damage = this.calculateMonsterDamage(monster.baseDamage, player.armor);
					playerCurrentHP -= damage;
					battleLog.push({
						timestamp: currentTime,
						actor: monster.id,
						displayText: `${monster.id} attacks for ${Math.floor(damage)} damage!`,
						actorCurrentHp: monsterHP[monster.id],
						actorMaxHp: monster.maxHp
					});
				}
			});

			// Check for battle end
			if (playerCurrentHP <= 0 || Object.values(monsterHP).every(hp => hp <= 0)) {
				break;
			}
		}

		// Add battle end log
		const success = playerCurrentHP > 0;
		battleLog.push({
			timestamp: Date.now(),
			actor: 'System',
			displayText: success ? 'Battle Won!' : 'Battle Lost!'
		});

		return {
			success,
			log: battleLog
		};
	}
}

export default new BattleService();