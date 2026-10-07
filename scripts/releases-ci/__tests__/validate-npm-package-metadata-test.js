/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {
  validateNpmPackageMetadata,
} = require('../validate-npm-package-metadata');

/*::
import type {PackageInfo, Repository} from '../../shared/monorepoUtils';
*/

function packageInfo(
  name /*: string */,
  repository /*: ?Repository */ = null,
) /*: PackageInfo */ {
  return {
    name,
    path: `/packages/${name}`,
    version: '0.85.0',
    packageJson: {
      name,
      version: '0.85.0',
      ...(repository == null ? {} : {repository}),
    },
  };
}

describe('validateNpmPackageMetadata', () => {
  test('accepts canonical HTTPS and SSH repository URLs', () => {
    const packages = {
      packageA: packageInfo('package-a', {
        type: 'git',
        url: 'git+https://github.com/react/react-native.git',
      }),
      packageB: packageInfo('package-b', {
        type: 'git',
        url: 'git+ssh://git@github.com/react/react-native.git',
      }),
    };

    expect(() => validateNpmPackageMetadata(packages)).not.toThrow();
  });

  test('rejects a package with no repository', () => {
    const packages = {
      packageA: packageInfo('package-a'),
    };

    expect(() => validateNpmPackageMetadata(packages)).toThrow(
      '- package-a: repository is missing',
    );
  });

  test('rejects a package that uses the former repository owner', () => {
    const packages = {
      packageA: packageInfo('package-a', {
        type: 'git',
        url: 'git+https://github.com/facebook/react-native.git',
      }),
    };

    expect(() => validateNpmPackageMetadata(packages)).toThrow(
      '- package-a: repository.url must point to react/react-native',
    );
  });

  test('reports every invalid package in one error', () => {
    const packages = {
      packageB: packageInfo('package-b'),
      packageA: packageInfo('package-a', {
        type: 'git',
        url: 'git+https://github.com/example/react-native.git',
      }),
    };

    expect(() => validateNpmPackageMetadata(packages)).toThrow(
      'Invalid npm package repository metadata:\n' +
        '- package-a: repository.url must point to react/react-native ' +
        '(received "git+https://github.com/example/react-native.git")\n' +
        '- package-b: repository is missing',
    );
  });
});
