// src/services/GoogleFitService.js

import { PermissionsAndroid, Platform, Alert } from 'react-native';
import GoogleFit, { Scopes } from 'react-native-google-fit';

class GoogleFitService {
	isAuthorized = false;

	// 1️⃣ Request permission + OAuth
	async authorize() {
		if (this.isAuthorized) return true;

		// Android permission
		if (Platform.OS === 'android' && Platform.Version >= 29) {
			const status = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
				{
					title: 'Step Tracking Permission',
					message:
						'This app needs access to your physical activity in order to track your steps.',
					buttonPositive: 'OK',
					buttonNegative: 'Cancel',
				}
			);
			if (status !== PermissionsAndroid.RESULTS.GRANTED) {
				Alert.alert(
					'Permission denied',
					'Without activity recognition permission we can’t count your steps.'
				);
				return false;
			}
		}

		// Google Fit OAuth
		const auth = await GoogleFit.authorize({
			scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
		});
		if (!auth.success) {
			console.error('Google Fit Auth Failure:', auth.message);
			Alert.alert('Google Fit authorization failed', auth.message || 'Unknown error');
			return false;
		}

		this.isAuthorized = true;
		return true;
	}

	async getTodaySteps() {
		// 1) Ensure we’re authorized
		if (!(await this.authorize())) return 0;

		// 2) Build proper ISO‐string dates
		const start = new Date();
		start.setHours(0, 0, 0, 0);                // midnight today
		const end = new Date();

		const opts = {
			startDate: start.toISOString(),         // <-- ISO string, not number
			endDate: end.toISOString(),
			bucketUnit: 'DAY',
			bucketInterval: 1,
		};

		try {
			const res = await GoogleFit.getDailyStepCountSamples(opts);

			const today = res.find(
				s => s.source === 'com.google.android.gms:estimated_steps'
			);
			return today
				? today.steps.reduce((sum, piece) => sum + piece.value, 0)
				: 0;

		} catch (err) {
			console.error('Error fetching daily steps:', err);
			return 0;
		}
	}

	// 3️⃣ Continuous updates via the recorder API
	async startStepUpdates(onStepCount) {
		if (!(await this.authorize())) return;

		// startRecording gives you back status info, not just errors
		GoogleFit.startRecording((status) => {
			// status might be { recording: true, type: 'STEP_RECORDING' }
			if (status && status.error) {
				console.error('Recording error:', status.error);
			} else {
				console.log('Recording started:', status);
			}
		});

		// subscribe to actual step events
		this._unsubscribe = GoogleFit.onStepCount(({ steps }) => {
			onStepCount(steps);
		});
	}

	// 4️⃣ Cleanup
	stopStepUpdates() {
		// unsubscribe from the live step listener
		if (this._unsubscribe) {
			this._unsubscribe();
			this._unsubscribe = null;
		}

		// no need to call GoogleFit.stopRecording() since it doesn't exist
		this.isAuthorized = false;
	}
}

export default new GoogleFitService();