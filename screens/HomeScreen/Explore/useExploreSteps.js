// hooks/useExploreSteps.js

import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit from 'react-native-google-fit';

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
		return sample?.steps?.reduce((sum, entry) => sum + entry.value, 0) || 0;
	} catch (e) {
		console.error('Error fetching steps', e);
		return 0;
	}
}

/**
 * Custom hook to manage the “Explore” activity.
 *
 * @param {boolean} fitReady – whether Google Fit is authorized
 * @param {boolean} active   – whether “explore” is the current mode
 *
 * @returns {{
 *   exploreSteps: number,
 *   exploreReady: boolean,
 *   exploreLevel: number,
 *   onExploreComplete: () => Promise<void>
 * }}
 */
export default function useExploreSteps(fitReady, active) {
	const [exploreSteps, setExploreSteps] = useState(0);
	const [exploreLevel, setExploreLevel] = useState(1);
	const [exploreReady, setExploreReady] = useState(false);

	const baselineRef = useRef(null);
	const intervalRef = useRef(null);

	useEffect(() => {
		// Only initialize once when we first enter explore mode
		if (!fitReady || !active || baselineRef.current !== null) {
			return;
		}

		let cancelled = false;

		(async () => {
			// Load saved explore level
			const lvlStr = await AsyncStorage.getItem('exploreLevel');
			const lvl = parseInt(lvlStr, 10);
			if (!isNaN(lvl) && lvl > 1) {
				setExploreLevel(lvl);
			}

			// Reset cycle
			setExploreSteps(0);
			setExploreReady(false);
			await AsyncStorage.setItem('exploreStepsInCycle', '0');

			// Establish baseline
			const totalNow = await fetchTotalSteps();
			await AsyncStorage.setItem('lastTotalExploreSteps', totalNow.toString());
			baselineRef.current = totalNow;

			// Polling function
			const poll = async () => {
				if (cancelled || exploreReady) return;
				const goal = exploreLevel * 1000;
				const total = await fetchTotalSteps();
				const lastStr = await AsyncStorage.getItem('lastTotalExploreSteps');
				const last = parseInt(lastStr, 10) || total;
				const prev = parseInt(await AsyncStorage.getItem('exploreStepsInCycle'), 10) || 0;
				const delta = Math.max(0, total - last);
				const newCycle = prev + delta;

				if (newCycle >= goal) {
					setExploreReady(true);
					clearInterval(intervalRef.current);
				} else {
					setExploreSteps(newCycle);
					await AsyncStorage.setItem('exploreStepsInCycle', newCycle.toString());
					await AsyncStorage.setItem('lastTotalExploreSteps', total.toString());
				}
			};

			// Run immediately and then every 5 seconds
			await poll();
			intervalRef.current = setInterval(poll, 5000);
		})();

		return () => {
			cancelled = true;
			clearInterval(intervalRef.current);
		};
	}, [fitReady, active, exploreLevel]);

	// Call when the user finishes exploring to advance level
	const onExploreComplete = async () => {
		setExploreSteps(0);
		setExploreReady(false);
		const nextLevel = exploreLevel + 1;
		setExploreLevel(nextLevel);
		await AsyncStorage.setItem('exploreStepsInCycle', '0');
		await AsyncStorage.setItem('exploreLevel', nextLevel.toString());
		// Allow re‑initialization for the next level
		baselineRef.current = null;
	};

	return { exploreSteps, exploreReady, exploreLevel, onExploreComplete };
}
