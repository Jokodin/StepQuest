// screens/HomeScreen/HomeScreen.styles.js

import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const FOOTER_HEIGHT = 50;
const BANNER_HEIGHT = 50;

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	appBar: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: colors.surface,
		borderBottomWidth: 1,
		borderColor: colors.border,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.text,
	},
	card: {
		backgroundColor: colors.surface,
		padding: 16,
		margin: 8,
		borderRadius: 8,
	},
	fullWidth: {
		width: '100%',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 8,
	},
	gearRow: {
		flexDirection: 'row',
		marginTop: 8,
	},
	section: {
		paddingHorizontal: 16,
		marginVertical: 8,
	},
	upHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	upgradeRow: {
		marginVertical: 8,
	},

	// NEW: make the upgrades card fill all remaining space
	upgradesCard: {
		flex: 100,
		margin: 8,
		padding: 16,
		borderRadius: 8,
		backgroundColor: colors.surface,
	},

	navContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		marginBottom: FOOTER_HEIGHT,
	},
	navTile: {
		flex: 1,
		alignItems: 'center',
		padding: 4,
		backgroundColor: colors.surface,
		marginHorizontal: 4,
		marginBottom: 8,
	},
	navIcon: {
		fontSize: 24,
		marginBottom: 4,
	},
	footer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: FOOTER_HEIGHT,
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		backgroundColor: colors.surface,
		borderTopWidth: 1,
		borderColor: colors.border,
	},
	banner: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: BANNER_HEIGHT,
		justifyContent: 'center',
		alignItems: 'center',
	},
	bannerText: {
		color: colors.text,
		fontSize: 16,
		fontWeight: '600',
	},
});
