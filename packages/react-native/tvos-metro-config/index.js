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

/**
 * Metro config for apps that bundle with the `tvos` platform, which is the
 * platform that tvOS builds of react-native-tvos request from Metro.
 *
 * Usage, in an app's `metro.config.js`:
 *
 *   const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
 *   const {withTVOSPlatform} = require('react-native/tvos-metro-config');
 *
 *   module.exports = withTVOSPlatform(mergeConfig(getDefaultConfig(__dirname), config));
 *
 * An app that installs `react-native-tvos` next to `react-native` requires
 * `react-native-tvos/tvos-metro-config` instead.
 */

const fs = require('node:fs');
const path = require('node:path');

const TVOS_PLATFORM_EXTENSIONS = ['tvos', 'ios', 'native'];

const TVOS_HOST_PACKAGE = 'react-native-tvos';

const REACT_NATIVE_REQUEST = /^react-native(\/.*)?$/;

const DEFAULT_TRANSFORMER_PATH = 'metro-transform-worker';

/**
 * Returns `config` with two changes for `tvos` bundles:
 *
 * - Modules resolve with the `.tvos`, `.ios`, `.native` file extensions in that
 *   order, because most React Native sources have an `.ios.js` file and no
 *   `.tvos.js` file. A `resolveRequest` in `config` still runs, with the
 *   expanded extensions and no platform.
 * - Modules transform as `ios`, so that `Platform.OS` and `Platform.select`,
 *   which Metro inlines with the bundle platform, match iOS. React Native
 *   checks `Platform.OS === 'ios'` for behavior that tvOS shares with iOS.
 * - When the app installs `react-native-tvos` next to `react-native`,
 *   `react-native` and `react-native/...` requests resolve to
 *   `react-native-tvos`. An app that aliases `react-native` to
 *   `react-native-tvos` needs no redirect and gets none.
 *
 * Other platforms do not change.
 *
 * @template {import('metro-config').ConfigT} T
 * @param {T} config
 * @returns {T}
 */
function withTVOSPlatform(config) {
  if (
    config.transformerPath != null &&
    config.transformerPath !== DEFAULT_TRANSFORMER_PATH
  ) {
    throw new Error(
      `withTVOSPlatform replaces Metro's transformerPath, but this config sets it to "${config.transformerPath}". Remove that setting, or transform tvos bundles as ios in your own transformer.`,
    );
  }

  const nextResolveRequest = config.resolver?.resolveRequest;
  const redirectReactNative = hasSeparateTVOSHostPackage(config.projectRoot);

  /** @type {NonNullable<import('metro-config').ConfigT['resolver']['resolveRequest']>} */
  function resolveRequest(context, moduleName, platform) {
    const resolve = nextResolveRequest ?? context.resolveRequest;
    if (platform !== 'tvos') {
      return resolve(context, moduleName, platform);
    }
    const sourceExts = TVOS_PLATFORM_EXTENSIONS.flatMap(platformExtension =>
      context.sourceExts.map(sourceExt => `${platformExtension}.${sourceExt}`),
    ).concat(context.sourceExts);
    const match = redirectReactNative
      ? REACT_NATIVE_REQUEST.exec(moduleName)
      : null;
    return resolve(
      {...context, preferNativePlatform: false, sourceExts},
      match ? `${TVOS_HOST_PACKAGE}${match[1] ?? ''}` : moduleName,
      null,
    );
  }

  return {
    ...config,
    resolver: {...config.resolver, resolveRequest},
    transformerPath: require.resolve('./transform-worker'),
  };
}

/**
 * Whether `react-native-tvos` resolves from `projectRoot` to a different
 * package than `react-native` does.
 *
 * @param {string | void} projectRoot
 * @returns {boolean}
 */
function hasSeparateTVOSHostPackage(projectRoot) {
  if (projectRoot == null) {
    return false;
  }
  const tvosRoot = resolvePackageRoot(TVOS_HOST_PACKAGE, projectRoot);
  return (
    tvosRoot != null &&
    tvosRoot !== resolvePackageRoot('react-native', projectRoot)
  );
}

/**
 * @param {string} packageName
 * @param {string} projectRoot
 * @returns {string | null}
 */
function resolvePackageRoot(packageName, projectRoot) {
  try {
    const packageJson = require.resolve(`${packageName}/package.json`, {
      paths: [projectRoot],
    });
    return fs.realpathSync(path.dirname(packageJson));
  } catch (error) {
    if (
      error.code === 'MODULE_NOT_FOUND' ||
      error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    ) {
      return null;
    }
    throw error;
  }
}

module.exports = {withTVOSPlatform};
