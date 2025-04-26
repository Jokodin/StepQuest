// screens/CharacterScreen.js

import React, { useEffect, useState } from 'react';
import {
	SafeAreaView,
	ScrollView,
	View,
	Image,
	Button,
} from 'react-native';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import CharacterService from '@/services/CharacterService';
import styles from './CharacterScreen.styles';

export default function CharacterScreen({ navigation }) {
	// load character data
	const [stats, setStats] = useState({});
	const [name, setName] = useState('');
	const [avatarUri, setAvatarUri] = useState(null);

	useEffect(() => {
		const char = CharacterService.getCurrentCharacter();
		setStats(char.stats);
		setName(char.name || 'Unknown Hero');
		setAvatarUri(char.avatarUri || null);
	}, []);

	const statList = [
		{ label: 'Health (HP)', value: stats.hp },
		{ label: 'Mana (MP)', value: stats.mp },
		{ label: 'Stamina', value: stats.stamina },
		{ label: 'Spell Power', value: stats.spellPower },
		{ label: 'Attack Power', value: stats.attackPower },
		{ label: 'Defense Power', value: stats.defensePower },
		{ label: 'Attack Speed', value: `${stats.attackSpeed}/s` },
		{ label: 'Accuracy', value: `${stats.accuracy}%` },
		{ label: 'Crit Chance', value: `${stats.critChance}%` },
		// { label: 'Dodge Chance', value: `${stats.dodgeChance}%` },
		{ label: 'Cast Chance', value: `${stats.castChance}%` },
		{ label: 'Block Chance', value: `${stats.blockChance}%` },
		{ label: 'Age', value: `${stats.age} days` },
	];

	return (
		<ScreenLayout title="Character">
			<SafeAreaView style={styles.container}>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Avatar & Name */}
					<View style={styles.profileHeader}>
						<ThemedText style={styles.name}>{name}</ThemedText>
					</View>

					{/* Stats Grid */}
					<View style={styles.statsGrid}>
						{statList.map(({ label, value }) => (
							<View key={label} style={styles.statCell}>
								<ThemedText style={styles.statLabel}>{label}</ThemedText>
								<ThemedText style={styles.statValue}>{value}</ThemedText>
							</View>
						))}
					</View>
				</ScrollView>
			</SafeAreaView>
		</ScreenLayout>
	);
}
