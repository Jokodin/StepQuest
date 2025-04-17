// screens/BattleScreen/BattleScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#121212',
		padding: 16,
		paddingBottom: 40,
	},
	section: {
		backgroundColor: '#1f1f1f',
		padding: 12,
		borderRadius: 10,
		marginBottom: 16,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: 8,
	},
	label: {
		fontSize: 18,
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: 4,
	},
	stat: {
		fontSize: 16,
		color: '#ffffff',
		marginBottom: 2,
	},
	result: {
		fontSize: 18,
		fontWeight: '600',
		color: '#ffffff',
		marginVertical: 12,
		textAlign: 'center',
	},
	logContainer: {
		maxHeight: 200,
		marginTop: 8,
	},
});
