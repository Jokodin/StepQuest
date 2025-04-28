// screens/TownScreen.js

import React, { useEffect, useState } from 'react';
import {
	SafeAreaView,
	View,
	FlatList,
	TouchableOpacity,
	Alert, TouchableHighlight
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import TownDefenseService from '@/services/TownDefenseService';
import { TownUpgradeServiceInstance } from '@/services/TownUpgradeService';
import styles from './TownScreen.styles';
import { colors } from '@/constants/theme';

// format seconds as HH:MM:SS
function formatHHMMSS(totalSeconds) {
	const sec = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(sec / 3600).toString().padStart(2, '0');
	const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
	const s = (sec % 60).toString().padStart(2, '0');
	return `${h}:${m}:${s}`;
}

export default function TownScreen({ navigation }) {
	const [threatLevel, setThreatLevel] = useState(
		() => Math.max(1, TownDefenseService.getThreatLevel())
	);
	const [nextAttackIn, setNextAttackIn] = useState(
		() => TownDefenseService.getNextAttackCountdown()
	);
	const [monsters, setMonsters] = useState(
		() => TownDefenseService.getNextAttackMonsters()
	);
	const [logs, setLogs] = useState([]);
	const [unlocked, setUnlocked] = useState(
		() => TownUpgradeServiceInstance.getUnlockedBuildings()
	);

	// countdown every second
	useEffect(() => {
		const id = setInterval(() => {
			setNextAttackIn(TownDefenseService.getNextAttackCountdown());
		}, 1000);
		return () => clearInterval(id);
	}, []);

	// refresh on each attack
	useEffect(() => {
		function refresh() {
			setThreatLevel(Math.max(1, TownDefenseService.getThreatLevel()));
			setMonsters(TownDefenseService.getNextAttackMonsters());
			const history = TownDefenseService.getHistory() || [];
			setLogs(history.slice(0, 10));
			setUnlocked(TownUpgradeServiceInstance.getUnlockedBuildings());
		}

		refresh();
		TownDefenseService.on('attack', refresh);
		return () => {
			TownDefenseService.off('attack', refresh);
		};
	}, []);

	const handleUnlock = (name, cost) => {
		Alert.alert(
			`Unlock ${name}?`,
			`Spend ${cost} gold to unlock ${name}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Unlock',
					onPress: () => {
						try {
							TownUpgradeServiceInstance.unlockBuilding(name, cost);
							setUnlocked(TownUpgradeServiceInstance.getUnlockedBuildings());
						} catch (e) {
							Alert.alert('Error', e.message);
						}
					},
				},
			]
		);
	};

	const renderLog = ({ item, index }) => (
		<TouchableHighlight
			style={styles.logRow}
			underlayColor={styles.logRow.underlayColor}
			onPress={() => navigation.navigate('BattleLog', { logIndex: index })}
		>
			<View style={styles.logRowContent}>
				<ThemedText>
					{item.time} {item.event} {item.success ? '✅' : '❌'}
				</ThemedText>
				<ChevronRight size={20} color={colors.textSecondary} />
			</View>
		</TouchableHighlight>
	);

	const allBuildings = [
		{ name: 'Town Hall', cost: 0 },
		{ name: 'Blacksmith', cost: 100 },
		{ name: 'Workshop', cost: 150 },
		{ name: 'Arcane Tower', cost: 200 },
		{ name: 'Walls', cost: 120 },
		{ name: 'Farm', cost: 80 },
		{ name: 'Tavern', cost: 90 },
		{ name: 'Market', cost: 70 },
		{ name: 'Barracks', cost: 130 },
		{ name: 'Library', cost: 110 },
	];

	const ListHeader = () => (
		<>
			<View style={[styles.overviewCard, styles.centerContent]}>
				<ThemedText style={styles.sectionTitle}>Monster Threat</ThemedText>
				<ThemedText style={styles.centeredText}>
					{'🔥'.repeat(threatLevel)}
				</ThemedText>
				<ThemedText style={styles.centeredText}>
					Incoming: {monsters}
				</ThemedText>
				<ThemedText style={styles.centeredText}>
					Next Attack: {formatHHMMSS(nextAttackIn)}
				</ThemedText>
			</View>

			<View style={styles.sectionCard}>
				<ThemedText style={styles.sectionHeader}>Town Facilities</ThemedText>
				<View style={styles.facilityGrid}>
					{allBuildings.map(b => {
						const locked = !unlocked.includes(b.name);
						return (
							<TouchableOpacity
								key={b.name}
								style={[
									styles.facilityButton,
									locked ? styles.lockedButton : styles.unlockedButton,
								]}
								onPress={() =>
									locked
										? handleUnlock(b.name, b.cost)
										: navigation.navigate(b.name)
								}
							>
								<ThemedText
									style={locked ? styles.lockedText : styles.facilityText}
								>
									{locked ? `🔒 ${b.name}` : b.name}
								</ThemedText>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<ThemedText style={[styles.sectionHeader, { marginLeft: 16 }]}>
				Defense Logs
			</ThemedText>
		</>
	);

	return (
		<ScreenLayout title="Town">
			<SafeAreaView style={styles.container}>
				<FlatList
					data={logs}
					renderItem={renderLog}
					keyExtractor={(_, i) => String(i)}
					ListHeaderComponent={ListHeader}
					contentContainerStyle={styles.scrollContent}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
