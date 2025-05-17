import Item from '@/models/Item';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import SpellService from './SpellService';
import CharacterService from './CharacterService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Categories list
const itemTypes = [
	'weapon',
	'armor',
	'gloves',
	// 'amulet',
];

// Rarity levels and cost settings
const rarityLevels = ['common', 'uncommon', 'rare'];
const costMultipliers = { common: 1, uncommon: 2, rare: 3 };
const BASE_PRICE = 1000;

// Stat pools and ranges for random stats
const statsPool = {
	Weapon: ['damage'],
	Armor: ['armor'],
	Gloves: ['attackSpeed'],
};

const statRanges = {
	damage: [0.1, 1.5], //balanced
	attackSpeed: [0.1, 1.5], //balanced
	armor: [0.1, 0.5], //balanced
};

// Intrinsic stats generators per category (now using statRanges)
const intrinsicStatsGenerators = {
	Weapon: () => {
		const [min, max] = statRanges.damage;
		const raw = Math.random() * (max - min) + min;
		return { damage: Number(raw.toFixed(1)) };
	},
	// Shield: () => {
	// 	const [min, max] = statRanges.blockChance;
	// 	const val = Math.floor(Math.random() * (max - min + 1)) + min;
	// 	return { blockChance: val };
	// },
	Armor: () => {
		const [min, max] = statRanges.armor;
		const raw = Math.random() * (max - min) + min;
		return { armor: Number(raw.toFixed(1)) };
	},
	Gloves: () => {
		const [min, max] = statRanges.attackSpeed;
		const raw = Math.random() * (max - min) + min;
		return { attackSpeed: Number(raw.toFixed(1)) };
	},
	Helmet: () => {
		const [min, max] = statRanges.armor;
		const raw = Math.random() * (max - min) + min;
		return { armor: Number(raw.toFixed(1)) };
	},
	// Ring: () => {
	// 	const [min, max] = statRanges.attackPower;
	// 	const raw = Math.random() * (max - min) + min;
	// 	const fixed = Math.round(raw * 10) / 10;
	// 	return { attackPower: fixed };
	// },
};

/**
 * Roll one random stat for a given category.
 */
function rollRandomStat(itemType) {
	// Convert itemType to proper case for statsPool lookup
	const category = itemType.charAt(0).toUpperCase() + itemType.slice(1);
	const pool = [...(statsPool[category] || [])];
	if (!pool.length) return {};
	const stat = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
	const [min, max] = statRanges[stat] || [1, 1];
	const raw = Math.random() * (max - min) + min;
	return { [stat]: Number(raw.toFixed(1)) };
}

/**
 * Build the human-readable item name.
 */
function formatName(rarity, itemTypes) {
	const cap = rarity.charAt(0).toUpperCase() + rarity.slice(1);
	return `${cap} ${itemTypes}`;
}

/**
 * Pick a rarity based on item level.
 * Each level gives a 10% chance to upgrade rarity, and upgrades can stack.
 */
function pickRarityByLevel(itemLevel) {
	const maxIndex = rarityLevels.length - 1;
	const upgradeChance = Math.min(0.1 * itemLevel, 1);
	let index = 0;
	while (index < maxIndex && Math.random() < upgradeChance) {
		index++;
	}
	return rarityLevels[index];
}

/**
 * Generate a random item for a given item level.
 * @param {number} itemLevel - The level influencing rarity upgrade rolls.
 * @returns {Item}
 */
export function generateItemByLevel(itemLevel) {
	const category = itemTypes[Math.floor(Math.random() * itemTypes.length)];
	const rarity = pickRarityByLevel(itemLevel);
	const cost = BASE_PRICE * costMultipliers[rarity];

	// Convert category to proper case for intrinsicStatsGenerators lookup
	const categoryKey = category.charAt(0).toUpperCase() + category.slice(1);
	const intrinsic = intrinsicStatsGenerators[categoryKey]
		? intrinsicStatsGenerators[categoryKey]()
		: {};

	let additional = {};
	if (rarity === 'uncommon') {
		additional = rollRandomStat(category);
	} else if (rarity === 'rare') {
		additional = { ...rollRandomStat(category), ...rollRandomStat(category) };
	}

	const stats = { ...intrinsic, ...additional };
	const item = new Item({
		id: uuidv4(),
		name: formatName(rarity, category),
		category,
		rarity,
		quality: 0,
		stats,
	});
	item.cost = cost;
	return item;
}

