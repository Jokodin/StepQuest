// src/services/PrestigeService.js
// Handles player prestige: converting current character to NPC and starting fresh.

class PrestigeService {
	constructor({ characterService, townContributionService }) {
		this.characterService = characterService;
		this.townContributionService = townContributionService;
	}

	async prestige() {
		const oldChar = this.characterService.getCurrentCharacter();
		// 1. Register old character as NPC defender
		this.townContributionService.addNPC(oldChar.stats);
		// 2. Reset player character
		await this.characterService.createNewCharacter();
		console.log('Prestige complete: new character created, old one now defends the town.');
	}
}

export default PrestigeService;