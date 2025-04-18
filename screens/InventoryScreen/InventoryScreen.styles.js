// screens/InventoryScreen/InventoryScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		padding: 16,
	},
	equippedContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	slot: {
		flex: 1,
		borderWidth: 2,
		borderRadius: 8,
		padding: 12,
		marginHorizontal: 8,
		alignItems: 'center',
		backgroundColor: '#1f1f1f',
	},
	slotLabel: {
		fontSize: 14,
		color: '#ffffff',
		marginBottom: 4,
	},
	slotItem: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
	},
	sectionHeader: {
		fontSize: 16,
		fontWeight: '600',
		color: '#ffffff',
		marginTop: 12,
		marginBottom: 4,
		paddingHorizontal: 4,
	},
	listContent: {
		paddingBottom: 16,
	},
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderRadius: 6,
		padding: 10,
		marginVertical: 4,
		backgroundColor: '#1e1e1e',
	},
	itemText: {
		fontSize: 16,
		color: '#ffffff',
	},
	check: {
		fontSize: 16,
		marginLeft: 8,
	},
	rewardsContainer: {
		borderTopWidth: 1,
		borderColor: '#333',
		paddingTop: 12,
		marginTop: 16,
		alignItems: 'center',
	}, rewardsText: {
		fontSize: 16,
		color: '#ffffff',
		marginBottom: 8,
	},
	// Combine icon styling
	combineText: {
		fontSize: 18,
		color: '#FFD700',
		marginLeft: 12,
	},
	// Combine button container for hammer icon
	combineButtonContainer: {
		marginLeft: 12,
	},
	// Container for item row including combine icon
	itemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 4,
		justifyContent: 'space-between',
	},
});
