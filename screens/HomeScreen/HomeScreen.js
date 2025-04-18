// screens/HomeScreen/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import styles from './HomeScreen.styles';

const STEP_GOAL = 100;
const DAILY_GOAL = 10000;
const FIGHT_DURATION = 10; // seconds

const monsterList = [
	{ name: 'Goblin', hp: 50, attack: 5 },
	{ name: 'Skeleton', hp: 40, attack: 7 },
	{ name: 'Orc', hp: 60, attack: 8 },
	{ name: 'Slime', hp: 30, attack: 3 },
	{ name: 'Troll', hp: 80, attack: 10 },
];

function getRandomMonster() {
	return { ...monsterList[Math.floor(Math.random() * monsterList.length)] };
}

export default function HomeScreen() {
	// Activity & Steps
	const [activity, setActivity] = useState('scavenge');
	const [stepsInCycle, setStepsInCycle] = useState(0);
	const [huntSteps, setHuntSteps] = useState(0);
	const [openSteps, setOpenSteps] = useState(0);               // NEW
	const [huntReady, setHuntReady] = useState(false);
	const [openReady, setOpenReady] = useState(false);           // NEW
	const [huntMonster, setHuntMonster] = useState(null);
	const [inventory, setInventory] = useState([]);              // NEW
	const monsterPickedRef = useRef(false);

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

	// Monster-attack countdown
	const [attackTimer, setAttackTimer] = useState(30);
	useEffect(() => {
		const id = setInterval(() => setAttackTimer(t => (t > 0 ? t - 1 : 0)), 1000);
		return () => clearInterval(id);
	}, []);
	const formatTimer = s =>
		`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

	// Daily steps tracker
	const [dailySteps, setDailySteps] = useState(0);
	const fetchDailySteps = async () => {
		const start = new Date(); start.setHours(0, 0, 0, 0);
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const est = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
		setDailySteps(est?.steps?.[0]?.value || 0);
	};
	useEffect(() => {
		fetchDailySteps();
		const id = setInterval(fetchDailySteps, 60000);
		return () => clearInterval(id);
	}, []);

	// Load inventory
	useEffect(() => {
		(async () => {
			const invStr = await AsyncStorage.getItem('inventory');
			setInventory(invStr ? JSON.parse(invStr) : []);
		})();
	}, []);

	// Polling refs
	const huntInterval = useRef(null);
	const openInterval = useRef(null);                             // NEW

	// Google Fit auth
	const authorizeFit = async () => {
		const auth = await GoogleFit.authorize({
			scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
		});
		if (!auth.success) console.error('Google Fit Auth Failure');
		return auth.success;
	};

	// Scavenge polling
	const fetchScavenge = async () => {
		const start = new Date(); start.setHours(0, 0, 0, 0);
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const total = res.find(r => r.source === 'com.google.android.gms:estimated_steps')
			?.steps?.[0]?.value || 0;
		const last = parseInt(await AsyncStorage.getItem('lastTotalSteps')) || total;
		const delta = Math.max(0, total - last);
		const prev = parseInt(await AsyncStorage.getItem('stepsInCycle')) || 0;
		const newCycle = prev + delta;

		const rewards = Math.floor(newCycle / STEP_GOAL);
		if (rewards > 0) {
			const inv = JSON.parse(await AsyncStorage.getItem('inventory') || '[]');
			for (let i = 0; i < rewards; i++) inv.push('unopened');
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));
			setInventory(inv);                                  // update inventory
		}

		const leftover = newCycle % STEP_GOAL;
		setStepsInCycle(leftover);
		await AsyncStorage.setItem('stepsInCycle', leftover.toString());
		await AsyncStorage.setItem('lastTotalSteps', total.toString());
	};

	// Hunt polling & monster pick
	const fetchHunt = async () => {
		if (monsterPickedRef.current) return;
		const start = new Date(); start.setHours(0, 0, 0, 0);
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const total = res.find(r => r.source === 'com.google.android.gms:estimated_steps')
			?.steps?.[0]?.value || 0;
		const last = parseInt(await AsyncStorage.getItem('lastTotalHuntSteps')) || total;
		const delta = Math.max(0, total - last);
		const prev = parseInt(await AsyncStorage.getItem('huntStepsInCycle')) || 0;
		const newCycle = prev + delta;

		if (newCycle >= STEP_GOAL) {
			setHuntMonster(getRandomMonster());
			setHuntReady(true);
			monsterPickedRef.current = true;
			clearInterval(huntInterval.current);
			return;
		}

		setHuntSteps(newCycle);
		await AsyncStorage.setItem('huntStepsInCycle', newCycle.toString());
		await AsyncStorage.setItem('lastTotalHuntSteps', total.toString());
	};

	// Open items polling
	const fetchOpen = async () => {
		if (openReady) return;
		const start = new Date(); start.setHours(0, 0, 0, 0);
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const total = res.find(r => r.source === 'com.google.android.gms:estimated_steps')
			?.steps?.[0]?.value || 0;
		const last = parseInt(await AsyncStorage.getItem('lastTotalOpenSteps')) || total;
		const delta = Math.max(0, total - last);
		const prev = parseInt(await AsyncStorage.getItem('openStepsInCycle')) || 0;
		const newCycle = prev + delta;

		if (newCycle >= STEP_GOAL) {
			setOpenReady(true);
			clearInterval(openInterval.current);
			return;
		}

		setOpenSteps(newCycle);
		await AsyncStorage.setItem('openStepsInCycle', newCycle.toString());
		await AsyncStorage.setItem('lastTotalOpenSteps', total.toString());
	};

	// Initialize on activity change
	useEffect(() => {
		(async () => {
			if (!(await authorizeFit())) return;
			const start = new Date(); start.setHours(0, 0, 0, 0);
			const res = await GoogleFit.getDailyStepCountSamples({
				startDate: start.toISOString(),
				endDate: new Date().toISOString(),
			});
			const totalNow = res.find(r => r.source === 'com.google.android.gms:estimated_steps')
				?.steps?.[0]?.value || 0;

			clearInterval(huntInterval.current);
			clearInterval(openInterval.current);

			if (activity === 'scavenge') {
				await AsyncStorage.setItem('lastTotalSteps', totalNow.toString());
				setStepsInCycle(parseInt(await AsyncStorage.getItem('stepsInCycle')) || 0);
				await fetchScavenge();
				huntInterval.current = setInterval(fetchScavenge, 5000);
			} else if (activity === 'hunt') {
				await AsyncStorage.setItem('lastTotalHuntSteps', totalNow.toString());
				setHuntSteps(parseInt(await AsyncStorage.getItem('huntStepsInCycle')) || 0);
				setHuntReady(false);
				monsterPickedRef.current = false;
				setFightCompleted(false);
				fightCompletedRef.current = false;
				await fetchHunt();
				huntInterval.current = setInterval(fetchHunt, 5000);
			} else if (activity === 'open') {
				await AsyncStorage.setItem('lastTotalOpenSteps', totalNow.toString());
				setOpenSteps(parseInt(await AsyncStorage.getItem('openStepsInCycle')) || 0);
				setOpenReady(false);
				await fetchOpen();
				openInterval.current = setInterval(fetchOpen, 5000);
			}
		})();
		return () => {
			clearInterval(huntInterval.current);
			clearInterval(openInterval.current);
		};
	}, [activity]);

	// Start fight simulation
	const startFight = () => {
		if (fighting || fightCompletedRef.current) return;
		setFighting(true);
		setBattleLog([]);
		setRemainingTime(FIGHT_DURATION);

		const monster = huntMonster;
		const rounds = Math.ceil(monster.hp / 10);
		let totalDamage = 0;
		const log = [];
		let hp = playerHP;

		for (let i = 0; i < rounds; i++) {
			const pd = 10;
			const md = i < rounds - 1
				? 1 + Math.floor(Math.random() * monster.attack)
				: 0;
			totalDamage += md;
			log.push(`🌀 Round ${i + 1}`);
			log.push(`🗡️ You hit ${monster.name} for ${pd}`);
			if (i < rounds - 1) {
				hp = Math.max(hp - md, 0);
				log.push(`💥 ${monster.name} hits YOU for ${md}`);
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
						const remainingHP = playerHP - totalDamage;
						if (remainingHP > 0) {
							setPlayerHP(remainingHP);
							log.push(`🎉 You won! HP now ${remainingHP}.`);
						} else {
							setPlayerHP(100);
							log.push(`💀 Defeated. HP reset to 100.`);
						}
						setBattleLog(prev => [...prev, log[log.length - 1]]);
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
		setHuntSteps(0);
		setHuntReady(false);
		setFightCompleted(false);
		fightCompletedRef.current = false;
		monsterPickedRef.current = false;

		await AsyncStorage.setItem('huntStepsInCycle', '0');
		const start = new Date(); start.setHours(0, 0, 0, 0);
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const totalNow = res.find(r => r.source === 'com.google.android.gms:estimated_steps')
			?.steps?.[0]?.value || 0;
		await AsyncStorage.setItem('lastTotalHuntSteps', totalNow.toString());

		await fetchHunt();
		huntInterval.current = setInterval(fetchHunt, 5000);
	};

	// Open an item
	const handleOpen = async () => {
		const invStr = await AsyncStorage.getItem('inventory');
		const inv = invStr ? JSON.parse(invStr) : [];
		const idx = inv.indexOf('unopened');
		if (idx !== -1) {
			inv.splice(idx, 1);
			await AsyncStorage.setItem('inventory', JSON.stringify(inv));
			setInventory(inv);
		}
		setOpenSteps(0);
		setOpenReady(false);
		await AsyncStorage.setItem('openStepsInCycle', '0');

		const start = new Date(); start.setHours(0, 0, 0, 0);
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const totalNow = res.find(r => r.source === 'com.google.android.gms:estimated_steps')
			?.steps?.[0]?.value || 0;
		await AsyncStorage.setItem('lastTotalOpenSteps', totalNow.toString());

		await fetchOpen();
		openInterval.current = setInterval(fetchOpen, 5000);
	};

	// Debug
	const addDebugSteps = async () => {
		if (activity === 'scavenge') {
			const v = stepsInCycle + 10;
			setStepsInCycle(v);
			await AsyncStorage.setItem('stepsInCycle', v.toString());
		} else if (activity === 'hunt') {
			const v = huntSteps + 10;
			if (v >= STEP_GOAL && !monsterPickedRef.current) {
				setHuntMonster(getRandomMonster());
				setHuntReady(true);
				monsterPickedRef.current = true;
			}
			setHuntSteps(v);
			await AsyncStorage.setItem('huntStepsInCycle', v.toString());
		} else if (activity === 'open') {
			const v = openSteps + 10;
			if (v >= STEP_GOAL && !openReady) {
				setOpenReady(true);
			}
			setOpenSteps(v);
			await AsyncStorage.setItem('openStepsInCycle', v.toString());
		}
	};

	const showOpenOption = inventory.includes('unopened');

	return (
		<View style={styles.container}>
			<Text style={styles.timer}>
				Next monster attack: {formatTimer(attackTimer)}
			</Text>

			<Text style={styles.pickerLabel}>Choose an activity:</Text>
			<Picker
				selectedValue={activity}
				onValueChange={setActivity}
				style={styles.picker}
				dropdownIconColor="#fff"
			>
				<Picker.Item label="Scavenge for Items" value="scavenge" />
				<Picker.Item label="Hunt Monsters" value="hunt" />
				{showOpenOption && (
					<Picker.Item label="Open Items" value="open" />
				)}
			</Picker>

			<View style={styles.main}>
				{activity === 'scavenge' && (
					<Text style={styles.counter}>{stepsInCycle} / {STEP_GOAL} steps</Text>
				)}

				{activity === 'hunt' && !huntReady && !fighting && !fightCompleted && (
					<Text style={styles.counter}>{huntSteps} / {STEP_GOAL} steps</Text>
				)}

				{activity === 'hunt' && huntReady && !fighting && !fightCompleted && (
					<>
						<Text style={styles.label}>A wild {huntMonster.name} appears!</Text>
						<View style={styles.fightButtons}>
							<View style={styles.actionButton}>
								<Button title="Start Fight" onPress={startFight} />
							</View>
							<View style={styles.actionButton}>
								<Button title="Run Away" onPress={handleReturn} />
							</View>
						</View>
					</>
				)}

				{activity === 'hunt' && (fighting || fightCompleted) && (
					<>
						<Text style={styles.label}>
							{fighting
								? `Fighting ${huntMonster.name}... (${remainingTime}s)`
								: 'Fight over.'}
						</Text>
						<ScrollView style={styles.logContainer}>
							{battleLog.map((line, i) => (
								<Text key={i} style={styles.logText}>{line}</Text>
							))}
						</ScrollView>
					</>
				)}

				{activity === 'hunt' && fightCompleted && (
					<Button title="Return" onPress={handleReturn} />
				)}

				{activity === 'open' && !openReady && (
					<Text style={styles.counter}>{openSteps} / {STEP_GOAL} steps</Text>
				)}
				{activity === 'open' && openReady && (
					<Button title="Open Item" onPress={handleOpen} />
				)}
			</View>

			<View style={styles.debugButtonContainer}>
				<Button title="+10 steps" onPress={addDebugSteps} />
			</View>

			<View style={styles.dailyContainer}>
				<Text style={styles.dailyCounter}>
					Daily Steps: {dailySteps} / {DAILY_GOAL}
				</Text>
			</View>
		</View>
	);
}
