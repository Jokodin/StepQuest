// screens/LogsScreen/LogsScreen.js

import React, { useState, useEffect } from 'react';
import {
	SafeAreaView,
	View,
	FlatList,
	TouchableHighlight,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import ThemedText from '@/components/ThemedText';
import ScreenLayout from '@/components/ScreenLayout';
import WalkRewardService from '@/services/WalkRewardService';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '@/constants/theme';
import styles from '../TownScreen/TownScreen.styles';

export default function LogsScreen({ navigation }) {
	const isFocused = useIsFocused();
	const [logs, setLogs] = useState([]);

	// load & refresh on updates or focus
	useEffect(() => {
		const refresh = () => setLogs(WalkRewardService.getHistory());
		refresh();
		WalkRewardService.onUpdate(refresh);
		return () => WalkRewardService.offUpdate(refresh);
	}, []);

	useEffect(() => {
		if (isFocused) {
			setLogs(WalkRewardService.getHistory());
		}
	}, [isFocused]);

	const renderLog = ({ item, index }) => (
		<TouchableHighlight
			style={styles.logRow}
			underlayColor={styles.logRow.underlayColor}
			onPress={() =>
				navigation.navigate('BattleLog', {
					logType: 'walk',
					logIndex: index,
				})
			}
		>
			<View style={styles.logRowContent}>
				{/* [StepCount] - [Win/Loss] - [Monsters] */}
				<ThemedText>
					{item.stepCount} steps - {item.success ? 'Win' : 'Loss'} - {item.monsters.join(', ')}
				</ThemedText>
				<ChevronRight size={20} color={colors.textSecondary} />
			</View>
		</TouchableHighlight>
	);

	return (
		<ScreenLayout title="Walk Logs">
			<SafeAreaView style={styles.container}>
				<FlatList
					data={logs}
					renderItem={renderLog}
					keyExtractor={(_, i) => String(i)}
					contentContainerStyle={styles.scrollContent}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<ThemedText style={styles.emptyText}>No walk‐battle logs yet</ThemedText>
						</View>
					}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
