// screens/HomeScreen/HuntPanel.js
import React, { useRef, useEffect } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from '../HomeScreen.styles';

const STEP_GOAL = 100;

export default function HuntPanel({
	huntSteps,
	huntReady,
	huntingMonster,
	fighting,
	fightCompleted,
	remainingTime,
	battleLog,
	onStartFight,
	onReturn,
	selectedMonsterName,
	onSelectMonster,
	winChances,
	monsterOptions,
	exploreLevel,
}) {
	const scrollRef = useRef(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollToEnd({ animated: true });
		}
	}, [battleLog]);

	return (
		<View
			style={{
				width: '100%',
				alignItems: 'center',    // ← center all children horizontally
			}}
		>
			{/* monster selector always at top */}
			<Text style={styles.label}>Choose Monster:</Text>
			<Picker
				mode="dropdown"
				selectedValue={selectedMonsterName}
				onValueChange={onSelectMonster}
				style={styles.picker}     // already centered by parent and has width
				dropdownIconColor="#fff"
			>
				{monsterOptions.map(mon => (
					exploreLevel >= mon.level && (
						<Picker.Item
							key={mon.name}
							label={`${mon.name} (${winChances[mon.name] ?? 0}%)`}
							value={mon.name}
						/>
					)
				))}
			</Picker>

			{/* 1️⃣ before threshold */}
			{!huntReady && !fighting && !fightCompleted && (
				<Text style={styles.counter}>
					{huntSteps} / {STEP_GOAL} steps
				</Text>
			)}

			{/* 2️⃣ monster appeared */}
			{huntReady && !fighting && !fightCompleted && (
				<>
					<Text style={styles.label}>
						Hunting a {huntingMonster.name} ({winChances[huntingMonster.name] ?? 0}%)
					</Text>
					<View style={styles.fightButtons}>
						<View style={styles.actionButton}>
							<Button title="Start Fight" onPress={onStartFight} />
						</View>
					</View>
				</>
			)}

			{/* 3️⃣ fighting or just finished */}
			{(fighting || fightCompleted) && (
				<>
					<Text style={styles.label}>
						{fighting
							? `Fighting ${huntingMonster.name}... (${remainingTime}s)`
							: 'Fight over.'}
					</Text>
					<ScrollView
						ref={scrollRef}
						style={styles.logContainer}
						contentContainerStyle={{ alignItems: 'center' }}  // ← center log entries
					>
						{battleLog.map((line, i) => (
							<Text key={i} style={[styles.logText, { textAlign: 'center' }]}>
								{line}
							</Text>
						))}
					</ScrollView>
					{fightCompleted && <Button title="Return" onPress={onReturn} />}
				</>
			)}
		</View>
	);
}
