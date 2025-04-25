// screens/TownScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContent: {
		paddingBottom: 16,
	},
	overviewCard: {
		backgroundColor: colors.surface,
		margin: 16,
		padding: 16,
		borderRadius: 8,
	},
	centerContent: {
		alignItems: 'center',
	},
	centeredText: {
		textAlign: 'center',
	},
	sectionCard: {
		backgroundColor: colors.surface,
		marginHorizontal: 16,
		marginVertical: 8,
		padding: 16,
		borderRadius: 8,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 4,
	},
	logRow: {
		backgroundColor: colors.surface,
		marginHorizontal: 16,
		marginVertical: 4,
		borderRadius: 8,
		underlayColor: colors.surfaceVariant,  // for TouchableHighlight
	},
	logRowContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 16,
	},

	facilityGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	facilityButton: {
		width: '48%',
		marginBottom: 12,
		paddingVertical: 8,
		borderRadius: 6,
		alignItems: 'center',
	},

	// unlocked buildings
	unlockedButton: {
		backgroundColor: colors.primary,
	},
	facilityText: {
		color: "black",
		fontWeight: '600',
	},

	// locked buildings
	lockedButton: {
		backgroundColor: colors.background,
	},
	lockedText: {
		color: colors.textDisabled,
		fontStyle: 'italic',
	},
});
