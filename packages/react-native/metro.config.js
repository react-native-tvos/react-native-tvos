/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {getDefaultConfig} = require('@react-native/metro-config');
const {mergeConfig} = require('metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */
const config = {
  // Make Metro able to resolve required packages that might be imported from /packages/react-native
  watchFolders: [
    path.resolve(__dirname, '../../node_modules'),
    path.resolve(__dirname, '../assets'),
    path.resolve(__dirname, '../normalize-color'),
    path.resolve(__dirname, '../polyfills'),
    path.resolve(__dirname, '../virtualized-lists'),
  ],
  resolver: {
    blockList: [/buck-out/, /sdks\/hermes/],
    extraNodeModules: {
      'react-native': __dirname,
    },
    // When enabled, the optional code below will allow Metro to resolve
    // and bundle source files with TV-specific extensions
    // (e.g., *.ios.tv.tsx, *.android.tv.tsx, *.tv.tsx)
    //
    // Metro will still resolve source files with standard extensions
    // as usual if TV-specific files are not found for a module.
    //
    // This code is not enabled by default, since it will impact bundling performance,
    // but is available for developers who need this capability.
    /*
    sourceExts: [].concat(
      defaultConfig.resolver.sourceExts.map(e => `tv.${e}`),
      defaultConfig.resolver.sourceExts,
    ),
     */
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
