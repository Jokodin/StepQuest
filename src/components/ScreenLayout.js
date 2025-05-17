// components/ScreenLayout.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '@/components/Header';
import FooterNav from '@/components/FooterNav';
import { colors } from '@/constants/theme';

export default function ScreenLayout({ children, title }) {
	return (
		<View style={styles.container}>
			<Header title={title} />
			<View style={styles.body}>{children}</View>
			<FooterNav />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	body: {
		flex: 1,
	},
});
