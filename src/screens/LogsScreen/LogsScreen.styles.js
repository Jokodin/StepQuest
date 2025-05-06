import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	logRow: {
		backgroundColor: colors.surface,
		padding: 12,
		marginVertical: 4,
		marginHorizontal: 16,
		borderRadius: 4,
	},
	logRowContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 4,
	},
	logRowTextContainer: {
		flex: 1,
		marginRight: 8,
	},
	monsterAndExpContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	expText: {
		color: colors.primary,
		fontSize: 14,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		color: colors.textSecondary,
		fontSize: 16,
		textAlign: 'center',
	},
	areaHeader: {
		width: '100%',
		padding: 12,
		backgroundColor: colors.surface,
		alignItems: 'center',
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	areaText: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		textAlign: 'center',
	},
	progressBarRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		marginTop: 8,
	},
	progressBarContainer: {
		width: '90%',
		height: 8,
		backgroundColor: colors.border,
		borderRadius: 4,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: colors.primary,
		borderRadius: 4,
	},
	progressText: {
		marginTop: 4,
		fontSize: 14,
		color: colors.textSecondary,
		textAlign: 'center',
	},
	resetNotice: {
		padding: 8,
		marginVertical: 8,
		backgroundColor: colors.surface,
		alignItems: 'center',
	},
	resetText: {
		color: colors.error,
	},
	victoryNotice: {
		backgroundColor: colors.surface,
		padding: 8,
	},
	victoryText: {
		color: colors.primary,
		fontSize: 14,
		textAlign: 'center',
	},
	testButton: {
		backgroundColor: colors.primary,
		padding: 12,
		margin: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	testButtonText: {
		color: colors.background,
		fontWeight: 'bold',
	},
	progressBar: {
		height: 8,
		backgroundColor: colors.backgroundSecondary,
		borderRadius: 4,
		marginTop: 8,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: colors.primary,
	},
	entry: {
		backgroundColor: colors.backgroundSecondary,
		borderRadius: 8,
		marginBottom: 12,
	},
	entryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	entryTitle: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	entryDate: {
		fontSize: 14,
		color: colors.textSecondary,
	},
	entryContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	entryText: {
		fontSize: 14,
	},
	entryResult: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	success: {
		color: colors.success,
	},
	failure: {
		color: colors.error,
	},
});
