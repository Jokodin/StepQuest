// src/services/StepService.js
// Centralized polling for step counts and lifetime tracking

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFitService from './GoogleFitService';
import HealthKitService from './HealthKitService';

class StepService {
	constructor(pollIntervalMs = 5000) {
		this.listeners = {};
		this.today = 0;
		this.lifetime = 0;
		this.pollIntervalMs = pollIntervalMs;
		this._loadLifetime().then(() => {
			this._startPolling();
		});
	}

	// simple event emitter
	on(event, listener) {
		if (!this.listeners[event]) this.listeners[event] = new Set();
		this.listeners[event].add(listener);
	}
	off(event, listener) {
		this.listeners[event]?.delete(listener);
	}
	emit(event, payload) {
		this.listeners[event]?.forEach(fn => {
			try { fn(payload); } catch (e) { console.error(e); }
		});
	}

	async _loadLifetime() {
		try {
			const stored = await AsyncStorage.getItem('lifetimeSteps');
			this.lifetime = stored ? parseInt(stored, 10) : 0;
		} catch (e) {
			console.error('Failed to load lifetime steps', e);
			this.lifetime = 0;
		}
	}

	async _saveLifetime() {
		try {
			await AsyncStorage.setItem('lifetimeSteps', String(this.lifetime));
		} catch (e) {
			console.error('Failed to save lifetime steps', e);
		}
	}

	_startPolling() {
		this._poll();
		this._intervalId = setInterval(() => this._poll(), this.pollIntervalMs);
	}

	async _poll() {
		// choose platform-specific service
		const svc = Platform.OS === 'android' ? GoogleFitService : HealthKitService;
		if (!(await svc.authorize())) return;

		// fetch today's total
		let newToday = 0;
		try {
			newToday = await svc.getTodaySteps();
		} catch (e) {
			console.error('Error polling today steps', e);
			return;
		}

		const delta = Math.max(0, newToday - this.today);
		this.today = newToday;
		this.lifetime += delta;
		await this._saveLifetime();

		// broadcast update
		this.emit('update', { today: this.today, lifetime: this.lifetime });
	}

	getToday() {
		return this.today;
	}

	getLifetime() {
		return this.lifetime;
	}
}

export const StepServiceInstance = new StepService();