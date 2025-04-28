// screens/StoreScreen.styles.js

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

	// SectionList content padding
	listContent: {
		paddingVertical: 16,
	},

	// Section headers now live in their own “pill” background
	sectionHeaderContainer: {
		backgroundColor: colors.surface,
		alignSelf: 'stretch',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderColor: 'white',
		marginTop: 24,
		// subtle shadow
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

	// Each item becomes its own “card” that stretches full width
	shopItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: colors.surface,
		alignSelf: 'stretch',
		marginTop: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderStartWidth: 2,
		borderColor: 'white',
		// card shadow
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
	shopItemPressed: {
		backgroundColor: 'rgba(0, 0, 0, 0.04)',
	},

	itemText: {
		fontSize: 16,
		fontWeight: '600',
	},

	statsContainer: {
		alignSelf: 'stretch',
		backgroundColor: colors.surface,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderStartWidth: 2,
		borderColor: 'white',
	},

	statText: {
		fontSize: 14,
		color: 'white',
		marginBottom: 4,
	},
});
