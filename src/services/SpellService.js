// services/SpellService.js

import { colors } from '@/constants/theme';

// Spell definitions
export const SPELLS = {
	FIREBALL: {
		key: 'FIREBALL',
		name: 'Fireball',
		description: 'Launches a fireball at the enemy',
		damage: 20,
		cooldown: 3, // seconds
		manaCost: 30,
		color: colors.error,
		cast: (caster, target) => {
			const damage = caster.intelligence * 0.5 + SPELLS.FIREBALL.damage;
			return {
				damage,
				text: `${caster.name} casts Fireball for ${Math.floor(damage)} damage!`
			};
		}
	},
	HEAL: {
		key: 'HEAL',
		name: 'Heal',
		description: 'Restores health to the caster',
		healing: 15,
		cooldown: 4,
		manaCost: 25,
		color: colors.primary,
		cast: (caster, target) => {
			const healing = caster.intelligence * 0.3 + SPELLS.HEAL.healing;
			return {
				healing,
				text: `${caster.name} casts Heal for ${Math.floor(healing)} health!`
			};
		}
	},
	FROST_NOVA: {
		key: 'FROST_NOVA',
		name: 'Frost Nova',
		description: 'Freezes enemies in place',
		damage: 10,
		cooldown: 5,
		manaCost: 40,
		color: colors.primary,
		cast: (caster, target) => {
			const damage = caster.intelligence * 0.4 + SPELLS.FROST_NOVA.damage;
			return {
				damage,
				text: `${caster.name} casts Frost Nova for ${Math.floor(damage)} damage!`
			};
		}
	},
	LIGHTNING_BOLT: {
		key: 'LIGHTNING_BOLT',
		name: 'Lightning Bolt',
		description: 'Strikes the enemy with lightning',
		damage: 25,
		cooldown: 3,
		manaCost: 35,
		color: colors.primary,
		cast: (caster, target) => {
			const damage = caster.intelligence * 0.6 + SPELLS.LIGHTNING_BOLT.damage;
			return {
				damage,
				text: `${caster.name} casts Lightning Bolt for ${Math.floor(damage)} damage!`
			};
		}
	}
};

class SpellService {
	static getRandomSpell() {
		const spellKeys = Object.keys(SPELLS);
		const randomIndex = Math.floor(Math.random() * spellKeys.length);
		return SPELLS[spellKeys[randomIndex]].key;
	}

	static getSpell(spellKey) {
		return SPELLS[spellKey];
	}

	static castSpell(spellKey, caster, target) {
		const spell = SPELLS[spellKey];
		if (!spell) return null;

		// Deduct mana cost
		caster.currentMana -= spell.manaCost;

		return spell.cast(caster, target);
	}

	static canCastSpell(spellKey, caster, lastCastTime) {
		const spell = SPELLS[spellKey];
		if (!spell) return false;

		// Check cooldown
		const currentTime = Date.now();
		const timeSinceLastCast = (currentTime - lastCastTime) / 1000; // Convert to seconds
		if (timeSinceLastCast < spell.cooldown) return false;

		// Check mana
		if (caster.currentMana < spell.manaCost) return false;

		return true;
	}
}

export default SpellService; 