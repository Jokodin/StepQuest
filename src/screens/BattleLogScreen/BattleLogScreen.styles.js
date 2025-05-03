// screens/BattleLogScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		backgroundColor: colors.red
	},
	logsContainer: {
		flex: 1,
		width: '100%',
	},
	testButton: {
		backgroundColor: colors.primary,
		padding: 12,
		margin: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	testButtonText: {
		color: colors.background,
		fontWeight: 'bold',
	},
	metaSection: {
		padding: 16,
		backgroundColor: colors.backgroundSecondary,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		borderRadius: 12,
		margin: 16,
	},
	metaText: {
		marginBottom: 4,
	},
	entryRow: {
		flexDirection: 'row',
		paddingVertical: 6,
		width: '100%',
		justifyContent: 'space-between',
	},
	simultaneousRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	entryContainer: {
		width: '100%',
		backgroundColor: colors.backgroundSecondary,
		padding: 12,
		marginVertical: 4,
		shadowColor: colors.shadow,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
		borderColor: "white",
		borderWidth: 1,
	},
	systemEntry: {
		alignSelf: 'center',
		width: '100%',
		backgroundColor: colors.backgroundSecondary + '80',
		borderRadius: 12,
		alignItems: 'center',
	},
	playerEntry: {
		borderTopRightRadius: 20,
		borderBottomRightRadius: 20,
		backgroundColor: colors.primary + '15',
	},
	enemyEntry: {
		borderTopLeftRadius: 20,
		borderBottomLeftRadius: 20,
		backgroundColor: colors.error + '15',
	},
	simultaneousEntry: {
		width: '48%',
	},
	entryContent: {
		flex: 1,
	},
	entryTextContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	entryIcon: {
		marginHorizontal: 8,
	},
	entryText: {
		flex: 1,
		fontSize: 14,
	},
	entryTextPlayer: {
		color: colors.primary,
	},
	entryTextEnemy: {
		color: colors.error,
		textAlign: 'right',
	},
});
