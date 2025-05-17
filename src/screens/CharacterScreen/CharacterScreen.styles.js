// screens/CharacterScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContent: {
		padding: 16,
	},
	profileHeader: {
		alignItems: 'center',
		marginBottom: 24,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 12,
	},
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: colors.surfaceVariant,
		marginBottom: 12,
	},
	name: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.text,
	},
	sectionBlock: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 12,
		color: colors.text,
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
	},
	characterStatsGrid: {
		flexDirection: 'column',
		gap: 8,
	},
	statCell: {
		width: '48%',
		padding: 12,
		backgroundColor: colors.card,
		borderRadius: 8,
	},
	characterStatCell: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		backgroundColor: colors.surface,
		borderRadius: 8,
		marginBottom: 8,
		width: '100%',
	},
	statLabelContainer: {
		flex: 1,
		marginRight: 16,
	},
	characterStatLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: colors.text,
		marginBottom: 4,
	},
	statDescription: {
		fontSize: 12,
		color: colors.textSecondary,
	},
	characterStatValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: colors.primary,
		minWidth: 40,
		textAlign: 'right',
	},
	statLabel: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 4,
	},
	statValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: colors.text,
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
	tabsContainer: {
		flexDirection: 'row',
		backgroundColor: colors.card,
		borderRadius: 8,
		margin: 16,
		overflow: 'hidden',
	},
	tabs: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		marginBottom: 16,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
	},
	activeTab: {
		borderBottomWidth: 2,
		borderBottomColor: colors.primary,
	},
	tabText: {
		color: colors.text,
		fontSize: 16,
	},
	activeTabText: {
		color: colors.primary,
		fontWeight: 'bold',
	},
});
