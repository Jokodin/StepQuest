// screens/RewardsScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		padding: 16,
	},
	messageContainer: {
		alignItems: 'center',
		marginVertical: 16,
	},
	messageText: {
		fontSize: 18,
		color: colors.text,
	},
	cardContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	card: {
		width: '90%',
		backgroundColor: colors.surface,
		borderRadius: 12,
		padding: 16,
	},
	itemName: {
		fontSize: 20,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 12,
		textAlign: 'center',
	},
	statsList: {
		maxHeight: 200,
		marginBottom: 16,
	},
	statText: {
		fontSize: 16,
		color: colors.text,
		paddingVertical: 4,
	},
	cardButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginVertical: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 16,
	},
});
