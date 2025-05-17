import AsyncStorage from '@react-native-async-storage/async-storage';
import ItemService from './ItemService';
import CharacterService from './CharacterService';

const ATTRIBUTES = ['strength', 'intelligence', 'dexterity', 'vitality', 'willpower'];

class SkillService {
	constructor() {
		this.availablePoints = 0;
		this.currentOptions = [];
		this.selectedSkills = [];
		this.isInitialized = false;
		this._init();
	}

	async _init() {
		try {
			const storedSkills = await AsyncStorage.getItem('skills');
			if (storedSkills) {
				const parsed = JSON.parse(storedSkills);
				this.availablePoints = parsed.availablePoints || 0;
				this.currentOptions = parsed.currentOptions || [];
				this.selectedSkills = parsed.selectedSkills || [];
			} else {
				this.availablePoints = 0;
				this.currentOptions = [];
				this.selectedSkills = [];
				await this.saveSkills();
			}
		} catch (error) {
			console.error('Failed to initialize skills:', error);
			this.availablePoints = 0;
			this.currentOptions = [];
			this.selectedSkills = [];
		} finally {
			this.isInitialized = true;
		}
	}

	async saveSkills() {
		try {
			await AsyncStorage.setItem(
				'skills',
				JSON.stringify({
					availablePoints: this.availablePoints,
					currentOptions: this.currentOptions,
					selectedSkills: this.selectedSkills,
				})
			);
		} catch (error) {
			console.error('Failed to save skills:', error);
		}
	}

	/**
	 * Add a skill point to the player's available points
	 */
	async addSkillPoint() {
		this.availablePoints++;
		await this.saveSkills();
	}

	/**
	 * Generate three random skill options
	 * @returns {Array} Array of three skill options
	 */
	generateSkillOptions() {
		// Generate three random attribute skills
		const options = [];
		const usedAttributes = new Set();

		while (options.length < 3) {
			const randomIndex = Math.floor(Math.random() * ATTRIBUTES.length);
			const attribute = ATTRIBUTES[randomIndex];

			// Ensure we don't duplicate attributes
			if (!usedAttributes.has(attribute)) {
				usedAttributes.add(attribute);
				options.push({
					type: 'attribute',
					attribute: attribute,
					value: 1,
					description: `+1 ${attribute.charAt(0).toUpperCase() + attribute.slice(1)}`,
				});
			}
		}

		this.currentOptions = options;
		this.saveSkills();
		return options;
	}

	/**
	 * Select a skill from the current options
	 * @param {number} optionIndex - Index of the selected option
	 * @returns {Object} The selected skill
	 */
	async selectSkill(optionIndex) {
		if (optionIndex < 0 || optionIndex >= this.currentOptions.length) {
			throw new Error('Invalid skill option index');
		}

		if (this.availablePoints <= 0) {
			throw new Error('No skill points available');
		}

		const selectedSkill = this.currentOptions[optionIndex];
		this.selectedSkills.push(selectedSkill);
		this.availablePoints--;
		this.currentOptions = [];
		await this.saveSkills();

		// Update character stats if it's an attribute skill
		if (selectedSkill.type === 'attribute') {
			const character = await CharacterService.getCurrentCharacter();
			const currentValue = character.stats[selectedSkill.attribute] || 0;
			const newStats = {
				...character.stats,
				[selectedSkill.attribute]: currentValue + selectedSkill.value
			};
			await CharacterService.updateStats(newStats);
		}

		return selectedSkill;
	}

	/**
	 * Get the current skill state
	 * @returns {Object} Current skill state
	 */
	getCurrentState() {
		if (!this.isInitialized) {
			return {
				availablePoints: 0,
				currentOptions: [],
				selectedSkills: [],
			};
		}
		return {
			availablePoints: this.availablePoints,
			currentOptions: this.currentOptions,
			selectedSkills: this.selectedSkills,
		};
	}
}

export default new SkillService(); 