import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import ScreenLayout from '@/components/ScreenLayout';

const SkillScreen = () => {
	return (
		<ScreenLayout title="Skills">
			<View style={styles.container}>
				<Text style={styles.placeholderText}>
					TODO: Change battles to give EXP and on level up give player 1 skill point to spend on this screen.
					This screen will offer the player a choice of 3 skills to spend their skill point on.
					Each skill will have a name, description, and a button to spend the skill point.
					When the player spends the skill point, the skill will be applied to the player's character.
				</Text>
			</View>
		</ScreenLayout>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: colors.background,
	},
	placeholderText: {
		color: colors.text,
		fontSize: 16,
		textAlign: 'center',
		marginTop: 20,
	},
});

export default SkillScreen; 