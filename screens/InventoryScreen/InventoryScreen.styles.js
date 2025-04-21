// screens/InventoryScreen/InventoryScreen.styles.js

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#121212',      // dark background
	},

	// --- Character Stat Block ---
	statBlockContainer: {
		backgroundColor: '#1E1E1E',
		borderWidth: 1,
		borderColor: '#333',
		borderRadius: 8,
		marginBottom: 16,
		overflow: 'hidden',
	},
	statBlockHeader: {
		fontSize: 18,
		fontWeight: 'bold',
		padding: 12,
		backgroundColor: '#1F1F1F',
		color: '#FFF',                  // white text
	},
	stats: {
		padding: 12,
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	statsText: {
		color: '#FFF',
		fontSize: 14,
	},

	// --- Equipped Slots ---
	equippedContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 16,
	},
	slot: {
		flex: 1,
		borderWidth: 2,
		borderColor: '#444',
		borderRadius: 6,
		paddingVertical: 12,
		paddingHorizontal: 8,
		alignItems: 'center',
		marginHorizontal: 4,
		backgroundColor: '#1E1E1E',
	},
	slotLabel: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
		color: '#FFF',
	},
	slotItem: {
		fontSize: 16,
		color: '#FFF',
	},

	// --- Section Headers ---
	sectionHeader: {
		fontSize: 16,
		fontWeight: '600',
		paddingVertical: 8,
		paddingHorizontal: 4,
		backgroundColor: '#1F1F1F',
		color: '#FFF',
	},

	// --- Lists ---
	listContent: {
		paddingVertical: 8,
	},
	itemContainer: {
		borderWidth: 1,
		borderColor: '#333',
		borderRadius: 6,
		padding: 8,
		marginVertical: 4,
		backgroundColor: '#1E1E1E',
		flexDirection: 'row',
		alignItems: 'center',
	},
	itemText: {
		fontSize: 14,
		flex: 1,
		color: '#FFF',
	},

	// --- Rewards Button ---
	rewardsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		backgroundColor: '#1E1E1E',
		borderTopWidth: 1,
		borderColor: '#333',
		marginTop: 16,
	},
	rewardsText: {
		fontSize: 14,
		color: '#FFF',
	},

	// --- Debug Clear Button (positioned in JS) ---
	// No extra styles needed here; platform button text will contrast on dark bg.
});
