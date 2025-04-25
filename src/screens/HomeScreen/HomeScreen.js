// screens/HomeScreen/HomeScreen.js

import React, { useEffect, useState, useRef } from 'react';
import {
	SafeAreaView,
	View,
	Text,
	Button,
	TouchableOpacity,
	FlatList,
	Animated,
	Easing,
	LayoutAnimation,
	UIManager,
	Platform,
} from 'react-native';
import { colors } from '@/constants/theme';
import ThemedText from '@/components/ThemedText';
import { StepServiceInstance } from '@/services/StepService';
import CharacterService from '@/services/CharacterService';
import TownDefenseService from '@/services/TownDefenseService';
import { TownUpgradeServiceInstance } from '@/services/TownUpgradeService';
import styles from './HomeScreen.styles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_ATTACK_INTERVAL_MS = 30 * 1000; // 30 seconds

function formatHHMMSS(totalSeconds) {
	const sec = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(sec / 3600).toString().padStart(2, '0');
	const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
	const s = (sec % 60).toString().padStart(2, '0');
	return `${h}:${m}:${s}`;
}

export default function HomeScreen({ navigation }) {
	// today's steps and lifetime steps
	const [steps, setSteps] = useState(() => StepServiceInstance.getToday());
	const [lifetime, setLifetime] = useState(() => StepServiceInstance.getLifetime());
	// gold, defense chance
	const [gold, setGold] = useState(() => CharacterService.getCurrentCharacter().stats.gold);
	const [defenseChance, setDefenseChance] = useState(() => TownDefenseService.defenseChance());

	// next attack countdown
	const [nextAttackIn, setNextAttackIn] = useState(DEFAULT_ATTACK_INTERVAL_MS / 1000);

	// monster attack timer
	useEffect(() => {
		let mounted = true;
		TownDefenseService.attackIntervalMs = DEFAULT_ATTACK_INTERVAL_MS;
		TownDefenseService.startAttacks();

		let nextTime = Date.now() + DEFAULT_ATTACK_INTERVAL_MS;
		setNextAttackIn((nextTime - Date.now()) / 1000);

		const onAttack = () => {
			nextTime = Date.now() + DEFAULT_ATTACK_INTERVAL_MS;
			if (mounted) setNextAttackIn((nextTime - Date.now()) / 1000);
		};
		TownDefenseService.on('attack', onAttack);

		const tick = setInterval(() => {
			const secondsLeft = (nextTime - Date.now()) / 1000;
			if (mounted) setNextAttackIn(secondsLeft);
		}, 1000);

		return () => {
			mounted = false;
			clearInterval(tick);
			TownDefenseService.off('attack', onAttack);
			TownDefenseService.stopAttacks();
		};
	}, []);

	// subscribe to step updates (today + lifetime)
	useEffect(() => {
		const onUpdate = ({ today, lifetime: life }) => {
			setSteps(today);
			setLifetime(life);
		};
		StepServiceInstance.on('update', onUpdate);
		return () => StepServiceInstance.off('update', onUpdate);
	}, []);

	// poll gold & defense
	useEffect(() => {
		const id = setInterval(() => {
			setGold(CharacterService.getCurrentCharacter().stats.gold);
			setDefenseChance(TownDefenseService.defenseChance());
		}, 5000);
		return () => clearInterval(id);
	}, []);

	// auth banner animation
	const [authResult, setAuthResult] = useState(null);
	const bannerAnim = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		let mounted = true;
		async function initAuth() {
			const ok = (await TownDefenseService.authorize?.()) || true;
			if (!mounted) return;
			setAuthResult(ok);
			const seq = ok
				? Animated.sequence([
					Animated.timing(bannerAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
					Animated.delay(3000),
					Animated.timing(bannerAnim, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
				])
				: Animated.timing(bannerAnim, { toValue: 1, duration: 300, useNativeDriver: true });
			seq.start();
		}
		initAuth();
		return () => { mounted = false; };
	}, [bannerAnim]);
	const bannerTranslateY = bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });

	// town upgrades
	const [upgrades, setUpgrades] = useState([]);
	const [upCollapsed, setUpCollapsed] = useState(false);
	useEffect(() => {
		function load() {
			const items = Array.from(TownUpgradeServiceInstance.upgrades.entries()).map(
				([id, u]) => ({
					id,
					name: id,
					progress: TownUpgradeServiceInstance.getProgress(id),
					remaining: Math.ceil((u.durationMs * (1 - TownUpgradeServiceInstance.getProgress(id))) / 1000),
				})
			);
			setUpgrades(items);
		}
		load();
		const id = setInterval(load, 5000);
		return () => clearInterval(id);
	}, []);

	function toggleUp() {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setUpCollapsed(prev => !prev);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* AppBar */}
			<View style={styles.appBar}>
				<ThemedText style={styles.title}>My Town</ThemedText>
			</View>

			{/* Town Defense */}
			<View style={[styles.card, styles.fullWidth]}>
				<ThemedText style={styles.sectionTitle}>Town Defense</ThemedText>
				<ThemedText>Next Attack In: {formatHHMMSS(nextAttackIn)}</ThemedText>
				<ThemedText>Success Chance: {Math.round(defenseChance)}%</ThemedText>
			</View>

			{/* Town Upgrades */}
			<View style={[styles.upgradesCard, upCollapsed && { height: 70 }]}>
				<TouchableOpacity onPress={toggleUp} style={styles.upHeader}>
					<ThemedText style={styles.sectionTitle}>Town Upgrades</ThemedText>
					<Text>{upCollapsed ? '+' : '-'}</Text>
				</TouchableOpacity>
				{!upCollapsed && (
					<FlatList
						data={upgrades}
						keyExtractor={item => item.id}
						style={{ flex: 1 }}
						renderItem={({ item }) => (
							<View style={styles.upgradeRow}>
								<ThemedText>{item.name}</ThemedText>
								<View style={{
									height: 8,
									width: '100%',
									backgroundColor: colors.border,
									borderRadius: 4,
									overflow: 'hidden',
									marginVertical: 4,
								}}>
									<View style={{
										height: '100%',
										width: `${item.progress * 100}%`,
										backgroundColor: colors.primary,
									}} />
								</View>
								<ThemedText>{item.remaining}s</ThemedText>
							</View>
						)}
					/>
				)}
				{!upCollapsed && <Button title="+ Add Upgrade" onPress={() => { }} />}
			</View>

			{/* Spacer */}
			<View style={{ flex: 1 }} />

			{/* Quick Nav */}
			<View style={styles.navContainer}>
				<TouchableOpacity style={styles.navTile} onPress={() => navigation.navigate('Town')}>
					<Text style={styles.navIcon}>🏠</Text>
					<ThemedText>Town</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navTile} onPress={() => navigation.navigate('Character')}>
					<Text style={styles.navIcon}>👤</Text>
					<ThemedText>Character</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navTile} onPress={() => navigation.navigate('Inventory')}>
					<Text style={styles.navIcon}>🎒</Text>
					<ThemedText>Inventory</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navTile} onPress={() => navigation.navigate('Store')}>
					<Text style={styles.navIcon}>🛒</Text>
					<ThemedText>Store</ThemedText>
				</TouchableOpacity>
				<TouchableOpacity style={styles.navTile} onPress={() => navigation.navigate('Logs')}>
					<Text style={styles.navIcon}>📜</Text>
					<ThemedText>Logs</ThemedText>
				</TouchableOpacity>
			</View>

			{/* Footer */}
			<View style={styles.footer}>
				<ThemedText>Lifetime steps: {lifetime}</ThemedText>
				<ThemedText>Gold: {gold}</ThemedText>
			</View>

			{/* Auth Banner */}
			{authResult !== null && (
				<Animated.View
					style={[
						styles.banner,
						{
							backgroundColor: authResult ? colors.success : colors.error,
							transform: [{ translateY: bannerTranslateY }],
							opacity: bannerAnim,
						},
					]}>
					<Text style={styles.bannerText}>
						{authResult ? '✅ Connected' : '❌ Auth failed'}
					</Text>
				</Animated.View>
			)}
		</SafeAreaView>
	);
}
