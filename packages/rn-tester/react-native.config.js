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

// Inside the React Native monorepo, the CLI does not discover the adjacent
// react-native package, so extend its config (the tvOS platform and commands)
// explicitly.
const config = require('../react-native/react-native.config.js');

module.exports = {
  ...config,
  reactNativePath: '../react-native',
  project: {
    ios: {
      sourceDir: '.',
    },
    tvos: {
      sourceDir: '.',
    },
    android: {
      sourceDir: '../../',
      // To remove once the CLI fix for manifestPath search path is landed.
      manifestPath:
        'packages/rn-tester/android/app/src/main/AndroidManifest.xml',
      packageName: 'com.facebook.react.uiapp',
    },
  },
};
