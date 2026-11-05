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
 */

const TVOS_PLATFORM_EXTENSIONS = ['tvos', 'ios', 'native'];

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

  /** @type {NonNullable<import('metro-config').ConfigT['resolver']['resolveRequest']>} */
  function resolveRequest(context, moduleName, platform) {
    const resolve = nextResolveRequest ?? context.resolveRequest;
    if (platform !== 'tvos') {
      return resolve(context, moduleName, platform);
    }
    const sourceExts = TVOS_PLATFORM_EXTENSIONS.flatMap(platformExtension =>
      context.sourceExts.map(sourceExt => `${platformExtension}.${sourceExt}`),
    ).concat(context.sourceExts);
    return resolve(
      {...context, preferNativePlatform: false, sourceExts},
      moduleName,
      null,
    );
  }

  return {
    ...config,
    resolver: {...config.resolver, resolveRequest},
    transformerPath: require.resolve('./transform-worker'),
  };
}

module.exports = {withTVOSPlatform};
