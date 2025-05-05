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
		// Base health of 10 at level 1, scaling by 5 per level
		const baseHealth = 100 + (level - 1) * 3;
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
	static simulateBattle(player, monsters) {
		console.log('[BattleService] Starting battle simulation');
		console.log('Player:', player);
		console.log('Monsters:', monsters);

		// Initialize player state
		player.attackCooldown = 0;
		player.currentHealth = player.stats.health;

		// Initialize monsters with proper stats
		const initializedMonsters = monsters.map(m => ({
			id: m.id,
			level: m.level,
			maxHp: BattleService.calculateMonsterHealth(m.level),
			baseDamage: BattleService.calculateMonsterDamage(m.level),
			attackSpeed: BattleService.calculateMonsterAttackSpeed(m.level),
			currentHp: undefined, // Will be set below
			attackCooldown: 0
		}));

		const battleLog = {
			initialPlayerHealth: player.stats.health,
			initialPlayerMana: player.stats.willpower * 100,
			playerAttackSpeed: player.stats.attackSpeed,
			playerDamage: player.stats.damage,
			monsters: initializedMonsters,
			logs: [],
			duration: 0
		};

		console.log('Initial battle log:', battleLog);

		// Initialize monster HP
		initializedMonsters.forEach(monster => {
			monster.currentHp = monster.maxHp;
			monster.attackCooldown = 0;
		});

		let currentTime = 0;
		let iterationCount = 0;
		const MAX_ITERATIONS = 1000; // Safety limit
		const TIME_PER_ITERATION = 1 / BattleService.FRAMERATE; // 0.1 seconds per iteration

		console.log('Starting battle loop');

		// Helper function to create log entries
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

		// Add initial battle log
		battleLog.logs.push(createLogEntry(
			'System',
			0,
			0,
			'Battle begins!',
			currentTime,
			initializedMonsters.map(m => ({
				id: m.id,
				level: m.level,
				maxHp: m.maxHp,
				baseDamage: m.baseDamage
			}))
		));

		while (player.currentHealth > 0 && initializedMonsters.some(m => m.currentHp > 0) && iterationCount < MAX_ITERATIONS) {
			iterationCount++;
			currentTime += TIME_PER_ITERATION;

			// Player's turn
			if (player.attackCooldown <= 0) {
				const target = initializedMonsters.find(m => m.currentHp > 0);
				if (target) {
					const damage = player.stats.damage;
					target.currentHp = Math.max(0, target.currentHp - damage);

					battleLog.logs.push(createLogEntry(
						player.name,
						player.stats.health,
						player.currentHealth,
						`${player.name} hits ${target.id} for ${damage} damage`,
						currentTime,
						{
							id: target.id,
							level: target.level,
							maxHp: target.maxHp,
							baseDamage: target.baseDamage
						}
					));

					if (target.currentHp <= 0) {
						battleLog.logs.push(createLogEntry(
							target.id,
							target.maxHp,
							0,
							`${target.id} is defeated.`,
							currentTime + TIME_PER_ITERATION
						));
					}

					player.attackCooldown = 1 / player.stats.attackSpeed;
				}
			} else {
				player.attackCooldown = Math.max(0, player.attackCooldown - TIME_PER_ITERATION);
			}

			// Monsters' turn
			initializedMonsters.forEach(monster => {
				if (monster.currentHp > 0 && monster.attackCooldown <= 0) {
					const damage = monster.baseDamage;
					player.currentHealth = Math.max(0, player.currentHealth - damage);

					battleLog.logs.push(createLogEntry(
						monster.id,
						monster.maxHp,
						monster.currentHp,
						`${monster.id} deals ${damage} damage`,
						currentTime,
						{
							id: monster.id,
							level: monster.level,
							maxHp: monster.maxHp,
							baseDamage: monster.baseDamage
						}
					));

					if (player.currentHealth <= 0) {
						battleLog.logs.push(createLogEntry(
							player.name,
							player.stats.health,
							0,
							`${player.name} has been defeated.`,
							currentTime + TIME_PER_ITERATION
						));
					}

					monster.attackCooldown = 1;
				} else if (monster.currentHp > 0) {
					monster.attackCooldown = Math.max(0, monster.attackCooldown - TIME_PER_ITERATION);
				}
			});

			// Break if battle is over
			if (player.currentHealth <= 0 || initializedMonsters.every(m => m.currentHp <= 0)) {
				console.log('Battle ended:', {
					playerHealth: player.currentHealth,
					monstersAlive: initializedMonsters.filter(m => m.currentHp > 0).length
				});
				break;
			}
		}

		if (iterationCount >= MAX_ITERATIONS) {
			console.warn('Battle reached maximum iterations');
		}

		// Add final victory message if player won
		if (player.currentHealth > 0) {
			battleLog.logs.push(createLogEntry(
				'All',
				0,
				0,
				'All monsters have been defeated!',
				currentTime + 2
			));
		}

		battleLog.duration = currentTime;
		battleLog.success = player.currentHealth > 0;
		//console.log('Battle completed. Final log:', battleLog);
		return battleLog;
	}

	// Add new methods for battle replay
	createBattleReplay(battleEntry) {
		console.log('Creating battle replay from:', battleEntry);
		if (!battleEntry || !battleEntry.logs) {
			console.error('Invalid battle log format:', battleEntry);
			return null;
		}

		// Get initial monster stats from the first log entry
		const initialMonsterStats = battleEntry.logs[0]?.monsterStats || [];
		console.log('Initial monster stats:', initialMonsterStats);

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

		console.log('Monster map:', Array.from(monsterMap.entries()));

		// Get player name and initial stats from the first player log entry
		const firstPlayerLog = battleEntry.logs.find(log => log.actor !== 'System' && log.actor !== 'All');
		const playerName = firstPlayerLog?.actor || 'Player';
		const playerMaxHp = firstPlayerLog?.actorMaxHp || 10;
		let nextPlayerAttack = 0;

		console.log('Player stats:', { name: playerName, maxHp: playerMaxHp });

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
				attackCooldown: 0, // Start at 0 instead of 1
				attackSpeed: 1
			},
			monsters: Array.from(monsterMap.values()).map(monster => ({
				id: monster.id,
				name: monster.id,
				currentHp: monster.currentHp,
				maxHp: monster.maxHp,
				currentMana: 100,
				maxMana: 100,
				attackCooldown: 0, // Start at 0 instead of 1
				attackSpeed: monster.attackSpeed
			}))
		};

		console.log('Initial frame:', initialFrame);
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
					currentFrame.player.attackCooldown = 0; // Reset to 0 when attacking
				}
			} else if (nextLog.displayText.includes('deals')) {
				// Monster attack
				currentFrame.player.currentHp = nextLog.actorCurrentHp;
				const attacker = currentFrame.monsters.find(m => m.id === nextLog.actor);
				if (attacker) {
					const monsterData = monsterMap.get(attacker.id);
					if (monsterData) {
						monsterData.nextAttack = currentTime;
						attacker.attackCooldown = 0; // Reset to 0 when attacking
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

		console.log('Created replay with frames:', frames.length);
		return {
			frames,
			currentFrameIndex: 0,
			isComplete: false
		};
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