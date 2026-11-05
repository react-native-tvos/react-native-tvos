/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {getDefaultConfig} = require('@react-native/metro-config');
const {mergeConfig} = require('metro-config');
const path = require('node:path');

const TVOS_PLATFORM_EXTENSIONS = ['tvos', 'ios', 'native'];

/**
 * Resolves `tvos` requests with the `.tvos`, `.ios`, `.native` file extensions in that order,
 * because most React Native sources have an `.ios.js` file and no `.tvos.js` file.
 *
 * @type {NonNullable<import('metro-config').MetroConfig['resolver']>['resolveRequest']}
 */
function resolveRequest(context, moduleName, platform) {
  if (platform !== 'tvos') {
    return context.resolveRequest(context, moduleName, platform);
  }
  const sourceExts = TVOS_PLATFORM_EXTENSIONS.flatMap(platformExtension =>
    context.sourceExts.map(sourceExt => `${platformExtension}.${sourceExt}`),
  ).concat(context.sourceExts);
  return context.resolveRequest(
    {...context, preferNativePlatform: false, sourceExts},
    moduleName,
    null,
  );
}

/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Make Metro able to resolve required external dependencies
  watchFolders: [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../asset-utils'),
    path.resolve(__dirname, '../community-cli-plugin'),
    path.resolve(__dirname, '../dev-middleware'),
    path.resolve(__dirname, '../new-app-screen'),
    path.resolve(__dirname, '../normalize-color'),
    path.resolve(__dirname, '../polyfills'),
    path.resolve(__dirname, '../react-native'),
    path.resolve(__dirname, '../virtualized-lists'),
    path.resolve(__dirname, '../react-native-popup-menu-android'),
    path.resolve(__dirname, '../react-native-test-library/apple'),
    path.resolve(__dirname, '../react-native-test-library/common'),
  ],
  resolver: {
    blockList: [/..\/react-native\/sdks\/hermes/],
    extraNodeModules: {
      'react-native': path.resolve(__dirname, '../react-native'),
      '@react-native-tvos/virtualized-lists': path.resolve(
        __dirname,
        '../virtualized-lists',
      ),
      '@react-native/virtualized-lists': path.resolve(
        __dirname,
        '../virtualized-lists',
      ),
    },
    resolveRequest,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
