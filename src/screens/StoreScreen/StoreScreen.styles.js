// screens/StoreScreen/StoreScreen.styles.js

import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	goldText: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		margin: 16,
		textAlign: 'right',
	},
	listContent: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	sectionHeaderContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
		marginBottom: 8,
	},
	sectionIcon: {
		marginRight: 8,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: '700',
		color: colors.text,
	},
	shopItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderColor: colors.border,
	},
	itemText: {
		fontSize: 16,
		color: colors.text,
	},
});
