/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

/*::
import type {BuildType, Version} from './utils/version-utils';
*/

const {REPO_ROOT} = require('../consts');
const {applyPackageVersions} = require('../npm-utils');
const {getNpmInfo} = require('../npm-utils');
const updateTemplatePackage = require('./update-template-package');
const {parseVersion, validateBuildType} = require('./utils/version-utils');
const {parseArgs} = require('@pkgjs/parseargs');
const {promises: fs} = require('fs');
const path = require('path');
const {exec} = require('shelljs');

const GRADLE_FILE_PATH = path.join(
  REPO_ROOT,
  'packages/react-native/ReactAndroid/gradle.properties',
);
const REACT_NATIVE_PACKAGE_JSON = path.join(
  REPO_ROOT,
  'packages/react-native/package.json',
);
const VIRTUALIZED_LISTS_PACKAGE_JSON = path.join(
  REPO_ROOT,
  'packages/virtualized-lists/package.json',
);

const config = {
  options: {
    'to-version': {
      type: 'string',
      short: 'v',
    },
    commit: {
      type: 'boolean',
      short: 'c',
    },
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help, 'to-version': toVersion, commit},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/set-rn-version.js [OPTIONS]

  Updates relevant files in the react-native package and template to
  materialize the given release version.

  Options:
    --to-version       The new version string.
    --commit           If true, commit the changes
    `);
    return;
  }

  const buildType = 'release';

  const doCommit = commit ?? false;

  if (!validateBuildType(buildType)) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }

  await setReactNativeVersion(
    toVersion ?? getNpmInfo(buildType).version,
    {},
    buildType,
    doCommit,
  );
}

async function setReactNativeVersion(
  version /*: string */,
  dependencyVersions /*: ?Record<string, string> */,
  buildType /*: ?BuildType */,
  commit /*: boolean */,
) {
  const versionInfo = parseVersion(version, buildType);

  updateTemplatePackage({
    ...(dependencyVersions ?? {}),
    'react-native': versionInfo.version,
  });
  await updateSourceFiles(versionInfo);
  await setReactNativePackageVersion(versionInfo.version, dependencyVersions);
  await setVirtualizedListVersion(versionInfo.version, dependencyVersions);
  await updateGradleFile(versionInfo.version);
  if (commit) {
    commitAsync(versionInfo.version);
  }
}

async function commitAsync(version /*: string */) {
  const filesToCommit = [
    'packages/react-native/Libraries/Core/ReactNativeVersion.js',
    'packages/react-native/React/Base/RCTVersion.m',
    'packages/react-native/ReactAndroid/gradle.properties',
    'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
    'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
    'packages/react-native/package.json',
    'packages/react-native/template/package.json',
    'packages/virtualized-lists/package.json',
    'package.json',
    'yarn.lock',
  ];
  exec('yarn');
  exec(`git add ${filesToCommit.join(' ')}`);
  exec(`git commit -m "Bump version number (${version})"`);
}

async function setReactNativePackageVersion(
  version /*: string */,
  dependencyVersions /*: ?Record<string, string> */,
) {
  const originalPackageJsonContent = await fs.readFile(
    REACT_NATIVE_PACKAGE_JSON,
    'utf-8',
  );
  const originalPackageJson = JSON.parse(originalPackageJsonContent);

  const packageJson =
    dependencyVersions != null
      ? applyPackageVersions(originalPackageJson, dependencyVersions)
      : originalPackageJson;

  packageJson.version = version;

  // Update virtualized-lists dependency
  packageJson.dependencies['@react-native-tvos/virtualized-lists'] = version;

  // Derive core version from this version, e.g. 73.0-0 uses core version 73.0
  const coreVersion = version.split('-')[0] + '-rc.3';
  packageJson.devDependencies = packageJson.devDependencies ?? {};
  packageJson.devDependencies[
    'react-native-core'
  ] = `npm:react-native@${coreVersion}`;

  await fs.writeFile(
    path.join(REPO_ROOT, 'packages/react-native/package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8',
  );
}

async function setVirtualizedListVersion(
  version /*: string */,
  dependencyVersions /*: ?Record<string, string> */,
) {
  const originalPackageJsonContent = await fs.readFile(
    VIRTUALIZED_LISTS_PACKAGE_JSON,
    'utf-8',
  );
  const originalPackageJson = JSON.parse(originalPackageJsonContent);

  const packageJson =
    dependencyVersions != null
      ? applyPackageVersions(originalPackageJson, dependencyVersions)
      : originalPackageJson;

  packageJson.version = version;

  await fs.writeFile(
    VIRTUALIZED_LISTS_PACKAGE_JSON,
    JSON.stringify(packageJson, null, 2),
    'utf-8',
  );
}

function updateSourceFiles(
  versionInfo /*: Version */,
) /*: Promise<Array<void>>*/ {
  const templateData = {version: versionInfo};

  return Promise.all([
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
      ),
      require('./templates/ReactNativeVersion.java-template')(templateData),
    ),
    fs.writeFile(
      path.join(REPO_ROOT, 'packages/react-native/React/Base/RCTVersion.m'),
      require('./templates/RCTVersion.m-template')(templateData),
    ),
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
      ),
      require('./templates/ReactNativeVersion.h-template')(templateData),
    ),
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/Libraries/Core/ReactNativeVersion.js',
      ),
      require('./templates/ReactNativeVersion.js-template')(templateData),
    ),
  ]);
}

async function updateGradleFile(version /*: string */) /*: Promise<void> */ {
  const contents = await fs.readFile(GRADLE_FILE_PATH, 'utf-8');

  return fs.writeFile(
    GRADLE_FILE_PATH,
    contents.replace(/^VERSION_NAME=.*/, `VERSION_NAME=${version}`),
  );
}

module.exports = {
  setReactNativeVersion,
  updateGradleFile,
  updateSourceFiles,
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
