import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'space-between',     // space out top / middle / bottom
		alignItems: 'center',
		backgroundColor: '#121212',
		paddingVertical: 20,                  // give top & bottom breathing room
		paddingBottom: 60,                    // reserve space for daily tracker
	},
	timer: {
		fontSize: 24,
		color: '#FF5555',
		fontWeight: '600',
		backgroundColor: 'rgba(255,255,255,0.1)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	main: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	counter: {
		fontSize: 32,
		color: '#fff',
		marginBottom: 20,
	},
	equippedContainer: {
		alignItems: 'center',
	},
	label: {
		color: '#ccc',
		fontSize: 18,
		marginVertical: 4,
	},
	buttonRow: {
		flexDirection: 'row',                 // side by side
		justifyContent: 'space-around',
		width: '100%',                        // stretch full width
		paddingHorizontal: 20,
	},
	picker: {
		width: '80%',
		color: '#fff',
		backgroundColor: '#222',
		marginVertical: 10,
	},
	placeholder: {
		fontSize: 20,
		color: '#888',
	},
	pickerLabel: {
		color: '#fff',
		fontSize: 16,
		marginTop: 10,
		marginBottom: 4,
	},
	stat: {
		color: '#fff',      // for consistency, but unused now
	},
	logText: {
		color: '#fff',      // make battle log white
		fontSize: 16,
		marginVertical: 2,
	},
	fightButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: 20,
		marginTop: 10,
	},
	actionButton: {
		flex: 1,
		marginHorizontal: 8,
	},
	dailyContainer: {
		position: 'absolute',
		bottom: 0,
		width: '100%',
		alignItems: 'center',
		paddingVertical: 8,
		backgroundColor: '#1e1e1e',
	},
	dailyCounter: {
		color: '#fff',
		fontSize: 16,
	},
});
