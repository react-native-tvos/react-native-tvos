#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import path from 'path';
import spawnAsync from '@expo/spawn-async';

import {
  easConstants,
  repoConstants,
  cloneAndInstallBranchAsync,
  validateForGitHub,
  removeDirectoryIfNeededAsync,
  runGradlewTasksAsync,
  recreateDirectoryAsync,
} from './common';
import { podInstallRnTesterAsync } from './common/podInstallRnTester';
import { test } from 'shelljs';

const { releaseBranch, repoPath, releaseVersion } = repoConstants;

const rnTesterPath = path.join(repoPath, 'packages', 'rn-tester');

async function executeScriptAsync() {
  validateForGitHub();

  const { mavenLocalPath, mavenArtifactsPath } = easConstants;

  console.log('Remove Maven local repository from iOS build...');

  await removeDirectoryIfNeededAsync(mavenLocalPath);

  await cloneAndInstallBranchAsync(releaseBranch);

  console.log(`Installing Cocoapods...`);

  await podInstallRnTesterAsync(false);

  console.log('Build RNTester app for Apple TV simulator (debug)...');

  await spawnAsync(
    'xcodebuild',
    [
      '-workspace',
      'RNTesterPods.xcworkspace',
      '-scheme',
      'RNTester',
      '-configuration',
      'Debug',
      '-sdk',
      'appletvsimulator',
      '-arch',
      'arm64',
      '-derivedDataPath',
      'build',
    ],
    {
      cwd: rnTesterPath,
      stdio: 'ignore',
    },
  );

  console.log('Create maven_artifacts folder if needed...');

  if (!test('-e', mavenArtifactsPath)) {
    await recreateDirectoryAsync(mavenArtifactsPath);
  }

  console.log('Package RNTester Apple TV app in maven_artifacts folder...');

  const rnTesterAppleTVProductsDirectory = path.join(
    rnTesterPath,
    'build',
    'Build',
    'Products',
    'Debug-appletvsimulator',
  );
  const rnTesterAppleTVArchivePath = path.join(
    mavenArtifactsPath,
    `rntester-${releaseVersion}-appletv.tgz`,
  );
  await spawnAsync(
    'tar',
    ['zcf', rnTesterAppleTVArchivePath, 'RNTester.app', 'RNTester.app.dSYM'],
    {
      cwd: rnTesterAppleTVProductsDirectory,
      stdio: 'inherit',
    },
  );

  console.log('Build RNTester app for Android TV simulator (debug)...');

  await removeDirectoryIfNeededAsync(
    path.join(rnTesterPath, 'android', 'app', 'build'),
  );

  await runGradlewTasksAsync([
    ':packages:rn-tester:android:app:assembleHermesDebug',
  ]);

  console.log('Package RNTester Android TV apks in maven_artifacts folder...');

  const rnTesterAndroidTVProductsDirectory = path.join(
    rnTesterPath,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'hermes',
    'debug',
  );

  const rnTesterAndroidTVArchivePath = path.join(
    mavenArtifactsPath,
    `rntester-${releaseVersion}-androidtv.tgz`,
  );
  await spawnAsync(
    'tar',
    [
      'zcf',
      rnTesterAndroidTVArchivePath,
      'app-hermes-arm64-v8a-debug.apk',
      'app-hermes-armeabi-v7a-debug.apk',
      'app-hermes-x86-debug.apk',
      'app-hermes-x86_64-debug.apk',
    ],
    {
      cwd: rnTesterAndroidTVProductsDirectory,
      stdio: 'inherit',
    },
  );

  console.log('Done.');
}

executeScriptAsync();
