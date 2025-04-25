// src/services/TownUpgradeService.js
// Manages purchase, progress, pausing of town upgrades, and building unlocks.

import TownDefenseService from '@/services/TownDefenseService';

export class TownUpgradeService {
	constructor() {
		// key: upgradeId -> { cost, durationMs, startedAt, pausedUntil }
		this.upgrades = new Map();

		// Default placeholder upgrades for testing
		const now = Date.now();
		for (let i = 1; i <= 10; i++) {
			this.upgrades.set(`placeholder-${i}`, {
				cost: i * 10,
				durationMs: i * 30 * 1000,  // i * 30 seconds
				startedAt: now - (i * 15 * 1000), // staggered starts
				pausedUntil: null,
			});
		}

		// Buildings unlock state
		this.unlockedBuildings = new Set(['Town Hall']);
	}

	/**
	 * Begin a new upgrade.
	 * Deducts gold from TownDefenseService.
	 */
	purchaseUpgrade(upgradeId, { cost, durationMs }) {
		if (this.upgrades.has(upgradeId)) {
			throw new Error('Upgrade already in progress');
		}
		TownDefenseService.spendGold(cost);
		this.upgrades.set(upgradeId, {
			cost,
			durationMs,
			startedAt: Date.now(),
			pausedUntil: null,
		});
		return true;
	}

	/**
	 * Returns progress 0→1 for an upgrade.
	 */
	getProgress(upgradeId) {
		const u = this.upgrades.get(upgradeId);
		if (!u) return 0;
		const now = Date.now();
		const start = u.pausedUntil !== null ? u.pausedUntil : u.startedAt;
		const elapsed = now - start;
		return Math.min(elapsed / u.durationMs, 1);
	}

	/**
	 * If an upgrade is complete, remove it and return true.
	 */
	completeUpgrade(upgradeId) {
		if (this.getProgress(upgradeId) >= 1) {
			this.upgrades.delete(upgradeId);
			console.log(`Upgrade ${upgradeId} complete!`);
			return true;
		}
		return false;
	}

	/**
	 * Pause all in-progress upgrades for a penalty duration.
	 */
	pauseAll(durationMs = 60 * 60 * 1000) {
		const now = Date.now();
		for (const u of this.upgrades.values()) {
			if (u.pausedUntil === null) {
				u.pausedUntil = now + durationMs;
			}
		}
	}

	// --- Building unlock API ---

	/**
	 * Check if a building is unlocked.
	 */
	isBuildingUnlocked(name) {
		return this.unlockedBuildings.has(name);
	}

	/**
	 * Unlock a building by spending gold.
	 */
	unlockBuilding(name, cost) {
		if (this.unlockedBuildings.has(name)) {
			return false; // already unlocked
		}
		TownDefenseService.spendGold(cost);
		this.unlockedBuildings.add(name);
		return true;
	}

	/**
	 * Get list of unlocked buildings.
	 */
	getUnlockedBuildings() {
		return Array.from(this.unlockedBuildings);
	}
}

export const TownUpgradeServiceInstance = new TownUpgradeService();
