import AsyncStorage from '@react-native-async-storage/async-storage';

class QuestService {
	static async generateDailyQuest() {
		const attributes = ['strength', 'intelligence', 'dexterity', 'vitality', 'willpower'];
		const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
		const stepGoal = 10000; // Fixed daily step goal

		const quest = {
			id: Date.now().toString(),
			type: 'daily',
			stepGoal,
			attribute: randomAttribute,
			progress: 0,
			expiresAt: new Date().setHours(23, 59, 59, 999), // End of day
			completed: false
		};

		await AsyncStorage.setItem('current_daily_quest', JSON.stringify(quest));
		return quest;
	}

	static async getCurrentDailyQuest() {
		try {
			const questJson = await AsyncStorage.getItem('current_daily_quest');
			if (!questJson) {
				return await this.generateDailyQuest();
			}

			const quest = JSON.parse(questJson);
			const now = new Date();
			const questDate = new Date(quest.expiresAt);

			// If quest is from a previous day, generate a new one
			if (now.getDate() !== questDate.getDate() ||
				now.getMonth() !== questDate.getMonth() ||
				now.getFullYear() !== questDate.getFullYear()) {
				return await this.generateDailyQuest();
			}

			return quest;
		} catch (error) {
			console.error('Error getting current daily quest:', error);
			return await this.generateDailyQuest();
		}
	}

	static async generateHourlyQuest() {
		const attributes = ['strength', 'intelligence', 'dexterity', 'vitality', 'willpower'];
		const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
		const stepGoal = Math.floor(Math.random() * 1000) + 1000; // Random between 1000-2000
		//const stepGoal = Math.floor(Math.random() * 5) + 1;

		const quest = {
			id: Date.now().toString(),
			type: 'hourly',
			stepGoal,
			attribute: randomAttribute,
			progress: 0,
			expiresAt: Date.now() + 3600000, // 1 hour from now
			completed: false
		};

		await AsyncStorage.setItem('current_hourly_quest', JSON.stringify(quest));
		return quest;
	}

	static async getCurrentHourlyQuest() {
		try {
			const questJson = await AsyncStorage.getItem('current_hourly_quest');
			if (!questJson) {
				return await this.generateHourlyQuest();
			}

			const quest = JSON.parse(questJson);
			if (quest.expiresAt < Date.now()) {
				return await this.generateHourlyQuest();
			}

			return quest;
		} catch (error) {
			console.error('Error getting current hourly quest:', error);
			return await this.generateHourlyQuest();
		}
	}

	static async updateQuestProgress(steps) {
		try {
			// Get current quests
			const [hourlyQuest, dailyQuest] = await Promise.all([
				this.getCurrentHourlyQuest(),
				this.getCurrentDailyQuest()
			]);

			// Update hourly quest progress if not completed
			if (hourlyQuest && !hourlyQuest.completed) {
				hourlyQuest.progress = steps;
				await AsyncStorage.setItem('current_hourly_quest', JSON.stringify(hourlyQuest));
			}

			// Update daily quest progress if not completed
			if (dailyQuest && !dailyQuest.completed) {
				dailyQuest.progress = steps;
				await AsyncStorage.setItem('current_daily_quest', JSON.stringify(dailyQuest));
			}

			return { hourlyQuest, dailyQuest };
		} catch (error) {
			console.error('Error updating quest progress:', error);
			return null;
		}
	}

	static async claimQuestReward(questType) {
		try {
			const quest = questType === 'hourly'
				? await this.getCurrentHourlyQuest()
				: await this.getCurrentDailyQuest();

			if (quest && quest.progress >= quest.stepGoal && !quest.completed) {
				quest.completed = true;
				await AsyncStorage.setItem(
					questType === 'hourly' ? 'current_hourly_quest' : 'current_daily_quest',
					JSON.stringify(quest)
				);
				return quest;
			}
			return null;
		} catch (error) {
			console.error('Error claiming quest reward:', error);
			return null;
		}
	}

	static async checkAndResetQuests() {
		try {
			const storedQuests = await AsyncStorage.getItem('quests');
			if (!storedQuests) return;

			const quests = JSON.parse(storedQuests);
			const now = new Date().getTime();

			// Check daily quests
			const dailyExpired = quests.daily.some(q => q.expiresAt < now);
			if (dailyExpired) {
				quests.daily = await this.generateDailyQuests();
			}

			// Check hourly quests
			const hourlyExpired = quests.hourly.some(q => q.expiresAt < now);
			if (hourlyExpired) {
				quests.hourly = await this.generateHourlyQuests();
			}

			await AsyncStorage.setItem('quests', JSON.stringify(quests));
		} catch (error) {
			console.error('Error checking and resetting quests:', error);
		}
	}

	static async getCurrentQuests() {
		try {
			await this.checkAndResetQuests();
			const storedQuests = await AsyncStorage.getItem('quests');
			return storedQuests ? JSON.parse(storedQuests) : null;
		} catch (error) {
			console.error('Error getting current quests:', error);
			return null;
		}
	}
}

export default QuestService; 