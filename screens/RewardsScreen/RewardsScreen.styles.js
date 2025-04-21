// screens/RewardsScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#121212',
		alignItems: 'center',
		justifyContent: 'flex-start',
		padding: 16,
	},
	title: {
		fontSize: 34,
		color: '#ffffff',
		marginBottom: 16,
		fontWeight: 'bold',
	},
	count: {
		fontSize: 18,
		color: '#ffffff',
		marginBottom: 12,
	},
	reveal: {
		fontSize: 40,
		color: '#ffffff',
		marginBottom: 16,
		fontWeight: '600',
		alignSelf: 'center',
		textAlign: 'center',
	},
	middleContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		marginBottom: 100,
	},
	backButton: {
		position: "absolute",
		marginTop: 24,
		bottom: 16,
	},
});
