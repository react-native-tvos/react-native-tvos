/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {PACKAGES_DIR} = require('../../../shared/consts');
const {getPackages} = require('../../../shared/monorepoUtils');
const {existsSync} = require('node:fs');
const path = require('node:path');

export type DependencyContext = Readonly<{
  reportUnresolvedDependency(importPath: string): void,
}>;

let cachedProjectInfo;

/**
 * The tvOS fork publishes `react-native` as `react-native-tvos`, and
 * `@react-native/virtualized-lists` as `@react-native-tvos/virtualized-lists`.
 * That rename is committed on release branches but deliberately not on main,
 * so an import may name either spelling regardless of which one the workspace
 * currently declares. Mapping both directions lets type generation resolve in
 * either state without the package.json rename having to be applied first.
 */
const TVOS_PACKAGE_ALIASES = new Map<string, string>([
  ['react-native', 'react-native-tvos'],
  ['react-native-tvos', 'react-native'],
  ['@react-native/virtualized-lists', '@react-native-tvos/virtualized-lists'],
  ['@react-native-tvos/virtualized-lists', '@react-native/virtualized-lists'],
]);

/**
 * Resolve the location of an import path to a file path in the project.
 *
 * This is a specific dependency resolver for type imports in the React
 * Native project/monorepo. Therefore it has limited requirements, and does
 * not need to traverse `node_modules`.
 */
async function simpleResolve(
  importPath: string,
  filePath: string,
  context: DependencyContext,
): Promise<string | null> {
  if (cachedProjectInfo == null) {
    cachedProjectInfo = await getPackages({
      includeReactNative: true,
      includePrivate: false,
    });
  }

  // Resolve exact '@react-native/<package>' import, falling back to the tvOS
  // alias of the imported name when the workspace declares the other spelling.
  const packageName =
    importPath in cachedProjectInfo
      ? importPath
      : TVOS_PACKAGE_ALIASES.get(importPath);

  if (packageName != null && packageName in cachedProjectInfo) {
    const packageJson = cachedProjectInfo[packageName].packageJson;

    if (packageJson.main !== undefined) {
      return path.join(cachedProjectInfo[packageName].path, packageJson.main);
    }

    return path.join(cachedProjectInfo[packageName].path, 'index.js');
  }

  // Resolve relative import within the project
  if (importPath.startsWith('.')) {
    const resolvedPath = path.resolve(path.dirname(filePath), importPath);

    if (resolvedPath.startsWith(PACKAGES_DIR)) {
      if (resolvedPath.endsWith('.js') || resolvedPath.endsWith('.js.flow')) {
        return resolvedPath;
      }

      for (const ext of ['.js.flow', '.js']) {
        if (existsSync(resolvedPath + ext)) {
          return resolvedPath + ext;
        }
      }

      // Other relative files are not useful to our program, e.g. assets
      return null;
    }
  }

  context.reportUnresolvedDependency(importPath);
  return null;
}

module.exports = simpleResolve;
