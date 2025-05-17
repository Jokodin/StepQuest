// App.js
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CharacterScreen from './screens/CharacterScreen/CharacterScreen';
import BattleLogScreen from './screens/BattleLogScreen/BattleLogScreen';
import InventoryScreen from './screens/InventoryScreen/InventoryScreen';
import RewardsScreen from './screens/RewardsScreen/RewardsScreen';
// import CharacterService from 'src/services/CharacterService';
import { StatusBar } from 'react-native';
import LogsScreen from './screens/LogsScreen/LogsScreen';
import './services/WalkRewardService';
import './services/StepService';
import QuestsScreen from './screens/QuestsScreen/QuestsScreen';
import SkillScreen from './screens/SkillScreen/SkillScreen';

const Stack = createNativeStackNavigator();

export default function App() {

	return (
		<NavigationContainer>

			{/* ensure the OS bar is shown and your content sits below it */}
			<StatusBar
				translucent={false}             // don't draw behind it
				backgroundColor="transparent"   // on Android, make it match your header
				barStyle="dark-content"         // or "light-content" to suit your theme
			/>
			<Stack.Navigator initialRouteName="Character">
				<Stack.Screen name="Character" component={CharacterScreen} />
				<Stack.Screen name="Items" component={InventoryScreen} />
				<Stack.Screen name="Walk Logs" component={LogsScreen} />
				<Stack.Screen name="LogDetails" component={BattleLogScreen} />
				<Stack.Screen name="Boxes" component={RewardsScreen} />
				<Stack.Screen name="Quests" component={QuestsScreen} />
				<Stack.Screen name="Skills" component={SkillScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
