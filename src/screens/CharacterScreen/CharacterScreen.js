// screens/CharacterScreen.js

import React, { useEffect, useState } from 'react';
import {
	SafeAreaView,
	View,
	Text,
	TouchableOpacity,
} from 'react-native';
import ScreenLayout from '@/components/ScreenLayout';
import CharacterService from '@/services/CharacterService';
import SpellsTab from './SpellsTab';
import StatsTab from './StatsTab';
import styles from './CharacterScreen.styles';

// Utility to format stat labels
const formatLabel = key => key
	.replace(/([A-Z])/g, ' $1')
	.replace(/^./, str => str.toUpperCase());

const CharacterScreen = () => {
	const [character, setCharacter] = useState(null);
	const [activeTab, setActiveTab] = useState('stats');

	useEffect(() => {
		loadCharacter();
	}, []);

	const loadCharacter = async () => {
		try {
			const currentCharacter = CharacterService.getCurrentCharacter();
			setCharacter(currentCharacter);
		} catch (error) {
			console.error('Error loading character:', error);
		}
	};

	const renderTabContent = () => {
		if (!character) return null;

		switch (activeTab) {
			case 'stats':
				return <StatsTab character={character} />;
			case 'spells':
				return <SpellsTab character={character} />;
			default:
				return null;
		}
	};

	return (
		<ScreenLayout>
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>Character</Text>
				</View>

				<View style={styles.tabs}>
					<TouchableOpacity
						style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
						onPress={() => setActiveTab('stats')}
					>
						<Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
							Stats
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.tab, activeTab === 'spells' && styles.activeTab]}
						onPress={() => setActiveTab('spells')}
					>
						<Text style={[styles.tabText, activeTab === 'spells' && styles.activeTabText]}>
							Spells
						</Text>
					</TouchableOpacity>
				</View>

				{renderTabContent()}
			</SafeAreaView>
		</ScreenLayout>
	);
};

export default CharacterScreen;
