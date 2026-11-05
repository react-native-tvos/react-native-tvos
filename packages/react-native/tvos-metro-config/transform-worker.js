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
 * Metro transform worker that transforms `tvos` bundles as `ios`, and every
 * other bundle as Metro's default worker does. See `withTVOSPlatform`.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Metro's default worker, found through the `metro` package the way Metro
 * finds it. Metro runs from the app, which is the working directory of Metro
 * and its workers.
 */
function requireDefaultWorker() {
  const metroPackageJson = require.resolve('metro/package.json', {
    paths: [process.cwd(), __dirname],
  });
  return require(
    require.resolve('metro-transform-worker', {
      paths: [path.dirname(metroPackageJson)],
    }),
  );
}

const worker = requireDefaultWorker();

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
