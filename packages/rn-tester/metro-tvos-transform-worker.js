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
 * Metro transform worker that transforms `tvos` bundles as `ios`.
 *
 * Metro inlines `Platform.OS` and `Platform.select` with the bundle platform,
 * and React Native checks `Platform.OS === 'ios'` for behavior that tvOS shares
 * with iOS, such as the event props in the base view config and
 * `isTVSelectable`. Module resolution still uses `tvos` (see `metro.config.js`),
 * so `.tvos.js` files take precedence over `.ios.js` files.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const worker = require(
  require.resolve('metro-transform-worker', {
    paths: [path.dirname(require.resolve('metro/package.json'))],
  }),
);

const ownCacheKey = crypto
  .createHash('sha1')
  .update(fs.readFileSync(__filename))
  .digest('hex');

/** @type {typeof worker.transform} */
function transform(config, projectRoot, filename, data, options) {
  const transformOptions =
    options.platform === 'tvos' ? {...options, platform: 'ios'} : options;
  return worker.transform(
    config,
    projectRoot,
    filename,
    data,
    transformOptions,
  );
}

/** @type {typeof worker.getCacheKey} */
function getCacheKey(config, opts) {
  return `${worker.getCacheKey(config, opts)}$${ownCacheKey}`;
}

module.exports = {transform, getCacheKey};
