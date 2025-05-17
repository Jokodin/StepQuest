// src/services/BattleService.js
// Simulates a battle between the player and a pack of monsters, producing an ordered log of actions.
import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterService from './CharacterService';
import SpellService from './SpellService';

class BattleService {
	static FRAMERATE = 30; // 10 updates per second
	static FRAME_INTERVAL = 1 / BattleService.FRAMERATE; // Time between frames in seconds

	/**
	 * Calculate monster health based on level
	 * @param {number} level - Monster level
	 * @returns {number} - Monster's max HP
	 */
	static calculateMonsterHealth(level) {
		// Base health of 10 at level 1, scaling by 3 per level
		const baseHealth = 10 + (level - 1) * 3;
		// 1/3 chance for each: add 30%, subtract 30%, or keep base health
		const roll = Math.random();
		let variation, suffix;
		if (roll < 0.33) {
			variation = baseHealth * 0.3;
			suffix = "Strong";
		} else if (roll < 0.66) {
			variation = -baseHealth * 0.3;
			suffix = "Weak";
		} else {
			variation = 0;
			suffix = "Normal";
		}

		return {
			health: Math.max(1, Math.floor(baseHealth + variation)),
			suffix
		};
	}

	/**
	 * Calculate monster damage based on level
	 * @param {number} level - Monster level
	 * @returns {number} - Monster's base damage
	 */
	static calculateMonsterDamage(level) {
		// Base damage of 2 at level 1, scaling by 1 per level
		return 1 + level / 2;
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
	 * @param {Array<object>} monsters
	 *   Each monster: { id: string, level: number, hp?: number, accuracy?: number, critChance?: number }
	 * @returns {{ logs: Array<{actor: string, actorMaxHp: number, actorCurrentHp: number, timestamp: number, displayText: string}>, success: boolean }}
	 */
	static async simulateBattle(monsters) {
		//console.log('[BattleService] Starting battle simulation');

		// Get player character from storage
		let player;
		try {
			const stored = await AsyncStorage.getItem('currentCharacter');
			if (!stored) {
				throw new Error('No character found in storage');
			}
			player = JSON.parse(stored);
		} catch (error) {
			console.error('Error loading character for battle:', error);
			throw error;
		}

		// Initialize player state with total stats
		player.attackCooldown = 0;
		const playerHealth = await CharacterService.getStat('health', []);
		const playerMana = await CharacterService.getStat('mana', []);
		const playerArmor = await CharacterService.getStat('armor', []);
		const playerDamage = await CharacterService.getStat('damage', []);
		const playerAttackPower = await CharacterService.getStat('attackPower', []);
		const playerAttackSpeed = await CharacterService.getStat('attackSpeed', []);

		player.currentHealth = playerHealth;
		player.currentMana = playerMana;

		// Initialize monsters with proper stats
		const initializedMonsters = monsters.map(m => {
			const healthResult = BattleService.calculateMonsterHealth(m.level);
			const monster = {
				id: m.id,
				level: m.level,
				maxHp: healthResult.health,
				baseDamage: BattleService.calculateMonsterDamage(m.level),
				attackSpeed: BattleService.calculateMonsterAttackSpeed(m.level),
				currentHp: healthResult.health,
				attackCooldown: 0,
				suffix: healthResult.suffix
			};
			console.log('Initialized monster:', monster);
			return monster;
		});

		const battleLog = {
			initialPlayerHealth: playerHealth,
			initialPlayerMana: playerMana,
			playerAttackSpeed: playerAttackSpeed,
			playerDamage: playerDamage,
			monsters: initializedMonsters.map(m => ({
				id: m.id,
				level: m.level,
				maxHp: m.maxHp,
				baseDamage: m.baseDamage,
				attackSpeed: m.attackSpeed,
				suffix: m.suffix
			})),
			logs: [],
			duration: 0
		};

		//console.log('Initial battle log:', battleLog);

		let currentTime = 0;
		let iterationCount = 0;
		const MAX_ITERATIONS = 1000; // Safety limit
		const TIME_PER_ITERATION = 1 / BattleService.FRAMERATE;

		while (iterationCount < MAX_ITERATIONS) {
			// Update player attack cooldown
			player.attackCooldown = Math.max(0, player.attackCooldown - TIME_PER_ITERATION);

			// Player attack if cooldown is ready
			if (player.attackCooldown <= 0) {
				const targetMonster = initializedMonsters.find(m => m.currentHp > 0);
				if (targetMonster) {
					const baseDamage = Math.random() * playerDamage;
					const totalDamage = baseDamage * playerAttackPower;

					targetMonster.currentHp = Math.max(0, targetMonster.currentHp - totalDamage);

					battleLog.logs.push({
						actor: player.name || 'Player',
						actorMaxHp: playerHealth,
						actorCurrentHp: player.currentHealth,
						targetMaxHp: targetMonster.maxHp,
						targetCurrentHp: targetMonster.currentHp,
						timestamp: currentTime,
						displayText: `You hit ${targetMonster.id}${targetMonster.suffix ? ` (${targetMonster.suffix})` : ''} for ${totalDamage.toFixed(1)} damage! (${targetMonster.currentHp.toFixed(1)}/${targetMonster.maxHp} HP)`
					});

					player.attackCooldown = 1 / playerAttackSpeed;
				}
			}

			// Update monster attack cooldowns and attacks
			initializedMonsters.forEach(monster => {
				if (monster.currentHp > 0) {
					monster.attackCooldown = Math.max(0, monster.attackCooldown - TIME_PER_ITERATION);

					if (monster.attackCooldown <= 0) {
						const monsterDamage = Math.random() * monster.baseDamage;
						// Subtract player's armor from the damage
						const mitigatedDamage = Math.max(0, monsterDamage - playerArmor);
						player.currentHealth = Math.max(0, player.currentHealth - mitigatedDamage);
						battleLog.logs.push({
							actor: monster.id,
							actorMaxHp: monster.maxHp,
							actorCurrentHp: monster.currentHp,
							targetMaxHp: playerHealth,
							targetCurrentHp: player.currentHealth,
							timestamp: currentTime,
							displayText: `${monster.id}${monster.suffix ? ` (${monster.suffix})` : ''} hits you for ${mitigatedDamage.toFixed(1)} damage! (${player.currentHealth.toFixed(1)}/${playerHealth} HP)`,
							suffix: monster.suffix
						});

						monster.attackCooldown = 1 / monster.attackSpeed;
					}
				}
			});

			// Check for battle end conditions
			if (player.currentHealth <= 0) {
				battleLog.logs.push({
					actor: 'system',
					actorMaxHp: playerHealth,
					actorCurrentHp: 0,
					timestamp: currentTime,
					displayText: 'You have been defeated!'
				});
				break;
			}

			const allMonstersDead = initializedMonsters.every(m => m.currentHp <= 0);
			if (allMonstersDead) {
				battleLog.logs.push({
					actor: 'system',
					actorMaxHp: playerHealth,
					actorCurrentHp: player.currentHealth,
					timestamp: currentTime,
					displayText: 'You have defeated all monsters!'
				});
				break;
			}

			currentTime += TIME_PER_ITERATION;
			iterationCount++;
		}

		battleLog.duration = currentTime;
		return {
			logs: battleLog.logs,
			success: player.currentHealth > 0
		};
	}

	// Add new methods for battle replay
	createBattleReplay(battleEntry) {
		//console.log('Creating battle replay from:', battleEntry);
		if (!battleEntry || !battleEntry.logs) {
			console.error('Invalid battle log format:', battleEntry);
			return null;
		}

		try {
			// Get initial monster stats from the first log entry
			const initialMonsterStats = battleEntry.logs[0]?.monsterStats || [];
			//console.log('Initial monster stats:', initialMonsterStats);

			const monsterMap = new Map();
			if (initialMonsterStats && initialMonsterStats.length > 0) {
				initialMonsterStats.forEach(monster => {
					if (monster && monster.id) {
						monsterMap.set(monster.id, {
							id: monster.id,
							level: monster.level || 1,
							maxHp: monster.maxHp || 8,
							baseDamage: monster.baseDamage || 1,
							attackSpeed: 1,
							currentHp: monster.maxHp || 8,
							nextAttack: 0
						});
					}
				});
			} else {
				// Otherwise, create default monster stats from the monster names
				const monsterNames = battleEntry.monsters || [];
				monsterNames.forEach(monsterName => {
					if (monsterName) {
						monsterMap.set(monsterName, {
							id: monsterName,
							level: 1,
							maxHp: 8,
							baseDamage: 1,
							attackSpeed: 1,
							currentHp: 8,
							nextAttack: 0
						});
					}
				});
			}

			//console.log('Monster map:', Array.from(monsterMap.entries()));

			// Get player name and initial stats from the first player log entry
			const firstPlayerLog = battleEntry.logs.find(log => log.actor !== 'System' && log.actor !== 'All');
			const playerName = firstPlayerLog?.actor || 'Player';
			const playerMaxHp = firstPlayerLog?.actorMaxHp || 10;
			let nextPlayerAttack = 0;

			//console.log('Player stats:', { name: playerName, maxHp: playerMaxHp });

			// Create replay frames from the logs
			const frames = [];
			const FRAME_INTERVAL = 0.1; // 1/10th of a second

			// Add initial frame
			const initialFrame = {
				timestamp: 0,
				player: {
					name: playerName,
					currentHp: playerMaxHp,
					maxHp: playerMaxHp,
					currentMana: 100,
					maxMana: 100,
					attackCooldown: 0,
					attackSpeed: 1
				},
				monsters: Array.from(monsterMap.values()).map(monster => ({
					id: monster.id,
					name: monster.id,
					currentHp: monster.currentHp,
					maxHp: monster.maxHp,
					currentMana: 100,
					maxMana: 100,
					attackCooldown: 0,
					attackSpeed: monster.attackSpeed
				}))
			};

			//console.log('Initial frame:', initialFrame);
			frames.push(initialFrame);

			// Process each log entry and generate intermediate frames
			let currentTime = 0;
			let currentFrame = { ...initialFrame };
			let lastLogIndex = 0;

			while (lastLogIndex < battleEntry.logs.length) {
				// Find the next log entry that should be processed
				const nextLog = battleEntry.logs[lastLogIndex];
				if (nextLog.actor === 'System' || nextLog.actor === 'All') {
					lastLogIndex++;
					continue;
				}

				// Generate frames until we reach the next log entry
				while (currentTime < nextLog.timestamp) {
					currentTime += FRAME_INTERVAL;
					if (currentTime > nextLog.timestamp) {
						currentTime = nextLog.timestamp;
					}

					// Create a new frame
					const newFrame = {
						timestamp: currentTime,
						player: { ...currentFrame.player },
						monsters: currentFrame.monsters.map(m => ({ ...m }))
					};

					// Update cooldowns - now they fill up from 0 to 1
					const timeSinceLastAttack = currentTime - nextPlayerAttack;
					const cooldownTime = 1 / newFrame.player.attackSpeed;
					newFrame.player.attackCooldown = Math.min(1, timeSinceLastAttack / cooldownTime);

					newFrame.monsters.forEach(monster => {
						const monsterData = monsterMap.get(monster.id);
						if (monsterData) {
							const timeSinceLastAttack = currentTime - monsterData.nextAttack;
							const cooldownTime = 1 / monster.attackSpeed;
							monster.attackCooldown = Math.min(1, timeSinceLastAttack / cooldownTime);
						}
					});

					frames.push(newFrame);
					currentFrame = newFrame;
				}

				// Process the log entry
				if (nextLog.displayText.includes('hits')) {
					// Player attack
					const targetName = nextLog.displayText.split(' ')[2];
					const targetMonster = currentFrame.monsters.find(m => m.id === targetName);
					if (targetMonster) {
						const damageMatch = nextLog.displayText.match(/for (\d+(\.\d+)?) damage/);
						if (damageMatch) {
							const damage = parseFloat(damageMatch[1]);
							targetMonster.currentHp = Math.max(0, targetMonster.currentHp - damage);
						}
						nextPlayerAttack = currentTime;
						currentFrame.player.attackCooldown = 0;
					}
				} else if (nextLog.displayText.includes('deals')) {
					// Monster attack
					currentFrame.player.currentHp = nextLog.actorCurrentHp;
					const attacker = currentFrame.monsters.find(m => m.id === nextLog.actor);
					if (attacker) {
						const monsterData = monsterMap.get(attacker.id);
						if (monsterData) {
							monsterData.nextAttack = currentTime;
							attacker.attackCooldown = 0;
						}
					}
				} else if (nextLog.displayText.includes('defeated')) {
					// Monster defeated
					const defeatedMonster = currentFrame.monsters.find(m => m.id === nextLog.actor);
					if (defeatedMonster) {
						defeatedMonster.currentHp = 0;
					}
				}

				frames.push({ ...currentFrame });
				lastLogIndex++;
			}

			// Add final frame
			const finalFrame = {
				...currentFrame,
				timestamp: currentTime + 2
			};
			frames.push(finalFrame);

			//console.log('Created replay with frames:', frames.length);
			return {
				frames,
				currentFrameIndex: 0,
				isComplete: false
			};
		} catch (error) {
			console.error('Error creating battle replay:', error);
			return null;
		}
	}

	updateReplayState(replay, deltaTime) {
		if (!replay || !replay.frames) {
			return null;
		}

		const newState = {
			...replay,
			currentFrameIndex: Math.min(
				replay.currentFrameIndex + Math.floor(deltaTime * BattleService.FRAMERATE),
				replay.frames.length - 1
			),
			isComplete: replay.currentFrameIndex >= replay.frames.length - 1
		};

		return newState;
	}

	getReplayState(replay) {
		return {
			player: { ...replay.player },
			monsters: replay.monsters?.map(monster => ({ ...monster })),
			currentTime: replay.currentTime,
			duration: replay.duration
		};
	}
}

// Export both the class and an instance
export const battleService = new BattleService();
export default BattleService;