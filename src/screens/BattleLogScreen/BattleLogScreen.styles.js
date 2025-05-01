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
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderColor: colors.border,
		position: 'relative',
	},
	entryRowPlayer: {
		backgroundColor: colors.primary + '10',
	},
	entryRowEnemy: {
		backgroundColor: colors.error + '10',
	},
	entryContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		zIndex: 1,
	},
	entryIcon: {
		marginHorizontal: 12,
	},
	entryText: {
		flex: 1,
		fontSize: 16,
		color: colors.text,
	},
	entryTextPlayer: {
		textAlign: 'left',
	},
	entryTextEnemy: {
		textAlign: 'right',
	},
});
