// hooks/useHuntSteps.js

import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit from 'react-native-google-fit';

// Number of steps required to trigger a fight
const STEP_GOAL = 100;

// A list of monsters with just a name and level
const monsterList = [
	{ name: 'Slime', level: 1 },
	{ name: 'Goblin', level: 2 },
	{ name: 'Skeleton', level: 3 },
	{ name: 'Orc', level: 4 },
	{ name: 'Troll', level: 5 },
];

// Compute HP and attack from a monster’s level
function withStats(mon) {
	return {
		...mon,
		hp: mon.level * 50,
		attack: mon.level * 10,
	};
}

// Fetch total steps from midnight until now via Google Fit
async function fetchTotalSteps() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	try {
		const res = await GoogleFit.getDailyStepCountSamples({
			startDate: start.toISOString(),
			endDate: new Date().toISOString(),
		});
		const sample = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
		// take the first value if it exists
		return sample?.steps?.[0]?.value || 0;
	} catch (e) {
		console.error('Error fetching steps', e);
		return 0;
	}
}

/**
 * Custom hook to manage hunt mode.
 *
 * @param {boolean} fitReady        – whether Google Fit is authorized
 * @param {boolean} active          – whether “hunt” is the current mode
 * @param {string}  selectedMonster – name of the selected monster
 *
 * @returns {{
 *   huntSteps: number,
 *   huntReady: boolean,
 *   huntMonster: object|null
 * }}
 */
export default function useHuntSteps(fitReady, active, selectedMonster) {
	const [huntSteps, setHuntSteps] = useState(0);
	const [huntReady, setHuntReady] = useState(false);
	const [huntMonster, setHuntMonster] = useState(null);

	// Baseline step count when hunt mode starts
	const baselineRef = useRef(null);
	// Prevent re‐running fetchHunt after monster is picked
	const pickedRef = useRef(false);
	// Interval handle
	const intervalRef = useRef(null);

	useEffect(() => {
		// Cleanup if mode turns off
		if (!fitReady || !active) {
			clearInterval(intervalRef.current);
			return;
		}

		// Reset state when entering hunt mode
		baselineRef.current = null;
		pickedRef.current = false;
		setHuntSteps(0);
		setHuntReady(false);
		setHuntMonster(null);

		// The workhorse that checks steps and triggers fight when goal reached
		const fetchHunt = async () => {
			if (pickedRef.current) return;

			const total = await fetchTotalSteps();

			// First invocation: establish baseline and show 0/100
			if (baselineRef.current === null) {
				baselineRef.current = total;
				setHuntSteps(0);
				return;
			}

			// Compute how many steps since baseline
			const delta = Math.max(0, total - baselineRef.current);

			if (delta >= STEP_GOAL) {
				// Find the selected monster’s stats and signal ready
				const base = monsterList.find(m => m.name === selectedMonster) || monsterList[0];
				setHuntMonster(withStats(base));
				setHuntReady(true);
				pickedRef.current = true;
				clearInterval(intervalRef.current);
			} else {
				setHuntSteps(delta);
			}
		};

		// Run immediately & then every 5s
		fetchHunt();
		intervalRef.current = setInterval(fetchHunt, 5000);

		// Cleanup on unmount or mode switch
		return () => clearInterval(intervalRef.current);
	}, [fitReady, active, selectedMonster]);

	// to this:
	const debugHuntSteps = (delta) => {
		// ensure we always have a baseline
		if (baselineRef.current == null) {
			baselineRef.current = 0;
		}
		// subtract fake steps from the baseline
		baselineRef.current -= delta;
		// immediately bump the on‐screen counter
		setHuntSteps((prev) => prev + delta);
	};


	// 🔄 completely reset hunt mode back to initial
	const resetHunt = () => {
		baselineRef.current = null;
		pickedRef.current = false;
		setHuntSteps(0);
		setHuntReady(false);
		setHuntMonster(null);
	};

	return {
		huntSteps,
		huntReady,
		huntMonster,
		setHuntMonster,
		setHuntReady,
		debugHuntSteps,
		resetHunt
	};
}
