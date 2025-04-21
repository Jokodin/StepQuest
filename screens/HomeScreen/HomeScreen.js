// screens/HomeScreen/HomeScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit from 'react-native-google-fit';
import { useIsFocused } from '@react-navigation/native';
import { authorizeFit } from './GoogleFitAuth';
import styles from './HomeScreen.styles';
import HuntPanel from './Hunt/HuntPanel';
import EarnPanel from './EarnPanel';
import ExplorePanel from './ExplorePanel';
import useHuntSteps from './Hunt/useHuntSteps';  // <-- new hook

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

// helper to compute hp and attack from level
function withStats(mon) {
	return {
		...mon,
		hp: mon.level * 50,
		attack: mon.level * 10,
	};
}

const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];
function getItemLevel(itemName) {
	if (!itemName) return 1;
	const rarity = itemName.split(' ')[0].toLowerCase();
	const idx = rarityOrder.indexOf(rarity);
	return idx >= 0 ? idx + 1 : 1;
}

// Simulate win chance vs a single monster, factoring in weapon attack & armor mitigation
function simulateWinChance(playerHP, playerAtk, armorMit, monster, sims = 100) {
	const stats = withStats(monster);
	let wins = 0;
	for (let i = 0; i < sims; i++) {
		let hp = playerHP;
		let mHP = stats.hp;
		while (hp > 0 && mHP > 0) {
			mHP -= playerAtk;
			if (mHP <= 0) {
				wins++;
				break;
			}
			const rawDmg = 1 + Math.floor(Math.random() * stats.attack);
			const netDmg = Math.max(1, rawDmg - armorMit);
			hp -= netDmg;
		}
	}
	return Math.round((wins / sims) * 100);
}

export default function HomeScreen({ navigation }) {
	// Authorization readiness
	const [fitReady, setFitReady] = useState(false);

	// Navigation focus
	const isFocused = useIsFocused();

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

	// Explore-specific state
	const [exploreSteps, setExploreSteps] = useState(0);
	const [exploreLevel, setExploreLevel] = useState(1);
	const [exploreReady, setExploreReady] = useState(false);

	// Earn-gold state
	const [goldPerStep] = useState(DEFAULT_GOLD_PER_STEP);
	const [gold, setGold] = useState(0);

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
	const earnInterval = useRef(null);
	const exploreInterval = useRef(null);
	const dailyInterval = useRef(null);

	// Load persisted data on mount
	useEffect(() => {
		(async () => {
			const storedGold = parseFloat(await AsyncStorage.getItem('gold'));
			setGold(isNaN(storedGold) ? 0 : storedGold);

			const storedLevel = parseInt(await AsyncStorage.getItem('exploreLevel'), 10);
			if (!isNaN(storedLevel) && storedLevel > 0) {
				setExploreLevel(storedLevel);
			}

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

	// Refresh gold counter when returning to this screen
	useEffect(() => {
		if (isFocused) {
			(async () => {
				const storedGold = parseFloat(await AsyncStorage.getItem('gold'));
				setGold(isNaN(storedGold) ? 0 : storedGold);
			})();
		}
	}, [isFocused]);

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

	// Main effect: authorize & set up polling for earn & explore modes
	useEffect(() => {
		(async () => {
			const ok = await authorizeFit();
			setFitReady(ok);
		})();
	}, []);

	useEffect(() => {
		if (!fitReady) return;

		const clearAll = () => {
			clearInterval(earnInterval.current);
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
			await AsyncStorage.setItem('lastTotalEarnSteps', totalNow.toString());
			await AsyncStorage.setItem('lastTotalExploreSteps', totalNow.toString());

			setExploreSteps(parseInt(await AsyncStorage.getItem('exploreStepsInCycle'), 10) || 0);
			setExploreReady(false);

			if (activity === 'earn') {
				await fetchEarn();
				earnInterval.current = setInterval(fetchEarn, 5000);
			} else if (activity === 'explore') {
				await fetchExplore();
				exploreInterval.current = setInterval(fetchExplore, 5000);
			}
		})();

		return clearAll;
	}, [fitReady, activity, exploreLevel]);

	const fetchEarn = async () => {
		const total = await fetchTotalSteps();
		const last = parseInt(await AsyncStorage.getItem('lastTotalEarnSteps'), 10) || total;
		const delta = Math.max(0, total - last);
		if (delta > 0) {
			const gain = delta * goldPerStep;
			const newGold = gold + gain;
			setGold(newGold);
			await AsyncStorage.setItem('gold', newGold.toString());
			await AsyncStorage.setItem('lastTotalEarnSteps', total.toString());
		}
	};

	const fetchExplore = async () => {
		const goal = exploreLevel * 1000;
		if (exploreReady) return;
		const total = await fetchTotalSteps();
		const last = parseInt(await AsyncStorage.getItem('lastTotalExploreSteps'), 10) || total;
		const prev = parseInt(await AsyncStorage.getItem('exploreStepsInCycle'), 10) || 0;
		const delta = Math.max(0, total - last);
		const newCycle = prev + delta;

		if (newCycle >= goal) {
			setExploreReady(true);
			clearInterval(exploreInterval.current);
		} else {
			setExploreSteps(newCycle);
			await AsyncStorage.setItem('exploreStepsInCycle', newCycle.toString());
			await AsyncStorage.setItem('lastTotalExploreSteps', total.toString());
		}
	};

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

	// Handle explore completion
	const handleExploreComplete = async () => {
		setExploreSteps(0);
		setExploreReady(false);
		await AsyncStorage.setItem('exploreStepsInCycle', '0');
		const next = exploreLevel + 1;
		setExploreLevel(next);
		await AsyncStorage.setItem('exploreLevel', next.toString());
	};

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
	const handleReturn = async () => {
		setBattleLog([]);
		// reset our hunt hook back to zero and clear the monster
		resetHunt();
		setFightCompleted(false);
		fightCompletedRef.current = false;
	};

	// Debug: manually add steps/gold
	const addDebugSteps = async () => {
		if (activity === 'hunt') {
			debugHuntSteps(10);
		} else if (activity === 'earn') {
			const gain = 1000 * goldPerStep;
			const newGold = gold + gain;
			setGold(newGold);
			await AsyncStorage.setItem('gold', newGold.toString());
			const last = parseInt(await AsyncStorage.getItem('lastTotalEarnSteps'), 10) || 0;
			await AsyncStorage.setItem('lastTotalEarnSteps', (last + 10).toString());
		} else {
			const v = exploreSteps + 1000;
			setExploreSteps(v);
			await AsyncStorage.setItem('exploreStepsInCycle', v.toString());
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

				{activity === 'earn' && <EarnPanel goldPerStep={goldPerStep} gold={gold} />}

				{activity === 'explore' && (
					<ExplorePanel
						exploreSteps={exploreSteps}
						exploreLevel={exploreLevel}
						exploreReady={exploreReady}
						exploreGoal={exploreLevel * 1000}
						onExploreComplete={handleExploreComplete}
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
