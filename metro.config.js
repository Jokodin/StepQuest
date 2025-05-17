// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
// const config = {};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);
module.exports = getDefaultConfig(__dirname);
