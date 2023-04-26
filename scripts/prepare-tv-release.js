/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script is derived from npm-publish.js.
 * It prepares a release version of react-native-tvos.
 *
 *  * Create Android artifacts
 *  * Copy hermesc from react-native core release
 *  * It will not publish to npm
 *
 */

const {exec, echo, exit, test, env} = require('shelljs');
const fs = require('fs');
const fs_extra = require('fs-extra');
const os = require('os');
const path = require('path');

let extraHermesDirectoryPath;

{
  const HERMES_INSTALL_LOCATION = 'sdks';
  const HERMES_SOURCE_DEST_PATH = `${HERMES_INSTALL_LOCATION}/hermes`;

  let hermesReleaseTag;
  let hermesReleaseURI;
  try {
    hermesReleaseTag = fs
      .readFileSync(`${HERMES_INSTALL_LOCATION}/.hermesversion`, {
        encoding: 'utf8',
        flag: 'r',
      })
      .trim();
    hermesReleaseURI = `https://github.com/facebook/hermes/archive/refs/tags/${hermesReleaseTag}.tar.gz`;
    extraHermesDirectoryPath = `${HERMES_INSTALL_LOCATION}/hermes/hermes-${hermesReleaseTag}`;
  } catch (err) {
    echo('Failed to read current Hermes release tag.');
    // TODO: We'll need to make sure every release going forward has one of these.
    exit(1);
  }

  // Copy hermesc from RN core release
  const HERMESC_SOURCE_LOCATION = 'node_modules/react-native-core/sdks/hermesc';
  const HERMESC_DEST_LOCATION = `${HERMES_INSTALL_LOCATION}/hermesc`;
  fs_extra.copySync(HERMESC_SOURCE_LOCATION, HERMESC_DEST_LOCATION, {
    overwrite: true,
  });

  const tmpDownloadDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'hermes-tarball'),
  );
  const tmpExtractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes'));

  const hermesInstallScript = `
    mkdir -p ${HERMES_SOURCE_DEST_PATH} && \
    wget ${hermesReleaseURI} -O ${tmpDownloadDir}/hermes.tar.gz && \
    tar -xzf ${tmpDownloadDir}/hermes.tar.gz -C ${tmpExtractDir} && \
    HERMES_SOURCE_EXTRACT_PATH=$(ls -d ${tmpExtractDir}/*) && \
    mv $HERMES_SOURCE_EXTRACT_PATH ${HERMES_SOURCE_DEST_PATH}
  `;

  if (fs.existsSync(`${HERMES_SOURCE_DEST_PATH}`)) {
    if (exec(`rm -rf ./${HERMES_SOURCE_DEST_PATH}`).code) {
      echo('Failed to clean up previous Hermes installation.');
      exit(1);
    }
  }
  if (exec(hermesInstallScript).code) {
    echo('Failed to include Hermes in release.');
    exit(1);
  }
}

const releaseVersion = require('../package.json').version;

// -------- Generating Android Artifacts with JavaDoc
if (exec('./gradlew :ReactAndroid:installArchives').code) {
  echo('Could not generate artifacts');
  exit(1);
}

// -------- Generating the Hermes Engine Artifacts
env.REACT_NATIVE_HERMES_SKIP_PREFAB = true;
if (exec('./gradlew :ReactAndroid:hermes-engine:installArchives').code) {
  echo('Could not generate artifacts');
  exit(1);
}

// -------- For now, publish Maven artifacts inside android directory
if (exec('./gradlew publishAllInsideNpmPackage').code) {
  echo('Could not generate artifacts');
  exit(1);
}

// undo uncommenting javadoc setting
exec('git checkout ReactAndroid/gradle.properties');

echo('Generated artifacts for Maven');

let artifacts = [
  '.module',
  '.pom',
  '-debug.aar',
  '-release.aar',
  '-debug-sources.jar',
  '-release-sources.jar',
  '-debug-javadoc.jar',
  '-release-javadoc.jar',
].map(suffix => {
  return `react-android-${releaseVersion}${suffix}`;
});

artifacts.forEach(name => {
  if (
    !test(
      '-e',
      `./android/com/facebook/react/react-android/${releaseVersion}/${name}`,
    )
  ) {
    echo(`Failing as expected file: ${name} was not correctly generated.`);
    exit(1);
  }
});

if (extraHermesDirectoryPath) {
  echo('Cleanup extra hermes directory...');
  fs.rmSync(extraHermesDirectoryPath, { recursive: true, force: true });
  echo(`Removed ${extraHermesDirectoryPath}.`);
}

echo(`Release prepared for version ${releaseVersion}`);

exit(0);
