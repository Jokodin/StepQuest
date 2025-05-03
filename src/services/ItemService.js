import Item from '@/models/Item';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Categories list
const categories = [
	'Weapon',
	'Armor',
	'Gloves',
	'Helmet',
	'Ring',
	'Amulet',
];

// Rarity levels and cost settings
const rarityLevels = ['common', 'uncommon', 'rare'];
const costMultipliers = { common: 1, uncommon: 2, rare: 3 };
const BASE_PRICE = 1000;

// Stat pools and ranges for random stats
const statsPool = {
	Weapon: ['damage', 'attackPower'],
	Armor: ['armor', 'health'],
	Gloves: ['attackSpeed'],
	Helmet: ['health', 'armor'],
	Ring: ['attackPower'],
};

const statRanges = {
	damage: [0.1, 1.5], // balanced
	attackPower: [0.1, 1.5], // multiplier of damage - may need nerf
	attackSpeed: [0.1, 1.5], // multiplier of damage - may need nerf
	armor: [0.1, 0.5], // balanced
	health: [1, 6], // balanced
};

// Intrinsic stats generators per category (now using statRanges)
const intrinsicStatsGenerators = {
	Weapon: () => {
		const [min, max] = statRanges.damage;
		const raw = Math.random() * (max - min) + min;
		const fixed = Math.round(raw * 100) / 100;
		return { damage: fixed };
	},
	Shield: () => {
		const [min, max] = statRanges.blockChance;
		const val = Math.floor(Math.random() * (max - min + 1)) + min;
		return { blockChance: val };
	},
	Armor: () => {
		const [min, max] = statRanges.armor;
		const raw = Math.random() * (max - min) + min;
		const fixed = Math.round(raw * 10) / 10;
		return { armor: fixed };
	},
	Gloves: () => {
		const [min, max] = statRanges.attackSpeed;
		const raw = Math.random() * (max - min) + min;
		const fixed = Math.round(raw * 100) / 100;
		return { attackSpeed: fixed };
	},
	Helmet: () => {
		const [min, max] = statRanges.armor;
		const raw = Math.random() * (max - min) + min;
		const fixed = Math.round(raw * 10) / 10;
		return { armor: fixed };
	},
	Ring: () => {
		const [min, max] = statRanges.attackPower;
		const raw = Math.random() * (max - min) + min;
		const fixed = Math.round(raw * 10) / 10;
		return { attackPower: fixed };
	},
	Amulet: () => {
		const [min, max] = statRanges.health;
		const val = Math.floor(Math.random() * (max - min + 1)) + min;
		return { health: val };
	},
};

/**
 * Roll one random stat for a given category.
 */
function rollRandomStat(category) {
	const pool = [...(statsPool[category] || [])];
	if (!pool.length) return {};
	const stat = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
	const [min, max] = statRanges[stat] || [1, 1];
	const val = Math.floor(Math.random() * (max - min + 1)) + min;
	return { [stat]: val };
}

/**
 * Build the human-readable item name.
 */
function formatName(rarity, category) {
	const cap = rarity.charAt(0).toUpperCase() + rarity.slice(1);
	return `${cap} ${category}`;
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
	const category = categories[Math.floor(Math.random() * categories.length)];
	const rarity = pickRarityByLevel(itemLevel);
	const cost = BASE_PRICE * costMultipliers[rarity];

	const intrinsic = intrinsicStatsGenerators[category]
		? intrinsicStatsGenerators[category]()
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
	categories,
	rarityLevels,
	costMultipliers,
	BASE_PRICE,
	intrinsicStatsGenerators,
	rollRandomStat,
	formatName,
	pickRarityByLevel,
};
