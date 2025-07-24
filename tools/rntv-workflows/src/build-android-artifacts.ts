#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import { echo, exit, exec, test } from 'shelljs';
import path from 'path';
import { promises as fs } from 'node:fs';
import os from 'os';
import spawnAsync from '@expo/spawn-async';

import {
  copyDirectoryAsync,
  downloadFileAsync,
  easConstants,
  repoConstants,
  runGradlewTasksAsync,
  recreateDirectoryAsync,
  copyPublishGradleFileAsync,
  getMavenConstantsAsync,
  baseCoreVersionStringForTV,
  unpackTarArchiveAsync,
  validateForMaven,
  cloneAndInstallBranchAsync,
  getReactNativeVersion,
} from './common';

const {
  repoName,
  releaseBranch,
  rnPackagePath,
  isSnapshot,
  publishToSonatype,
} = repoConstants;
const { buildDir, mavenArtifactsPath, mavenLocalPath } = easConstants;

export const validateAndroidArtifactsAsync = async (releaseVersion: string) => {
  let artifacts = [
    '.module',
    '.pom',
    '-debug.aar',
    '-release.aar',
    '-debug-sources.jar',
    '-release-sources.jar',
  ].map((suffix) => {
    return `react-android-${releaseVersion}${suffix}`;
  });

  artifacts.forEach((name) => {
    if (
      !test(
        '-e',
        `${mavenLocalPath}/io/github/react-native-tvos/react-android/${releaseVersion}$/${name}`,
      )
    ) {
      echo(
        `Failing as expected file: \n\
      ${mavenLocalPath}/io/github/react-native-tvos/react-android/${releaseVersion}/${name}\n\
      was not correctly generated.`,
      );
      return false;
    }
  });

  return true;
};

const executeScriptAsync = async function () {
  validateForMaven();

  if (publishToSonatype) {
    // Clean up maven_artifacts directory to free up space
    await recreateDirectoryAsync(mavenArtifactsPath);
  }

  await cloneAndInstallBranchAsync(releaseBranch);

  await copyPublishGradleFileAsync();

  const HERMES_INSTALL_LOCATION = path.resolve(rnPackagePath, 'sdks');
  const HERMES_SOURCE_DEST_PATH = path.join(HERMES_INSTALL_LOCATION, 'hermes');
  const HERMES_VERSION_PATH = path.resolve(
    rnPackagePath,
    'sdks',
    '.hermesversion',
  );
  let extraHermesDirectoryPath: string;

  let hermesReleaseTag: string;
  let hermesReleaseURI: string | URL | Request;
  try {
    hermesReleaseTag = (
      await fs.readFile(HERMES_VERSION_PATH, {
        encoding: 'utf8',
        flag: 'r',
      })
    ).trim();
    hermesReleaseURI = `https://github.com/facebook/hermes/archive/refs/tags/${hermesReleaseTag}.tar.gz`;
    extraHermesDirectoryPath = `${HERMES_INSTALL_LOCATION}/hermes/hermes-${hermesReleaseTag}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    echo('Failed to read current Hermes release tag.');
    // TODO: We'll need to make sure every release going forward has one of these.
    exit(1);
  }

  /*
  const packages: ProjectInfo = await getPackages({
    includeReactNative: true,
    includePrivate: false,
  });
   */

  const reactNativeVersion = await getReactNativeVersion();

  console.log(`repoName = ${repoName}`);

  let reactNativeCoreVersion = baseCoreVersionStringForTV(reactNativeVersion);
  // Override if env variable set
  if (process.env.REACT_NATIVE_CORE_VERSION?.length) {
    reactNativeCoreVersion = process.env.REACT_NATIVE_CORE_VERSION;
  }
  console.log(`reactNativeCoreVersion = ${reactNativeCoreVersion}`);

  const REACT_NATIVE_CORE_PATH = path.join(buildDir, 'react-native-core');
  await recreateDirectoryAsync(REACT_NATIVE_CORE_PATH);
  await spawnAsync('npm', ['pack', `react-native@${reactNativeCoreVersion}`], {
    cwd: REACT_NATIVE_CORE_PATH,
    stdio: 'ignore',
  });
  await unpackTarArchiveAsync(
    path.resolve(
      REACT_NATIVE_CORE_PATH,
      `react-native-${reactNativeCoreVersion}.tgz`,
    ),
    REACT_NATIVE_CORE_PATH,
  );

  // Copy hermesc from RN core release
  const HERMESC_SOURCE_LOCATION = path.resolve(
    REACT_NATIVE_CORE_PATH,
    'package',
    'sdks',
    'hermesc',
  );
  const HERMESC_DEST_LOCATION = path.join(HERMES_INSTALL_LOCATION, 'hermesc');
  await copyDirectoryAsync(HERMESC_SOURCE_LOCATION, HERMESC_DEST_LOCATION);

  const tmpDownloadDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'hermes-tarball'),
  );
  const tmpExtractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hermes'));

  const hermesInstallScript = `
    tar -xzf ${tmpDownloadDir}/hermes.tar.gz -C ${tmpExtractDir} && \
    HERMES_SOURCE_EXTRACT_PATH=$(ls -d ${tmpExtractDir}/*) && \
    mv $HERMES_SOURCE_EXTRACT_PATH ${HERMES_SOURCE_DEST_PATH}
  `;

  await recreateDirectoryAsync(HERMES_SOURCE_DEST_PATH);

  echo(`Downloading Hermes from ${hermesReleaseURI} to ${tmpDownloadDir}...`);
  await downloadFileAsync(hermesReleaseURI, tmpDownloadDir, 'hermes.tar.gz');
  echo('Download complete.');

  if (exec(hermesInstallScript).code) {
    echo('Failed to include Hermes in release.');
    exit(1);
  }

  if (extraHermesDirectoryPath) {
    echo('Cleanup extra hermes directory...');
    await fs.rmdir(extraHermesDirectoryPath, { recursive: true });
    echo(`Removed ${extraHermesDirectoryPath}.`);
  }

  echo('Generating Android artifacts...');
  await runGradlewTasksAsync(['publishAllToMavenTempLocal']);
  echo('Generated artifacts for Maven');

  const { releaseVersion } = await getMavenConstantsAsync();

  const publishType = isSnapshot ? 'Snapshot' : 'Release';

  /*
  if (!isSnapshot) {
    echo('Validating Android release artifacts...');
    const valid = await validateAndroidArtifactsAsync(releaseVersion);
    if (!valid) {
      exit(1);
    }
  }
   */

  if (publishToSonatype) {
    echo('Publishing hermes-android and react-android to Sonatype...');
    await runGradlewTasksAsync([
      ':packages:react-native:ReactAndroid:hermes-engine:publishToSonatype',
      ':packages:react-native:ReactAndroid:publishToSonatype',
      'closeAndReleaseSonatypeStagingRepository',
    ]);

    echo(
      `${publishType} of hermes-android and react-android prepared for version ${releaseVersion}`,
    );
  } else {
    console.log(
      'PUBLISH_TO_SONATYPE is false, artifacts will not be published.',
    );
  }
  console.log('Done.');
};

executeScriptAsync();
