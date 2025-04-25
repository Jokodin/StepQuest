// src/services/TownContributionService.js
// Manages NPC contributions to the town’s defense.

class TownContributionService {
	constructor() {
		this.npcContributors = []; // array of stats objects
	}

	/**
	 * Add an NPC's stats to the contributor pool.
	 * @param {{ power: number }} stats
	 */
	addNPC(stats) {
		this.npcContributors.push({ ...stats });
	}

	/**
	 * Compute total defensive contribution from all NPCs.
	 * @returns {number}
	 */
	getTotalContribution() {
		return this.npcContributors.reduce((sum, s) => sum + (s.power || 0), 0);
	}

	/**
	 * Clear all NPC contributors (e.g., on full reset).
	 */
	resetContributors() {
		this.npcContributors = [];
	}
}

export default new TownContributionService();