export {
	itemTypes,
	rarityLevels,
	costMultipliers,
	BASE_PRICE,
	intrinsicStatsGenerators,
	rollRandomStat,
	formatName,
	pickRarityByLevel,
};

class ItemService {
	static generateRandomItem(level) {
		try {
			console.log('Generating random item for level:', level);
			const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
			console.log('Selected item type:', type);

			let item;
			switch (type) {
				case 'weapon':
					console.log('Generating weapon...');
					item = this.generateWeapon(level);
					break;
				case 'armor':
					console.log('Generating armor...');
					item = this.generateArmor(level);
					break;
				case 'gloves':
					console.log('Generating gloves...');
					item = this.generateGloves(level);
					break;
				case 'amulet':
					console.log('Generating amulet...');
					item = this.generateAmulet(level);
					break;
			}

			// Capitalize the rarity in the item name
			if (item) {
				const rarity = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1);
				item.name = item.name.replace(item.rarity, rarity);
			}

			console.log('Generated item:', item);
			return item;
		} catch (error) {
			console.error('Error in generateRandomItem:', error);
			throw error;
		}
	}

	static generateWeapon(level) {
		const rarity = this.determineRarity(level);
		const stats = this.generateStats('weapon', rarity);

		return {
			id: `weapon_${Date.now()}`,
			type: 'weapon',
			name: `Weapon`,
			level: level,
			rarity: rarity,
			stats: stats,
			description: this.generateDescription('weapon', rarity, stats)
		};
	}

	static generateArmor(level) {
		const rarity = this.determineRarity(level);
		const stats = this.generateStats('armor', rarity);

		return {
			id: `armor_${Date.now()}`,
			type: 'armor',
			name: `Armor`,
			level: level,
			rarity: rarity,
			stats: stats,
			description: this.generateDescription('armor', rarity, stats)
		};
	}

	static generateGloves(level) {
		console.log('top of gen gloves...');
		const rarity = this.determineRarity(level);
		const stats = this.generateStats('gloves', rarity);
		console.log('Generated gloves:', stats);

		return {
			id: `gloves_${Date.now()}`,
			type: 'gloves',
			name: `Gloves`,
			level: level,
			rarity: rarity,
			stats: stats,
			description: this.generateDescription('gloves', rarity, stats)
		};
	}

	static generateAmulet(level) {
		try {
			//console.log('Starting amulet generation...');
			const rarity = this.determineRarity(level);
			//console.log('Determined rarity:', rarity);

			//console.log('Getting random spell...');
			const spellKey = SpellService.getRandomSpell();
			//console.log('Got spell key:', spellKey);

			//console.log('Getting spell details...');
			const spell = SpellService.getSpell(spellKey);
			//console.log('Got spell:', spell);

			const stats = {
				spell: spellKey,
				...this.generateStats('amulet', rarity)
			};
			//console.log('Generated stats:', stats);

			const item = {
				id: `amulet_${Date.now()}`,
				type: 'amulet',
				name: `Amulet of ${spell.name}`,
				level: level,
				rarity: rarity,
				stats: stats,
				description: `Grants the ability to cast ${spell.name}: ${spell.description}`
			};
			//console.log('Created amulet item:', item);
			return item;
		} catch (error) {
			console.error('Error in generateAmulet:', error);
			throw error;
		}
	}

	static generateStats(itemType, rarity) {
		console.log('top of gen stats...');
		const stats = {};
		const statPool = this.getStatPool(itemType);

		// Special handling for amulets
		if (itemType === 'amulet') {
			// Common amulets only have the spell stat (handled in generateAmulet)
			if (rarity === 'common') {
				return {};
			}
			// For higher rarities, add one or more additional stats
			if (rarity === 'uncommon') {
				// Add one random stat
				const randomStat = statPool[Math.floor(Math.random() * statPool.length)];
				stats[randomStat] = this.rollStatValue(randomStat);
			} else if (rarity === 'rare') {
				// Add all possible stats
				statPool.forEach(stat => {
					stats[stat] = this.rollStatValue(stat);
				});
			}
			return stats;
		}

		// For other item types, use the normal stat generation
		// Always add the primary stat
		const primaryStat = statPool[0];
		if (primaryStat) {
			stats[primaryStat] = this.rollStatValue(primaryStat);
		}

		console.log('stats after primary stat:', stats);

		// Add additional stats based on rarity
		if (rarity === 'uncommon') {
			// Add one random secondary stat
			const availableStats = statPool.filter(stat => !stats[stat]);
			if (availableStats.length > 0) {
				const randomStat = availableStats[Math.floor(Math.random() * availableStats.length)];
				stats[randomStat] = this.rollStatValue(randomStat);
			}
		} else if (rarity === 'rare') {
			// Add all possible stats
			statPool.forEach(stat => {
				if (!stats[stat]) {
					stats[stat] = this.rollStatValue(stat);
				}
			});
		}

		console.log('stats after additional stats:', stats);

		return stats;
	}

	static getStatPool(itemType) {
		switch (itemType) {
			case 'weapon':
				return ['damage', 'attackSpeed', 'attackPower'];
			case 'armor':
				return ['armor', 'health', 'vitality'];
			case 'gloves':
				return ['attackSpeed', 'attackPower'];
			case 'amulet':
				return ['castSpeed', 'mana', 'willpower'];
			default:
				return ['attackSpeed']; // Default to attackSpeed for unknown types
		}
	}

	static rollStatValue(stat) {
		const [min, max] = statRanges[stat];
		const value = Math.random() * (max - min) + min;
		return Number(value.toFixed(1)); // Round to 1 decimal place
	}

	static determineRarity(level) {
		const rarityChances = {
			common: 1,
			uncommon: 0,
			rare: 0
		};

		// Increase rare chance with level
		const levelBonus = Math.min(level * 0.02, 0.2); // Max 20% bonus
		rarityChances.rare += levelBonus;
		rarityChances.common -= levelBonus;

		const roll = Math.random();
		if (roll < rarityChances.rare) return 'rare';
		if (roll < rarityChances.rare + rarityChances.uncommon) return 'uncommon';
		return 'common';
	}

	static calculateStatValue(stat, level, rarity) {
		const baseValue = statRanges[stat][0];
		const maxValue = statRanges[stat][1];
		const rarityMultiplier = {
			common: 1,
			uncommon: 1.5,
			rare: 2
		};

		const levelBonus = level * 0.1;
		const raw = (baseValue + levelBonus) * rarityMultiplier[rarity];
		const value = Math.min(raw, maxValue);
		return Number(value.toFixed(1));
	}

	static generateDescription(itemType, rarity, stats) {
		const statDescriptions = Object.entries(stats)
			.map(([stat, value]) => {
				if (stat === 'spell') return null;
				return `${stat}: ${value}`;
			})
			.filter(Boolean)
			.join(', ');

		return `A ${rarity} ${itemType} with ${statDescriptions}`;
	}

	static async equipItem(characterId, item) {
		try {
			// Get current equipped items
			const equippedRaw = await AsyncStorage.getItem('equipped_items');
			const equippedItems = equippedRaw ? JSON.parse(equippedRaw) : [];

			// Add the new item
			const newEquipped = [...equippedItems, item];
			await AsyncStorage.setItem('equipped_items', JSON.stringify(newEquipped));

			return true;
		} catch (error) {
			console.error('Error equipping item:', error);
			return false;
		}
	}

	static async unequipItem(characterId, item) {
		try {
			// Get current equipped items
			const equippedRaw = await AsyncStorage.getItem('equipped_items');
			const equippedItems = equippedRaw ? JSON.parse(equippedRaw) : [];

			// Remove the item
			const newEquipped = equippedItems.filter(eq => eq.id !== item.id);
			await AsyncStorage.setItem('equipped_items', JSON.stringify(newEquipped));

			return true;
		} catch (error) {
			console.error('Error unequipping item:', error);
			return false;
		}
	}
}

export default ItemService;
