const {getDefaultConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// When enabled, the optional code below will allow Metro to resolve
// and bundle source files with TV-specific extensions
// (e.g., *.ios.tv.tsx, *.android.tv.tsx, *.tv.tsx)
//
// Metro will still resolve source files with standard extensions
// as usual if TV-specific files are not found for a module.
//
// This code is not enabled by default, since it will impact bundling performance,
// but is available for developers who need this capability.
//
/*
const originalSourceExts = config.resolver.sourceExts;
const tvSourceExts = [
  ...originalSourceExts.map((e) => `tv.${e}`),
  ...originalSourceExts,
];
config.resolver.sourceExts = tvSourceExts;
 */

module.exports = config;
