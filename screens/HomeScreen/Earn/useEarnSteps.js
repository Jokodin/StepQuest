// hooks/useEarnSteps.js

import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit from 'react-native-google-fit';

const DEFAULT_GOLD_PER_STEP = 0.10;
const FETCH_INTERVAL = 5000;

// Helper to fetch total steps from midnight via Google Fit
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
	} catch (err) {
		console.error('Error fetching steps for earn mode', err);
		return 0;
	}
}

/**
 * Hook to manage “earn gold” mode.
 *
 * @param {boolean} fitReady – whether Google Fit is authorized
 * @param {boolean} active   – whether we’re currently in “earn” mode
 * @returns {{ gold: number }}
 */
export default function useEarnSteps(fitReady, active) {
	const [gold, setGold] = useState(0);
	const intervalRef = useRef(null);

	// Load stored gold once on mount
	useEffect(() => {
		(async () => {
			const stored = parseFloat(await AsyncStorage.getItem('gold'));
			setGold(isNaN(stored) ? 0 : stored);
		})();
	}, []);

	// When fitReady && active, start polling; otherwise clear
	useEffect(() => {
		if (!fitReady || !active) {
			clearInterval(intervalRef.current);
			return;
		}

		// Core fetch for earn mode
		const fetchEarn = async () => {
			const total = await fetchTotalSteps();
			const last = parseInt(await AsyncStorage.getItem('lastTotalEarnSteps'), 10) || total;
			const delta = Math.max(0, total - last);
			if (delta > 0) {
				const gain = delta * DEFAULT_GOLD_PER_STEP;
				setGold(prev => {
					const updated = prev + gain;
					AsyncStorage.setItem('gold', updated.toString());
					return updated;
				});
				await AsyncStorage.setItem('lastTotalEarnSteps', total.toString());
			}
		};

		// Run immediately then every FETCH_INTERVAL ms
		fetchEarn();
		intervalRef.current = setInterval(fetchEarn, FETCH_INTERVAL);

		return () => clearInterval(intervalRef.current);
	}, [fitReady, active]);

	return { gold };
}
