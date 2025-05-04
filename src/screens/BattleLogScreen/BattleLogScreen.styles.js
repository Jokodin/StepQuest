// screens/BattleLogScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		backgroundColor: colors.background,
	},
	logsContainer: {
		flexGrow: 1,
		width: '100%',
		padding: 16,
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
		alignItems: 'center',
		justifyContent: 'center',
		padding: 6,
		borderRadius: 6,
		marginVertical: 2,
		borderWidth: 1,
		borderColor: 'white',
	},
	simultaneousRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	entryContainer: {
		width: '100%',
		backgroundColor: colors.backgroundSecondary,
		padding: 8,
		marginVertical: 2,
		borderRadius: 8,
	},
	systemEntry: {
		backgroundColor: colors.backgroundSecondary + '80',
		justifyContent: 'center',
		borderColor: colors.text,
	},
	playerEntry: {
		backgroundColor: colors.primary + '15',
		borderColor: colors.primary,
	},
	enemyEntry: {
		backgroundColor: colors.error + '15',
		borderColor: colors.error,
	},
	simultaneousEntry: {
		width: '48%',
		backgroundColor: colors.backgroundSecondary,
		alignItems: 'center',
	},
	entryContent: {
		flex: 1,
		padding: 8,
		width: '100%',
	},
	hpBarContainer: {
		width: '100%',
		marginBottom: 8,
	},
	hpBarBackground: {
		height: 8,
		backgroundColor: colors.background,
		borderRadius: 4,
		overflow: 'hidden',
	},
	hpBar: {
		height: '100%',
		backgroundColor: colors.primary,
	},
	entryTextContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: 8,
	},
	entryText: {
		flex: 1,
		fontSize: 14,
		color: colors.text,
		textAlign: 'center',
	},
	entryTextPlayer: {
		color: colors.primary,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	entryTextEnemy: {
		color: colors.error,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	entryIcon: {
		marginHorizontal: 8,
	},
	systemText: {
		color: colors.text,
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'center',
	},
	hpText: {
		color: colors.text,
		fontSize: 12,
		textAlign: 'center',
		marginTop: 4,
		fontWeight: 'bold',
	},
});
