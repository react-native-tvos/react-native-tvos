/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

import { PackageJSON, PackageInfo, PackagesFilter, ProjectInfo } from './types';

import { repoConstants } from './constants';
import { parseAnyVersion } from './versionUtils';
import { promises as fs } from 'fs';
import glob from 'glob';
import path from 'path';

const { repoName, repoPath } = repoConstants;

const WORKSPACES_CONFIG = 'packages/*';

/**
 * Locates monorepo packages and returns a mapping of package names to their
 * metadata. Considers Yarn workspaces under `packages/`.
 */
export async function getPackages(filter: PackagesFilter) {
  const { includeReactNative, includePrivate = false } = filter;

  const packagesEntries = await Promise.all(
    glob
      .sync(`${WORKSPACES_CONFIG}/package.json`, {
        cwd: repoPath,
        absolute: true,
        ignore: includeReactNative
          ? []
          : ['packages/react-native/package.json'],
      })
      .map(parsePackageInfoAsync),
  );

  return Object.fromEntries(
    packagesEntries.filter(
      ([_, { packageJson }]) => packageJson.private !== true || includePrivate,
    ),
  ) as ProjectInfo;
}

/**
 * Get the react-native version from the monorepo.
 * @returns the version string from the react-native package
 */
export async function getReactNativeVersion() {
  const packages: ProjectInfo = await getPackages({
    includeReactNative: true,
    includePrivate: false,
  });

  const reactNativeVersion =
    packages[repoName]?.version ?? packages['react-native'].version;

  return reactNativeVersion;
}

/**
 * Get the parsed package metadata for the workspace root.
 */
export async function getWorkspaceRootAsync() /*: Promise<PackageInfo> */ {
  const [, packageInfo] = await parsePackageInfoAsync(
    path.join(repoPath, 'package.json'),
  );

  return packageInfo;
}

async function parsePackageInfoAsync(
  packageJsonPath: string,
) /*: Promise<[string, PackageInfo]> */ {
  const packagePath = path.dirname(packageJsonPath);
  const packageJson /*: PackageJson */ = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf-8'),
  );

  return [
    packageJson.name,
    {
      name: packageJson.name,
      version: packageJson.version,
      path: packagePath,
      packageJson,
    },
  ] as PackageInfo[];
}

/**
 * Update a given package with the package versions.
 */
export async function updatePackageJsonAsync(
  packagePath: string,
  packageJson: PackageJSON,
  newPackageVersions: { [key: string]: string },
) /*: Promise<void> */ {
  const packageName = packageJson.name;

  if (packageName in newPackageVersions) {
    packageJson.version = newPackageVersions[packageName];
  }

  for (const dependencyField of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ]) {
    const deps = packageJson[dependencyField];

    if (deps == null) {
      continue;
    }

    if (deps['react-native'] && dependencyField !== 'peerDependencies') {
      delete deps['react-native'];
      deps[repoName] = packageJson.version;
    }

    for (const dependency in newPackageVersions) {
      if (dependency in deps) {
        deps[dependency] = newPackageVersions[dependency];
      }
    }
  }

  return await writePackageJsonAsync(
    path.join(packagePath, 'package.json'),
    packageJson,
  );
}

/**
 * Write a `package.json` file to disk.
 */
async function writePackageJsonAsync(
  packageJsonPath: string,
  packageJson: PackageJSON,
) /*: Promise<void> */ {
  return await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
  );
}

/**
 * Read a `package.json` file from disk.
 */
async function readPackageJsonAsync(
  packageJsonPath: string,
) /*: Promise<PackageJSON> */ {
  const packageJsonString = await fs.readFile(packageJsonPath, {
    encoding: 'utf-8',
  });
  return JSON.parse(packageJsonString) as PackageJSON;
}

async function rewritePackageJsonAsync(
  packageJsonPath: string,
  packageJsonMutator: (originalPackageJson: PackageJSON) => PackageJSON,
) {
  const originalPackageJson = await readPackageJsonAsync(packageJsonPath);
  const modifiedPackageJson = packageJsonMutator({ ...originalPackageJson });
  await writePackageJsonAsync(packageJsonPath, modifiedPackageJson);
}

/**
 * renames the react-native package to react-native-tvos
 * uses @react-native-tvos/virtualized-lists dependency
 */
export async function rewriteReactNativePackageJsonAsync(
  reactNativePackageName?: string
) {
  const reactNativePackagePath = path.resolve(
    repoPath,
    'packages',
    'react-native',
    'package.json',
  );
  rewritePackageJsonAsync(reactNativePackagePath, (reactNativeJson) => {
    reactNativeJson.name = reactNativePackageName ?? 'react-native-tvos';
    delete reactNativeJson.devDependencies;
    reactNativeJson.dependencies = {
      ...reactNativeJson.dependencies,
      '@react-native-tvos/virtualized-lists': reactNativeJson.version,
      '@react-native/virtualized-lists': undefined,
    };
    return reactNativeJson;
  });
}

/**
 * renames the virtualized-lists package to react-native-tvos namespace
 */
export async function rewriteVirtualizedListsPackageJsonAsync() {
  const virtualizedListsPackagePath = path.resolve(
    repoPath,
    'packages',
    'virtualized-lists',
    'package.json',
  );
  rewritePackageJsonAsync(
    virtualizedListsPackagePath,
    (virtualizedListsPackageJson) => {
      virtualizedListsPackageJson.name = '@react-native-tvos/virtualized-lists';
      return virtualizedListsPackageJson;
    },
  );
}

/**
 * Wrapper function to rename the react-native and virtualized-lists repos if
 * we are at version 0.78 or higher
 */
export async function rewritePackageNamesIfNeeded() {
  const reactNativeVersion = await getReactNativeVersion();
  console.log(`reactNativeVersion`);
  const reactNativeVersionInfo = parseAnyVersion(reactNativeVersion);
  console.log(
    `reactNativeVersionInfo: ${JSON.stringify(
      reactNativeVersionInfo,
      null,
      2,
    )}`,
  );

  if (parseInt(reactNativeVersionInfo?.minor ?? '0', 10) >= 78) {
    console.log('Rewrite react-native package JSON...');
    await rewriteReactNativePackageJsonAsync();

    console.log('Rewrite virtualized-lists package JSON...');
    await rewriteVirtualizedListsPackageJsonAsync();
  }
}

/**
 * `package` is an object form of package.json
 * `dependencies` is a map of dependency to version string
 *
 * This replaces both dependencies and devDependencies in package.json
 */
export function applyPackageVersions(
  originalPackageJson: PackageJSON,
  packageVersions: { [key: string]: string },
) {
  const packageJson = { ...originalPackageJson };

  for (const name of Object.keys(packageVersions)) {
    if (
      packageJson.devDependencies != null &&
      packageJson.devDependencies[name] != null
    ) {
      packageJson.devDependencies[name] = packageVersions[name];
    } else {
      packageJson.dependencies[name] = packageVersions[name];
    }
  }
  return packageJson;
}
