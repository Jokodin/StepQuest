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
		fontWeight: '600',
		color: colors.text,
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	statCell: {
		width: '48%',
		backgroundColor: colors.surface,
		padding: 12,
		marginBottom: 12,
		borderRadius: 8,
	},
	statLabel: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 4,
	},
	statValue: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
});
