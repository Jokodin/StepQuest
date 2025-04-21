// screens/InventoryScreen/InventoryScreen.styles.js

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#fff',
	},
	section: {
		marginBottom: 24,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	shopItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 8,
	},
	itemText: {
		fontSize: 16,
	},
	goldText: {
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'right',
		marginTop: 8,
	},
	itemRow: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	emptyText: {
		textAlign: 'center',
		fontStyle: 'italic',
		marginTop: 32,
		color: '#777',
	},
});
