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
		fontSize: 16,
		marginBottom: 8,
	},
	entryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	entryContainer: {
		marginBottom: 16,
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
		fontSize: 16,
	},
	entryTextPlayer: {
		color: colors.primary,
	},
	entryTextEnemy: {
		color: colors.error,
	},
	systemText: {
		color: colors.text,
		fontStyle: 'italic',
	},
	playerEntry: {
		backgroundColor: colors.primary + '20',
		padding: 8,
		borderRadius: 8,
	},
	enemyEntry: {
		backgroundColor: colors.error + '20',
		padding: 8,
		borderRadius: 8,
	},
	systemEntry: {
		backgroundColor: colors.background,
		padding: 8,
		borderRadius: 8,
	},
	simultaneousRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	simultaneousEntry: {
		width: '48%',
		backgroundColor: colors.backgroundSecondary,
		alignItems: 'center',
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
	hpText: {
		color: colors.text,
		fontSize: 12,
		textAlign: 'center',
		marginTop: 4,
		fontWeight: 'bold',
	},
	// New styles for tabs
	tabsContainer: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	tab: {
		flex: 1,
		padding: 16,
		alignItems: 'center',
	},
	activeTab: {
		borderBottomWidth: 2,
		borderBottomColor: colors.primary,
	},
	tabText: {
		fontSize: 16,
		color: colors.text,
	},
	activeTabText: {
		color: colors.primary,
		fontWeight: 'bold',
	},
	// Styles for replay tab
	replayContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	replayText: {
		fontSize: 18,
		color: colors.text,
		textAlign: 'center',
	},
	// Battle replay styles
	battleField: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16,
		width: '100%',
	},
	combatantContainer: {
		flex: 1,
		marginHorizontal: 8,
	},
	combatantInfo: {
		backgroundColor: colors.backgroundSecondary,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		width: '100%',
	},
	combatantName: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
		color: colors.text,
	},
	barContainer: {
		width: '100%',
		marginVertical: 4,
	},
	manaBarBackground: {
		height: 8,
		backgroundColor: colors.background,
		borderRadius: 4,
		overflow: 'hidden',
	},
	manaBar: {
		height: '100%',
		backgroundColor: colors.primary,
	},
	manaText: {
		color: colors.text,
		fontSize: 12,
		textAlign: 'center',
		marginTop: 4,
	},
	cooldownBarBackground: {
		height: 4,
		backgroundColor: colors.background,
		borderRadius: 2,
		overflow: 'hidden',
	},
	cooldownBar: {
		height: '100%',
		backgroundColor: colors.primary,
	},
	enemiesContainer: {
		flex: 1,
		marginLeft: 16,
	},
});
