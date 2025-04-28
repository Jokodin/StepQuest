// App.js
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { colors } from '@/constants/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TownScreen from './screens/TownScreen/TownScreen';
import CharacterScreen from './screens/CharacterScreen/CharacterScreen';
import BattleLogScreen from './screens/BattleLogScreen/BattleLogScreen';
import InventoryScreen from './screens/InventoryScreen/InventoryScreen';
import TownDefenseService from 'src/services/TownDefenseService';
import { TownUpgradeServiceInstance } from 'src/services/TownUpgradeService';
import TownContributionService from 'src/services/TownContributionService';
import PrestigeService from 'src/services/PrestigeService';
import CharacterService from 'src/services/CharacterService';
import StoreScreen from './screens/StoreScreen/StoreScreen';
import { StatusBar } from 'react-native';
import LogsScreen from './screens/LogsScreen/LogsScreen';
import '@/services/WalkRewardService';
import '@/services/StepService';

const Stack = createNativeStackNavigator();
const MyDarkTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: colors.background,
		card: colors.surface,
		text: colors.text,
		border: colors.border,
		primary: colors.primary,
	},
};

const prestigeSvc = new PrestigeService({
	characterService: CharacterService,
	townContributionService: TownContributionService,
});

// Start the attack loop
TownDefenseService.startAttacks();

// Listen for attacks
TownDefenseService.on('attack', ({ success }) => {
	if (success) {
		// TownDefenseService.grantReward();
	} else {
		// TownUpgradeServiceInstance.pauseAll();
	}
});

export default function App() {
	useEffect(() => {
		TownDefenseService.startAttacks();
		return () => TownDefenseService.stopAttacks();
	}, []);

	AppState.addEventListener('change', state => {
		if (state === 'active') {
			TownDefenseService.processMissedAttacks();
		}
	});

	return (
		<NavigationContainer>

			{/* ensure the OS bar is shown and your content sits below it */}
			<StatusBar
				translucent={false}             // don’t draw behind it
				backgroundColor="transparent"   // on Android, make it match your header
				barStyle="dark-content"         // or "light-content" to suit your theme
			/>
			<Stack.Navigator initialRouteName="Town">
				<Stack.Screen name="Town" component={TownScreen} />
				<Stack.Screen name="Character" component={CharacterScreen} />
				<Stack.Screen name="BattleLog" component={BattleLogScreen} />
				<Stack.Screen name="Items" component={InventoryScreen} />
				<Stack.Screen name="Store" component={StoreScreen} />
				<Stack.Screen name="Logs" component={LogsScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
