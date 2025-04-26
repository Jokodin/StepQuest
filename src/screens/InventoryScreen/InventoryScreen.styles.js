import { StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	// overall screen
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},

	// Tabs
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

	// SectionList content padding
	listContent: {
		paddingVertical: 16,
	},

	// Category header “pill” (matches store)
	sectionHeaderContainer: {
		backgroundColor: colors.surface,
		alignSelf: 'stretch',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderColor: 'white',
		marginTop: 24,
		...Platform.select({
			android: { elevation: 2 },
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
			},
		}),
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: '700',
		color: colors.primary,
		textTransform: 'uppercase',
	},
	sectionIcon: {
		marginRight: 8,
	},

	// Each item becomes its own “card” that stretches full width
	// itemContainerWrapper: {
	// 	marginBottom: 8,
	// },
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: colors.surface,
		alignSelf: 'stretch',
		marginTop: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderStartWidth: 1,
		borderColor: 'white',
		...Platform.select({
			android: { elevation: 1 },
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.05,
				shadowRadius: 1,
			},
		}),
	},
	itemContainerPressed: {
		backgroundColor: 'rgba(0, 0, 0, 0.04)',
	},

	itemText: {
		fontSize: 20,
		fontWeight: '500',
		color: colors.text,
	},

	// Expanded stats share the same card styling
	statsContainer: {
		alignSelf: 'stretch',
		backgroundColor: colors.surface,
		paddingHorizontal: 16,
		borderStartWidth: 1,
		borderColor: 'white',
	},
	statText: {
		fontSize: 16,
		color: 'white',
		marginBottom: 4,
	},

	equipButtonContainer: {
		marginTop: 8,
	},

	// Equipped tab
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

	// Banner
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

	rarityText: {
		fontSize: 14,
		fontWeight: '600',
	},
});
