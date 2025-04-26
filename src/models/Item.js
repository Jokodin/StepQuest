// src/models/Item.js
export default class Item {
	/**
	 * @param {object} opts
	 * @param {string} opts.id         Unique ID (e.g. UUID or `${category}-${name}-${index}`)
	 * @param {string} opts.name
	 * @param {string} opts.category   One of: 'Weapons', 'Shields', …
	 * @param {'common'|'uncommon'|'rare'} opts.rarity
	 * @param {number} [opts.quality=0]  Quality level (starts at 0)
	 * @param {{ [statName: string]: number }} [opts.stats={}]
	 */
	constructor({ id, name, category, rarity, quality = 0, stats = {} }) {
		this.id = id;
		this.name = name;
		this.category = category;
		this.rarity = rarity;
		this.quality = quality;
		this.stats = stats;
	}

	// Example helper: upgrade quality (consumes gems, etc)
	upgradeQuality() {
		if (this.quality < /* blacksmithLevel */ Infinity) {
			this.quality++;
			// you could recalculate stat values here based on new quality
		}
	}

	// You can also add methods to serialize/deserialize to AsyncStorage
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			category: this.category,
			rarity: this.rarity,
			quality: this.quality,
			stats: this.stats
		};
	}

	static fromJSON(json) {
		return new Item(json);
	}
}
