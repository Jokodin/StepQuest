// screens/CharacterScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

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
	statCell: {
		width: '48%',
		padding: 12,
		backgroundColor: colors.card,
		borderRadius: 8,
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
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
	},
	activeTab: {
		backgroundColor: colors.primary,
	},
	tabText: {
		fontSize: 16,
		color: colors.textSecondary,
	},
	activeTabText: {
		color: colors.text,
		fontWeight: 'bold',
	},
});
