// screens/HomeScreen/GoogleFitAuth.js

import { PermissionsAndroid, Platform, Alert } from 'react-native';
import GoogleFit, { Scopes } from 'react-native-google-fit';

async function requestActivityRecognitionPermission() {
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
	return true;
}

// Google Fit auth + Android permission
export const authorizeFit = async () => {
	try {
		// 1️⃣ Request Android activity‐recognition permission
		const hasActivityPerm = await requestActivityRecognitionPermission();
		if (!hasActivityPerm) return false;

		// 2️⃣ Run Google Fit OAuth
		const auth = await GoogleFit.authorize({
			scopes: [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_ACTIVITY_WRITE],
		});

		if (!auth.success) {
			console.error('Google Fit Auth Failure:', auth.message);
			Alert.alert('Google Fit authorization failed', auth.message || 'Unknown error');
			return false;
		}

		console.log('✅ Google Fit authorized');
		return true;
	} catch (err) {
		console.error('Exception during Google Fit authorization', err);
		Alert.alert('Auth error', err.message || String(err));
		return false;
	}
};
