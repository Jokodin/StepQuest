// screens/BattleScreen/BattleScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './BattleScreen.styles';

const monsterList = [
	{ name: 'Goblin', hp: 50, attack: 5 },
	{ name: 'Skeleton', hp: 40, attack: 7 },
	{ name: 'Orc', hp: 60, attack: 8 },
	{ name: 'Slime', hp: 30, attack: 3 },
	{ name: 'Troll', hp: 80, attack: 10 },
];

const FIGHT_DURATION = 10; // seconds

function getRandomMonster() {
	const index = Math.floor(Math.random() * monsterList.length);
	return { ...monsterList[index] };
}

function calculateWinChance(playerHP, playerAtk) {
	let totalWins = 0;
	const simulationsPerMonster = 100;

	for (const monster of monsterList) {
		let wins = 0;
		for (let sim = 0; sim < simulationsPerMonster; sim++) {
			let hp = playerHP;
			const rounds = Math.ceil(monster.hp / playerAtk);
			for (let i = 0; i < rounds - 1; i++) {
				const dmg = 1 + Math.floor(Math.random() * monster.attack);
				hp -= dmg;
				if (hp <= 0) break;
			}
			if (hp > 0) wins++;
		}
		totalWins += wins;
	}

	const totalSimulations = simulationsPerMonster * monsterList.length;
	return Math.round((totalWins / totalSimulations) * 100);
}

export default function BattleScreen() {
	const [playerHP, setPlayerHP] = useState(100);
	const [winChance, setWinChance] = useState(() => calculateWinChance(100, 10));
	const [fighting, setFighting] = useState(false);
	const [fightResult, setFightResult] = useState(null);
	const [remainingTime, setRemainingTime] = useState(FIGHT_DURATION);
	const [battleLog, setBattleLog] = useState([]);
	const fullLogRef = useRef([]);
	const logIntervalRef = useRef(null);
	const intervalRef = useRef(null);

	useEffect(() => {
		const loadPlayerHP = async () => {
			const stored = await AsyncStorage.getItem('playerHP');
			const currentHP = stored ? parseInt(stored) : 100;
			setPlayerHP(currentHP);
			setWinChance(calculateWinChance(currentHP, 10));
		};
		loadPlayerHP();
	}, []);

	const startFight = () => {
		if (fighting) return;
		setFighting(true);
		setFightResult(null);
		setRemainingTime(FIGHT_DURATION);

		const monster = getRandomMonster();
		const roundsToKill = Math.ceil(monster.hp / 10);
		let totalDamage = 0;
		const log = [];

		let monsterHP = monster.hp;
		let currentPlayerHP = playerHP;

		for (let i = 0; i < roundsToKill; i++) {
			const monsterDamage = i < roundsToKill - 1 ? 1 + Math.floor(Math.random() * monster.attack) : 0;
			const playerDamage = 10;
			totalDamage += monsterDamage;
			monsterHP = Math.max(monsterHP - playerDamage, 0);
			log.push(`🌀 Round ${i + 1}`);
			log.push(`🗡️ You hit ${monster.name} for ${playerDamage} damage (${monsterHP}/${monster.hp})`);
			if (i < roundsToKill - 1) {
				currentPlayerHP = Math.max(currentPlayerHP - monsterDamage, 0);
				log.push(`💥 ${monster.name} hits YOU for ${monsterDamage} damage (${currentPlayerHP}/100)`);
			}
		}

		fullLogRef.current = log;
		setBattleLog([]);
		let logIndex = 0;
		const intervalPerLine = (FIGHT_DURATION * 1000) / log.length;
		logIntervalRef.current = setInterval(() => {
			setBattleLog(prev => {
				const next = [...prev, log[logIndex]];
				logIndex++;
				if (logIndex >= log.length) {
					clearInterval(logIntervalRef.current);
				}
				return next;
			});
		}, intervalPerLine);

		intervalRef.current = setInterval(() => {
			setRemainingTime(prev => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					handleFightOutcome(monster, totalDamage, log);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleFightOutcome = async (monster, totalDamage, log) => {
		const remainingHP = playerHP - totalDamage;
		if (remainingHP > 0) {
			setPlayerHP(remainingHP);
			setWinChance(calculateWinChance(remainingHP, 10));
			log.push(`🎉 You won! Took ${totalDamage} total damage.`);
			setFightResult('You won the fight!');
			await AsyncStorage.setItem('playerHP', remainingHP.toString());
		} else {
			log.push('💀 You were defeated. HP reset to 100.');
			setFightResult('You were defeated...');
			setPlayerHP(100);
			setWinChance(calculateWinChance(100, 10));
			await AsyncStorage.setItem('playerHP', '100');
		}
		setFighting(false);
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.section}>
				<Text style={styles.title}>Battle Simulator</Text>
				<Text style={styles.label}>Possible Monsters:</Text>
				{monsterList.map(monster => (
					<Text key={monster.name} style={styles.stat}>
						- {monster.name}: {monster.hp} HP, {monster.attack} ATK
					</Text>
				))}
			</View>

			<View style={styles.section}>
				<Text style={styles.stat}>Your HP: {playerHP}</Text>
				<Text style={styles.stat}>Your Attack: 10</Text>
				{winChance !== null && <Text style={styles.stat}>Chance to Win: {winChance}%</Text>}
			</View>

			<Button
				title={fighting ? `Fighting... (${remainingTime}s)` : 'Start Fight'}
				onPress={startFight}
				disabled={fighting}
			/>

			{fightResult && <Text style={styles.result}>{fightResult}</Text>}

			<View style={styles.section}>
				<Text style={styles.label}>Battle Log:</Text>
				<ScrollView style={styles.logContainer}>
					{battleLog.map((line, index) => (
						<Text key={index} style={styles.stat}>{line}</Text>
					))}
				</ScrollView>
			</View>
		</ScrollView>
	);
}
