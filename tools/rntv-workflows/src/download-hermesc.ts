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
  recreateDirectoryAsync,
  getReactNativeVersion,
  baseCoreVersionStringForTV,
  unpackTarArchiveAsync,
} from './common';

const {
  rnPackagePath,
} = repoConstants;
const { buildDir } = easConstants;

const executeScriptAsync = async function () {
  if (process.env.RNTV_RELEASE_BUILD !== '1') {
    echo('Skipping Hermes download for non-release build.');
    return;
  }
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

  let reactNativeVersion = await getReactNativeVersion();
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

  console.log('Done.');
};

executeScriptAsync();
