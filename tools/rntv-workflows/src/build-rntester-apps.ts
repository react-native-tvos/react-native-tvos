#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import path from 'path';
import spawnAsync from '@expo/spawn-async';

import {
  easConstants,
  repoConstants,
  cloneAndInstallBranchAsync,
  validateForGitHub,
  recreateDirectoryAsync,
  unpackTarArchiveAsync,
  removeDirectoryIfNeededAsync,
  runGradlewTasksAsync,
} from './common';
import { test } from 'shelljs';
import { podInstallRnTesterAsync } from './common/podInstallRnTester';

const { releaseBranch, repoPath, releaseVersion } = repoConstants;

const rnTesterPath = path.join(repoPath, 'packages', 'rn-tester');

async function executeScriptAsync() {
  validateForGitHub();

  const { mavenLocalPath, mavenArtifactsPath } = easConstants;

  console.log('Remove Maven local repository from iOS build...');

  await removeDirectoryIfNeededAsync(mavenLocalPath);

  await cloneAndInstallBranchAsync(releaseBranch);

  let defaultMavenLocalRepositoryPath: string | undefined = undefined;

  if (test('-e', mavenArtifactsPath)) {
    console.log(
      'Setting up Maven repository with local artifacts at /tmp/maven-local...',
    );

    defaultMavenLocalRepositoryPath = path.join('/', 'tmp', 'maven-local');

    await recreateDirectoryAsync(defaultMavenLocalRepositoryPath);

    await unpackTarArchiveAsync(
      path.join(mavenArtifactsPath, 'maven-artifacts.tgz'),
      defaultMavenLocalRepositoryPath,
    );

    // We can remove the Maven artifact tarball now
    await recreateDirectoryAsync(mavenArtifactsPath);

    console.log(`Installing Cocoapods from local artifacts...`);

    await podInstallRnTesterAsync(true);
  } else {
    recreateDirectoryAsync(mavenArtifactsPath);
    console.log(`Installing Cocoapods...`);
    await podInstallRnTesterAsync(false);
  }

  console.log('Build RNTester app for Apple TV simulator (debug)...');

  await spawnAsync('yarn', ['build-ios-hermes'], {
    cwd: rnTesterPath,
    stdio: 'inherit',
  });

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

  console.log('Remove /tmp/maven-local now that Apple TV build is done...');

  if (defaultMavenLocalRepositoryPath) {
    await removeDirectoryIfNeededAsync(defaultMavenLocalRepositoryPath);
  }

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
