// screens/InventoryScreen/InventoryScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	tabs: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderColor: colors.border,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
	},
	tabActive: {
		borderBottomWidth: 3,
		borderColor: colors.primary,
	},
	tabText: {
		fontSize: 16,
		color: colors.text,
		fontWeight: '600',
	},

	listContent: {
		padding: 16,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		marginTop: 16,
		marginBottom: 8,
	},
	itemContainer: {
		padding: 12,
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 8,
	},
	itemText: {
		color: colors.text,
		fontSize: 16,
	},

	equippedContainer: {
		padding: 16,
	},
	slot: {
		marginBottom: 12,
	},
	slotLabel: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 4,
	},
	slotItemContainer: {
		padding: 12,
		borderWidth: 1,
		borderRadius: 8,
	},
	slotItemText: {
		fontSize: 16,
		color: colors.text,
	},

	banner: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.primary,
		paddingVertical: 10,
		alignItems: 'center',
	},
	bannerText: {
		color: colors.surface,
		fontWeight: '600',
		fontSize: 14,
	},
});
