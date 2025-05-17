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
		alignItems: 'center',
		paddingVertical: 12,
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
		padding: 16,
	},
	sectionHeaderContainer: {
		backgroundColor: colors.surface,
		alignSelf: 'stretch',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderColor: 'white',
		marginTop: 24,
		marginBottom: 16,
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
	gridRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	gridItem: {
		width: '30%',
		backgroundColor: colors.surface,
		borderRadius: 8,
		borderWidth: 2,
		overflow: 'hidden',
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
	gridItemSingle: {
		marginHorizontal: 0,
	},
	gridItemLeft: {
		marginRight: 2,
	},
	gridItemMiddle: {
		marginHorizontal: 2,
	},
	gridItemRight: {
		marginLeft: 2,
	},
	gridItemContent: {
		padding: 8,
		paddingBottom: 4,
	},
	itemHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 4,
	},
	itemText: {
		fontSize: 16,
		fontWeight: '500',
		color: colors.text,
		marginBottom: 4,
	},
	rarityText: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'capitalize',
	},

	// Stats container styling
	statsContainer: {
		backgroundColor: colors.surface,
		padding: 8,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	statText: {
		fontSize: 12,
		color: colors.text,
		marginBottom: 2,
	},

	equipButtonContainer: {
		marginTop: 8,
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
});
