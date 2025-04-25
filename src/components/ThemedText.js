// src/components/ThemedText.js
import React from 'react';
import { Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function ThemedText(props) {
	return <Text {...props} style={[{ color: colors.text }, props.style]} />;
}
