// screens/HomeScreen/HomeScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit from 'react-native-google-fit';
import { authorizeFit } from './GoogleFitAuth';
import styles from './HomeScreen.styles';
import HuntPanel from './Hunt/HuntPanel';
import useHuntSteps from './Hunt/useHuntSteps';
import { withStats, simulateWinChance } from './Hunt/huntUtils';
import EarnPanel from './EarnPanel';
import useEarnSteps from './Earn/useEarnSteps';
import ExplorePanel from './ExplorePanel';
import useExploreSteps from './Explore/useExploreSteps';

const DAILY_GOAL = 10000;
const FIGHT_DURATION = 3; // seconds
const DEFAULT_GOLD_PER_STEP = 0.10;

// now each monster only has a level
const monsterList = [
	{ name: 'Slime', level: 1 },
	{ name: 'Goblin', level: 2 },
	{ name: 'Skeleton', level: 3 },
	{ name: 'Orc', level: 4 },
	{ name: 'Troll', level: 5 },
];

const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];
function getItemLevel(itemName) {
	if (!itemName) return 1;
	const rarity = itemName.split(' ')[0].toLowerCase();
	const idx = rarityOrder.indexOf(rarity);
	return idx >= 0 ? idx + 1 : 1;
}

export default function HomeScreen({ navigation }) {
	// Authorization readiness
	const [fitReady, setFitReady] = useState(false);

	// Activity & Steps
	const [activity, setActivity] = useState('hunt');
	const [dailySteps, setDailySteps] = useState(0);
	const isActivityInitialized = useRef(false);

	useEffect(() => {
		if (isActivityInitialized.current) {
			AsyncStorage.setItem('activity', activity);
		} else {
			isActivityInitialized.current = true;
		}
	}, [activity]);

	// selected monster + win chances
	const [selectedMonsterName, setSelectedMonsterName] = useState(monsterList[0].name);
	const [winChances, setWinChances] = useState({});

	// hunt logic moved to hook
	const {
		huntSteps,
		huntReady,
		huntMonster,
		setHuntMonster,
		setHuntReady,
		debugHuntSteps,
		resetHunt
	} = useHuntSteps(fitReady, activity === 'hunt', selectedMonsterName);

	// earn‑gold logic moved to hook
	const { gold } = useEarnSteps(fitReady, activity === 'earn');

	// Explore-specific state
	const {
		exploreSteps,
		exploreLevel,
		exploreReady,
		onExploreComplete
	} = useExploreSteps(fitReady, activity === 'explore');


	// Equipment
	const [equippedSword, setEquippedSword] = useState(null);
	const [equippedArmor, setEquippedArmor] = useState(null);

	// Battle state
	const [fighting, setFighting] = useState(false);
	const [fightCompleted, setFightCompleted] = useState(false);
	const fightCompletedRef = useRef(false);
	const [remainingTime, setRemainingTime] = useState(FIGHT_DURATION);
	const [battleLog, setBattleLog] = useState([]);
	const [playerHP, setPlayerHP] = useState(100);

	const fullLogRef = useRef([]);
	const logIntervalRef = useRef(null);
	const timerRef = useRef(null);

	// Interval refs for other modes
	const exploreInterval = useRef(null);
	const dailyInterval = useRef(null);

	// Load persisted data on mount
	useEffect(() => {
		(async () => {
			const sw = await AsyncStorage.getItem('equippedSword');
			const ar = await AsyncStorage.getItem('equippedArmor');
			setEquippedSword(sw);
			setEquippedArmor(ar);

			const lastAct = await AsyncStorage.getItem('activity');
			if (lastAct === 'hunt' || lastAct === 'earn' || lastAct === 'explore') {
				setActivity(lastAct);
			}
		})();
	}, []);

	// Helper to fetch total steps from midnight
	const fetchTotalSteps = async () => {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		try {
			const res = await GoogleFit.getDailyStepCountSamples({
				startDate: start.toISOString(),
				endDate: new Date().toISOString(),
			});
			const sample = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
			return sample?.steps?.reduce((sum, entry) => sum + entry.value, 0) || 0;
		} catch (err) {
			console.error('Step fetch error', err);
			return 0;
		}
	};

	// Main effect: authorize & set up polling for explore mode (earn logic removed)
	useEffect(() => {
		(async () => {
			const ok = await authorizeFit();
			setFitReady(ok);
		})();
	}, []);

	useEffect(() => {
		if (!fitReady) return;

		const clearAll = () => {
			clearInterval(exploreInterval.current);
			clearInterval(dailyInterval.current);
		};
		clearAll();

		(async () => {
			setDailySteps(await fetchTotalSteps());
		})();
		dailyInterval.current = setInterval(async () => {
			setDailySteps(await fetchTotalSteps());
		}, 60000);

		(async () => {
			const totalNow = await fetchTotalSteps();
			await AsyncStorage.setItem('lastTotalExploreSteps', totalNow.toString());

			setExploreSteps(parseInt(await AsyncStorage.getItem('exploreStepsInCycle'), 10) || 0);
			setExploreReady(false);

			if (activity === 'explore') {
				await fetchExplore();
				exploreInterval.current = setInterval(fetchExplore, 5000);
			}
		})();

		return clearAll;
	}, [fitReady, activity, exploreLevel]);

	// Simulate win chances when dependencies change
	useEffect(() => {
		const atkLevel = getItemLevel(equippedSword);
		const playerAtk = atkLevel * 10;
		const armorMit = getItemLevel(equippedArmor) * 10;
		const map = {};
		monsterList.forEach(mon => {
			map[mon.name] = simulateWinChance(playerHP, playerAtk, armorMit, mon);
		});
		setWinChances(map);
	}, [playerHP, equippedSword, equippedArmor]);

	// Update huntMonster if user re-selects after ready
	useEffect(() => {
		if (activity === 'hunt' && huntReady) {
			const base = monsterList.find(m => m.name === selectedMonsterName) || monsterList[0];
			setHuntMonster(withStats(base));
		}
	}, [selectedMonsterName, huntReady]);

	// Start fight simulation
	const startFight = () => {
		if (fighting || fightCompletedRef.current) return;
		setFighting(true);
		setBattleLog([]);
		setRemainingTime(FIGHT_DURATION);

		const stats = withStats(huntMonster);
		let monsterHP = stats.hp;
		let playerCurrentHP = playerHP;
		const log = [];

		const playerAtk = getItemLevel(equippedSword) * 10;
		const armorMit = getItemLevel(equippedArmor) * 10;

		while (monsterHP > 0 && playerCurrentHP > 0) {
			monsterHP -= playerAtk;
			log.push(`🗡️ You hit ${stats.name} for ${playerAtk} (${Math.max(monsterHP, 0)}/${stats.hp})`);
			if (monsterHP > 0) {
				const rawDmg = 1 + Math.floor(Math.random() * stats.attack);
				const netDmg = Math.max(1, rawDmg - armorMit);
				playerCurrentHP -= netDmg;
				log.push(`💥 ${stats.name} hits YOU for ${netDmg} (${Math.max(playerCurrentHP, 0)}/100)`);
			}
		}

		fullLogRef.current = log;
		let idx = 0;
		const lineInterval = (FIGHT_DURATION * 1000) / log.length;

		logIntervalRef.current = setInterval(() => {
			setBattleLog(prev => {
				const next = [...prev, fullLogRef.current[idx]];
				idx++;
				if (idx >= fullLogRef.current.length) clearInterval(logIntervalRef.current);
				return next;
			});
		}, lineInterval);

		timerRef.current = setInterval(() => {
			setRemainingTime(r => {
				if (r <= 1) {
					clearInterval(timerRef.current);
					clearInterval(logIntervalRef.current);
					if (!fightCompletedRef.current) {
						setPlayerHP(playerCurrentHP);
						const resultText = playerCurrentHP > 0
							? `🎉 You won! Remaining HP: ${playerCurrentHP}`
							: `💀 You were defeated. HP reset to 100`;
						setBattleLog(prev => [...prev, resultText]);
						if (playerCurrentHP <= 0) setPlayerHP(100);
						setFightCompleted(true);
						fightCompletedRef.current = true;
					}
					setFighting(false);
					return 0;
				}
				return r - 1;
			});
		}, 1000);
	};

	// Return / Run away
	const handleReturn = () => {
		setBattleLog([]);
		resetHunt();
		setFightCompleted(false);
		fightCompletedRef.current = false;
	};

	// Debug: manually add steps
	const addDebugSteps = () => {
		if (activity === 'hunt') {
			debugHuntSteps(10);
		} else {
			// for explore
			const v = exploreSteps + 1000;
			setExploreSteps(v);
			AsyncStorage.setItem('exploreStepsInCycle', v.toString());
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.pickerLabel}>Choose an activity:</Text>
			<Picker
				selectedValue={activity}
				onValueChange={setActivity}
				style={styles.picker}
			>
				<Picker.Item label="Hunt Monsters" value="hunt" />
				<Picker.Item label="Earn Gold" value="earn" />
				<Picker.Item label="Explore" value="explore" />
			</Picker>

			<View style={[styles.main, activity === 'hunt' && { justifyContent: 'flex-start' }]}>
				{activity === 'hunt' && (
					<HuntPanel
						huntSteps={huntSteps}
						huntReady={huntReady}
						huntingMonster={huntMonster}
						fighting={fighting}
						fightCompleted={fightCompleted}
						remainingTime={remainingTime}
						battleLog={battleLog}
						onStartFight={startFight}
						onReturn={handleReturn}
						selectedMonsterName={selectedMonsterName}
						onSelectMonster={setSelectedMonsterName}
						winChances={winChances}
						monsterOptions={monsterList}
						exploreLevel={exploreLevel}
					/>
				)}

				{activity === 'earn' && (
					<EarnPanel
						goldPerStep={DEFAULT_GOLD_PER_STEP}
						gold={gold}
					/>
				)}

				{activity === 'explore' && (
					<ExplorePanel
						exploreSteps={exploreSteps}
						exploreLevel={exploreLevel}
						exploreReady={exploreReady}
						exploreGoal={exploreLevel * 1000}
						onExploreComplete={onExploreComplete}
					/>
				)}
			</View>

			<View style={styles.debugButtonContainer}>
				<Button title="+steps" onPress={addDebugSteps} />
			</View>

			<View style={styles.buttonRow}>
				<View style={styles.buttonWrapper}>
					<Button title="Go to Store" onPress={() => navigation.navigate('Store')} />
				</View>
				<View style={styles.buttonWrapper}>
					<Button title="Go to Inventory" onPress={() => navigation.navigate('Inventory')} />
				</View>
			</View>

			<View style={styles.dailyContainer}>
				<Text style={styles.dailyCounter}>
					Daily Steps: {dailySteps} / {DAILY_GOAL}
				</Text>
			</View>
		</View>
	);
}
