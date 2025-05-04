// src/services/StepService.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFitService from './GoogleFitService';
import HealthKitService from './HealthKitService';

const LIFETIME_KEY = 'lifetimeSteps';
const INSTALL_DATE_KEY = 'install_date';
const INSTALL_BASELINE_KEY = 'install_baseline';

class StepService {
	constructor(pollIntervalMs = 10000) {
		this.listeners = {};
		this.today = 0;       // steps reported to UI
		this.lifetime = 0;
		this.pollIntervalMs = pollIntervalMs;
		this._lastRawToday = 0;  // Initialize to 0

		// placeholders until loaded
		this.installDate = null;
		this.installBaseline = 0;

		this._init();
	}

	async _init() {
		// Load lifetime, install date & baseline, then start
		await this._loadLifetime();
		await this._loadInstallData();
		this._startPolling();
	}

	// Emitter
	on(event, listener) {
		if (!this.listeners[event]) this.listeners[event] = new Set();
		this.listeners[event].add(listener);
	}
	off(event, listener) {
		this.listeners[event]?.delete(listener);
	}
	emit(event, payload) {
		this.listeners[event]?.forEach(fn => {
			try { fn(payload); }
			catch (e) { console.error(e); }
		});
	}

	// Load lifetime from storage
	async _loadLifetime() {
		try {
			const stored = await AsyncStorage.getItem(LIFETIME_KEY);
			this.lifetime = stored ? parseInt(stored, 10) : 0;
		} catch (e) {
			console.error('Failed to load lifetime steps', e);
			this.lifetime = 0;
		}
	}
	async _saveLifetime() {
		try {
			await AsyncStorage.setItem(LIFETIME_KEY, String(this.lifetime));
		} catch (e) {
			console.error('Failed to save lifetime steps', e);
		}
	}

	// Load install_date & baseline from storage
	async _loadInstallData() {
		try {
			const [dateStr, baselineStr] = await Promise.all([
				AsyncStorage.getItem(INSTALL_DATE_KEY),
				AsyncStorage.getItem(INSTALL_BASELINE_KEY),
			]);
			this.installDate = dateStr; // may be null
			this.installBaseline = baselineStr ? parseInt(baselineStr, 10) : 0;
		} catch (e) {
			console.error('Failed to load install data', e);
			this.installDate = null;
			this.installBaseline = 0;
		}
	}
	async _saveInstallData(dateStr, baseline) {
		try {
			await Promise.all([
				AsyncStorage.setItem(INSTALL_DATE_KEY, dateStr),
				AsyncStorage.setItem(INSTALL_BASELINE_KEY, String(baseline)),
			]);
		} catch (e) {
			console.error('Failed to save install data', e);
		}
	}

	_startPolling() {
		this._poll();
		this._intervalId = setInterval(() => this._poll(), this.pollIntervalMs);
	}

	async _poll() {
		const svc = Platform.OS === 'android' ? GoogleFitService : HealthKitService;
		if (!(await svc.authorize())) return;

		let rawToday = 0;
		try {
			rawToday = await svc.getTodaySteps();
			//console.log('[StepService] Raw steps from platform:', rawToday);
		} catch (e) {
			console.error('Error polling today steps', e);
			return;
		}

		// Determine current date (YYYY-MM-DD) in local time
		const now = new Date();
		const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		//console.log('[StepService] Current date:', todayStr, 'Install date:', this.installDate);

		// If no installDate yet, or installDate != today, reset baseline
		if (!this.installDate || this.installDate !== todayStr) {
			//console.log('[StepService] Setting new baseline:', rawToday);
			this.installDate = todayStr;
			this.installBaseline = rawToday;
			await this._saveInstallData(todayStr, rawToday);
		}

		// Compute stepsSinceInstall if same day, otherwise full rawToday
		const computedToday =
			this.installDate === todayStr
				? rawToday - this.installBaseline
				: rawToday;

		////console.log('[StepService] Computed today steps:', computedToday, 'Baseline:', this.installBaseline);

		// Protect against negative
		this.today = computedToday >= 0 ? computedToday : rawToday;

		// Lifetime should be the same as today for a fresh install/reset
		this.lifetime = this.today;
		//console.log('[StepService] Setting lifetime to:', this.lifetime);

		await this._saveLifetime();

		this.emit('update', { today: this.today, lifetime: this.lifetime });
	}

	getToday() {
		return this.today;
	}

	getLifetime() {
		//console.log('[StepService] getLifetime', this.lifetime);
		return this.lifetime;
	}

	async reset() {
		//console.log('[StepService] Resetting service');

		// Get current raw steps before clearing anything
		const svc = Platform.OS === 'android' ? GoogleFitService : HealthKitService;
		if (await svc.authorize()) {
			try {
				const rawToday = await svc.getTodaySteps();
				//console.log('[StepService] Current raw steps:', rawToday);

				// Clear all stored data
				await Promise.all([
					AsyncStorage.removeItem(LIFETIME_KEY),
					AsyncStorage.removeItem(INSTALL_DATE_KEY),
					AsyncStorage.removeItem(INSTALL_BASELINE_KEY)
				]);

				// Set new baseline to current raw steps
				const now = new Date();
				const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
				this.installDate = todayStr;
				this.installBaseline = rawToday;
				await this._saveInstallData(todayStr, rawToday);

				// Reset counters
				this.today = 0;
				this.lifetime = 0;
				this._lastRawToday = rawToday;

				//console.log('[StepService] Reset complete with baseline:', rawToday);
			} catch (e) {
				console.error('[StepService] Error getting steps during reset:', e);
			}
		}
	}
}

export const StepServiceInstance = new StepService();
