// screens/BattleLogScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	metaSection: {
		padding: 16,
		borderBottomWidth: 1,
		borderColor: colors.border,
		marginBottom: 8,
	},
	metaText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.text,
		marginBottom: 4,
	},
	entryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderColor: colors.border,
	},
	entryIcon: {
		marginRight: 12,
	},
	entryText: {
		flex: 1,
		fontSize: 16,
		color: colors.text,
	},
});
