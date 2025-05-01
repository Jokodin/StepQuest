// screens/StoreScreen/StoreScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
	SafeAreaView,
	SectionList,
	View,
	Text,
	Button,
	Alert,
	Pressable,
	ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/theme';
import styles from './StoreScreen.styles';
import ScreenLayout from '@/components/ScreenLayout';
import { getStoreSections, formatName } from '@/services/ItemService';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function StoreScreen() {
	const [gold, setGold] = useState(0);
	const [sections, setSections] = useState(null);
	const [expanded, setExpanded] = useState({});
	const [timer, setTimer] = useState(3600);

	// Refresh store: only common items per category, every 10s
	useEffect(() => {
		let isMounted = true;
		const loadSections = async () => {
			try {
				// Clear persisted store to force regeneration
				await AsyncStorage.removeItem('store_items');
				const all = await getStoreSections();
				const commonOnly = all.map(({ title, data }) => ({
					title,
					data,
				}));
				if (isMounted) {
					setSections(commonOnly);
					setTimer(3600);
				}
			} catch (err) {
				console.error('Failed to load store sections', err);
			}
		};
		loadSections();
		const intervalId = setInterval(loadSections, 10000);
		return () => {
			isMounted = false;
			clearInterval(intervalId);
		};
	}, []);

	// Countdown timer
	useEffect(() => {
		const tick = setInterval(() => {
			setTimer(prev => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(tick);
	}, []);

	// Load gold from storage
	useEffect(() => {
		AsyncStorage.getItem('gold').then(g => setGold(g ? +g : 0));
	}, []);

	// Purchase handler
	const handleBuy = useCallback(
		async item => {
			if (gold < item.cost) {
				return Alert.alert('Not enough gold');
			}
			const newGold = gold - item.cost;
			setGold(newGold);
			await AsyncStorage.setItem('gold', String(newGold));

			const inv = JSON.parse((await AsyncStorage.getItem('inventory')) || '[]');
			inv.push({ ...item.toJSON(), id: uuidv4() });
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));

			Alert.alert('Bought!', formatName(item.rarity, item.category));
		},
		[gold]
	);

	if (!sections) {
		return (
			<ScreenLayout title="Store">
				<ActivityIndicator size="large" color={colors.primary} />
			</ScreenLayout>
		);
	}

	return (
		<ScreenLayout title="Store">
			<SafeAreaView style={styles.container}>
				{/* Refresh timer display */}
				<View style={{ paddingVertical: 8, alignItems: 'center' }}>
					<Text style={{ fontSize: 16, color: colors.primary }}>
						Refresh in {timer}s
					</Text>
				</View>

				<SectionList
					sections={sections}
					extraData={[gold, expanded]}
					keyExtractor={item => item.id}
					renderSectionHeader={({ section: { title } }) => (
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeader}>{title}</Text>
						</View>
					)}
					renderItem={({ item }) => {
						const name = formatName(item.rarity, item.category);
						return (
							<View>
								<Pressable
									onPress={() =>
										setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))
									}
									style={({ pressed }) => [
										styles.shopItem,
										pressed && styles.shopItemPressed,
									]}
								>
									<Text
										style={[styles.itemText, { color: colors[item.rarity] }]}>
										{name}
									</Text>
								</Pressable>
								{expanded[item.id] && (
									<View style={styles.statsContainer}>
										{Object.entries(item.stats).map(([s, v]) => (
											<Text key={s} style={styles.statText}>
												{s}: {v}
											</Text>
										))}
										<Button
											title={`Buy (${item.cost})`}
											onPress={() => handleBuy(item)}
											disabled={gold < item.cost}
										/>
									</View>
								)}
							</View>
						);
					}}
					contentContainerStyle={styles.listContent}
				/>
			</SafeAreaView>
		</ScreenLayout>
	);
}
