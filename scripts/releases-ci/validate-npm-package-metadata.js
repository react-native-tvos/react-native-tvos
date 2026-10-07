/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {getPackages} = require('../shared/monorepoUtils');

/*::
import type {ProjectInfo, Repository} from '../shared/monorepoUtils';
*/

const CANONICAL_REPOSITORY_URLS = new Set([
  'git+https://github.com/react/react-native.git',
  'git+ssh://git@github.com/react/react-native.git',
]);

function getRepositoryError(repository /*: ?Repository */) /*: ?string */ {
  if (repository == null) {
    return 'repository is missing';
  }
  if (typeof repository !== 'object') {
    return 'repository must be an object';
  }
  if (repository.type !== 'git') {
    return 'repository.type must be "git"';
  }
  if (
    repository.url == null ||
    !CANONICAL_REPOSITORY_URLS.has(repository.url)
  ) {
    const receivedUrl = JSON.stringify(repository.url) ?? 'undefined';
    return `repository.url must point to react/react-native (received ${receivedUrl})`;
  }
  return null;
}

function validateNpmPackageMetadata(packages /*: ProjectInfo */) /*: void */ {
  const errors /*: Array<string> */ = [];
  for (const packageInfo of Object.values(packages)) {
    const repository /*: ?Repository */ = packageInfo.packageJson.repository;
    const error = getRepositoryError(repository);
    if (error != null) {
      errors.push(`- ${packageInfo.name}: ${error}`);
    }
  }
  errors.sort();

  if (errors.length > 0) {
    throw new Error(
      `Invalid npm package repository metadata:\n${errors.join('\n')}`,
    );
  }
}

async function validateNpmPackageMetadataInRepo() /*: Promise<void> */ {
  const packages = await getPackages({includeReactNative: true});
  validateNpmPackageMetadata(packages);
  console.log(
    `Validated repository metadata for ${Object.keys(packages).length} npm packages.`,
  );
}

if (require.main === module) {
  void validateNpmPackageMetadataInRepo();
}

module.exports = {
  validateNpmPackageMetadata,
  validateNpmPackageMetadataInRepo,
};
