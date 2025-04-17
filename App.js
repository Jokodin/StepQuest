// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import InventoryScreen from './screens/InventoryScreen/InventoryScreen';
import BattleScreen from './screens/BattleScreen/BattleScreen';

const Stack = createNativeStackNavigator();

export default function App() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="Inventory" component={InventoryScreen} />
				<Stack.Screen name="Battle" component={BattleScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
