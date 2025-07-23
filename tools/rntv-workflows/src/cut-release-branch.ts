#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import path from 'path';
import { promises as fs } from 'fs';
import spawnAsync from '@expo/spawn-async';

import {
  parseVersion,
  repoConstants,
  Version,
  commitAllChangesAsync,
  createNewBranchAsync,
  getBranchNameAsync,
  getCurrentCommitAsync,
  getPackages,
  updatePackageJsonAsync,
  applyPackageVersions,
  pushBranchAsync,
  validateForGitHub,
  cloneAndInstallBranchAsync,
  rewriteFileAtPathAsync,
  rewritePackageNamesIfNeeded,
} from './common';

const {
  repoPath,
  repoBranch,
  repoName,
  rnPackagePath,
  pushReleaseToRepo,
  releaseBranch,
  releaseVersion,
} = repoConstants;

const GRADLE_FILE_PATH = path.join(
  rnPackagePath,
  'ReactAndroid',
  'gradle.properties',
);
const REACT_NATIVE_PACKAGE_JSON = path.join(rnPackagePath, 'package.json');

async function executeScriptAsync() {
  validateForGitHub();

  await cloneAndInstallBranchAsync(repoBranch);

  await rewritePackageNamesIfNeeded();

  const versionInfo = parseVersion(releaseVersion, 'tvrelease');

  console.log(`Updating React Native version to ${versionInfo.version}...`);

  await setReactNativeVersion(versionInfo, {
    '@react-native-tvos/virtualized-lists': versionInfo.version,
  });

  console.log('Modify gradle.properties for correct Maven namespace...');

  const gradlePropertiesPath = path.resolve(
    repoPath,
    'packages',
    'react-native',
    'ReactAndroid',
    'gradle.properties',
  );

  await rewriteFileAtPathAsync(gradlePropertiesPath, [
    {
      original: 'react.internal.publishingGroup=com.facebook.react',
      replacement: 'react.internal.publishingGroup=io.github.react-native-tvos',
    },
  ]);

  console.log('Updating and adding yarn.lock...');

  await spawnAsync('yarn', [], {
    cwd: repoPath,
    stdio: 'inherit',
  });

  await spawnAsync('yarn', ['add', '-W', 'yarn.lock'], {
    cwd: repoPath,
    stdio: 'inherit',
  });

  const commitMessage = `Bump version number (${releaseVersion})`;

  const latestCommitBeforeRelease = await getCurrentCommitAsync();
  const branchBeforeRelease = await getBranchNameAsync();
  console.log(`Branch = ${branchBeforeRelease}`);
  console.log(`Latest commit = ${latestCommitBeforeRelease}`);

  await createNewBranchAsync(releaseBranch);

  await commitAllChangesAsync(commitMessage);

  const latestCommitAfterRelease = await getCurrentCommitAsync();
  const branchAfterRelease = await getBranchNameAsync();
  console.log(`Branch = ${branchAfterRelease}`);
  console.log(`Latest commit = ${latestCommitAfterRelease}`);

  if (pushReleaseToRepo) {
    console.log(`Pushing changes to ${repoName}...`);
    await pushBranchAsync(releaseBranch);
  } else {
    console.log('PUSH_RELEASE_TO_REPO is false, changes will not be pushed.');
  }
  console.log('Done.');
}

async function setReactNativeVersion(
  versionInfo: Version,
  dependencyVersions: { [key: string]: string },
) {
  await updateSourceFiles(versionInfo);
  await setReactNativePackageVersion(versionInfo.version, dependencyVersions);
  await updateGradleFile(versionInfo.version);
  const packages = await getPackages({
    includeReactNative: false,
    includePrivate: true,
  });
  for (const packageName in packages) {
    const packageInfo = packages[packageName];
    await updatePackageJsonAsync(packageInfo.path, packageInfo.packageJson, {
      '@react-native/babel-plugin-codegen': versionInfo.version,
      '@react-native/debugger-frontend': versionInfo.version,
      '@react-native/dev-middleware': versionInfo.version,
      helloworld: versionInfo.version,
      '@react-native/babel-preset': versionInfo.version,
      '@react-native/popup-menu-android': versionInfo.version,
      '@react-native/oss-library-example': versionInfo.version,
      '@react-native/test-renderer': versionInfo.version,
      '@react-native/tester-e2e': versionInfo.version,
      '@react-native/tester': versionInfo.version,
      '@react-native-tvos/virtualized-lists': versionInfo.version,
    });
  }
}

async function setReactNativePackageVersion(
  version: string,
  dependencyVersions: { [key: string]: string },
) {
  const originalPackageJsonContent = await fs.readFile(
    REACT_NATIVE_PACKAGE_JSON,
    { encoding: 'utf-8' },
  );
  const originalPackageJson = JSON.parse(originalPackageJsonContent);

  const packageJson = applyPackageVersions(
    originalPackageJson,
    dependencyVersions,
  );

  packageJson.version = version;

  await fs.writeFile(
    REACT_NATIVE_PACKAGE_JSON,
    JSON.stringify(packageJson, null, 2) + '\n',
    { encoding: 'utf-8' },
  );
}

async function updateSourceFiles(versionInfo: Version) {
  const templateData = { version: versionInfo };

  const templatePaths = [
    './common/templates/ReactNativeVersion.java-template',
    './common/templates/RCTVersion.m-template',
    './common/templates/ReactNativeVersion.h-template',
    './common/templates/ReactNativeVersion.js-template',
  ];

  const destinationPaths = [
    path.resolve(
      rnPackagePath,
      'ReactAndroid',
      'src',
      'main',
      'java',
      'com',
      'facebook',
      'react',
      'modules',
      'systeminfo',
      'ReactNativeVersion.java',
    ),
    path.resolve(rnPackagePath, 'React', 'Base', 'RCTVersion.m'),
    path.resolve(
      rnPackagePath,
      'ReactCommon',
      'cxxreact',
      'ReactNativeVersion.h',
    ),
    path.resolve(rnPackagePath, 'Libraries', 'Core', 'ReactNativeVersion.js'),
  ];

  for (let index = 0; index < templatePaths.length; index++) {
    await fs.writeFile(
      destinationPaths[index],
      require(templatePaths[index])(templateData),
      { encoding: 'utf-8' },
    );
  }
}

async function updateGradleFile(version: string) /*: Promise<void> */ {
  const contents = await fs.readFile(GRADLE_FILE_PATH, 'utf-8');

  return fs.writeFile(
    GRADLE_FILE_PATH,
    contents.replace(/^VERSION_NAME=.*/, `VERSION_NAME=${version}`),
  );
}

executeScriptAsync();
