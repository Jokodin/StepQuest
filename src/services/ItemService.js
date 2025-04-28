// src/services/ItemService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import Item from '@/models/Item';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Categories list
export const categories = [
	'Weapon',
	'Shield',
	'Armor',
	'Boots',
	'Gloves',
	'Helmet',
	'Jewelry',
	'Belt',
];

// Intrinsic stats generators per category
const intrinsicStatsGenerators = {
	Weapon: () => ({ damage: Math.floor(Math.random() * 100) + 1 }),
	Shield: () => ({ blockChance: Math.floor(Math.random() * 100) + 1 }),
	Armor: () => ({ armor: Math.floor(Math.random() * 100) + 1 }),
	Boots: () => ({ stamina: Math.floor(Math.random() * 100) + 1 }),
	Gloves: () => {
		const raw = 1 - Math.random();
		const fixed = Math.ceil(raw * 100) / 100; // yields 0.01 through 1.00
		return { attackSpeed: fixed };
	},
	Helmet: () => ({ armor: Math.floor(Math.random() * 100) + 1 }),
	Jewelry: () => ({ spellPower: Math.floor(Math.random() * 100) + 1 }),
	Belt: () => ({ health: Math.floor(Math.random() * 100) + 1 }),
};

// Rarity and cost settings
const rarityLevels = ['common', 'uncommon', 'rare'];
const costMultipliers = { common: 1, uncommon: 2, rare: 3 };
const BASE_PRICE = 1000;

// Stat pools and ranges
const statsPool = {
	Weapons: ['attackPower', 'attackSpeed', 'critChance', 'accuracy'],
	Shields: ['defense'],
	Armors: ['defense', 'health'],
	Boots: ['attackSpeed', 'stamina'],
	Gloves: ['critChance', 'attackSpeed'],
	Helmets: ['health', 'defense'],
	Jewelry: ['mana'],
	Belts: ['health', 'stamina', 'defense'],
};
const statRanges = {
	attackPower: [5, 15],
	attackSpeed: [1, 3],
	critChance: [1, 5],
	accuracy: [1, 100],
	defense: [5, 20],
	health: [20, 50],
	mana: [10, 30],
	stamina: [10, 30],
};

/**
 * Roll one random stat (quality-agnostic) for a given category.
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
export function formatName(rarity, category) {
	const cap = rarity.charAt(0).toUpperCase() + rarity.slice(1);
	return `${cap} ${category}`;
}

/**
 * Load (or generate & persist) the store sections.
 * @returns {Promise<Array<{ title: string, data: Item[] }>>}
 */
export async function getStoreSections() {
	const STORAGE_KEY = 'store_items';
	const raw = await AsyncStorage.getItem(STORAGE_KEY);

	let sections;
	if (raw) {
		// parse & rehydrate Items
		const parsed = JSON.parse(raw);
		sections = parsed.map(sec => ({
			title: sec.title,
			data: sec.data.map(obj => {
				const it = Item.fromJSON(obj);
				it.cost = obj.cost;
				return it;
			}),
		}));
	} else {
		// first‐time: generate fresh sections
		sections = categories.map(category => ({
			title: category,
			data: rarityLevels.map(rarity => {
				const cost = BASE_PRICE * costMultipliers[rarity];
				const intrinsic = intrinsicStatsGenerators[category]
					? intrinsicStatsGenerators[category]()
					: {};

				let additional = {};
				switch (rarity) {
					case 'uncommon':
						additional = rollRandomStat(category);
						break;
					case 'rare':
						additional = {
							...rollRandomStat(category),
							...rollRandomStat(category),
						};
						break;
					default:
						additional = {};
				}

				const stats = { ...intrinsic, ...additional };
				const item = new Item({
					id: uuidv4(),
					name: formatName(rarity, category), // name is formatted in UI via formatName()
					category,
					rarity,
					quality: 0,
					stats,
				});
				item.cost = cost;
				return item;
			}),
		}));

		// persist for next time
		const serial = sections.map(sec => ({
			title: sec.title,
			data: sec.data.map(i => ({ ...i.toJSON(), cost: i.cost })),
		}));
		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serial));
	}

	return sections;
}
