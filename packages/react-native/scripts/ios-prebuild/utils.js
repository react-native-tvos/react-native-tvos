/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor} from './types'; */

const {execSync} = require('child_process');
const fs = require('fs');

const utilsLog = createLogger('Utils');

/**
 * Creates a folder if it does not exist
 * @param {string} folderPath - The path to the folder
 * @returns {string} The path to the created or existing folder
 */
function createFolderIfNotExists(folderPath /*:string*/) /*: string */ {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {recursive: true});
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Failed to create folder: ${folderPath}`);
    }
  }
  return folderPath;
}

function throwIfOnEden() {
  try {
    execSync('eden info', {stdio: 'ignore'});
  } catch (error) {
    // eden info failed, we are not on Eden, do nothing
    return;
  }

  throw new Error('Cannot prepare the iOS prebuilds on an Eden checkout');
}

function createLogger(
  prefix /*: string */,
) /*: (message: string, level?: 'info' | 'warning' | 'error') => void */ {
  return function (
    message /*: string */,
    level /*: 'info' | 'warning' | 'error' */ = 'info',
  ) {
    // Simple log coloring for terminal output
    const resolvedPrefix = `[${prefix}] `;
    let colorFn = (x /*:string*/) => x;
    if (process.stdout.isTTY) {
      if (level === 'info') colorFn = x => `\x1b[32m${x}\x1b[0m`;
      else if (level === 'error') colorFn = x => `\x1b[31m${x}\x1b[0m`;
      else colorFn = x => `\x1b[33m${x}\x1b[0m`;
    }

    console.log(colorFn(resolvedPrefix) + message);
  };
}

async function computeNightlyTarballURL(
  version /*: string */,
  buildType /*: BuildFlavor */,
  artifactCoordinate /*: string */,
  artifactName /*: string */,
) /*: Promise<string> */ {
  const xmlUrl = `https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/${artifactCoordinate}/${version}-SNAPSHOT/maven-metadata.xml`;

  const response = await fetch(xmlUrl);
  if (!response.ok) {
    return '';
  }
  const xmlText = await response.text();

  // Extract the <snapshot> block
  const snapshotMatch = xmlText.match(/<snapshot>([\s\S]*?)<\/snapshot>/);
  if (!snapshotMatch) {
    return '';
  }
  const snapshotContent = snapshotMatch[1];

  // Extract <timestamp> from the snapshot block
  const timestampMatch = snapshotContent.match(/<timestamp>(.*?)<\/timestamp>/);
  if (!timestampMatch) {
    return '';
  }
  const timestamp = timestampMatch[1];

  // Extract <buildNumber> from the snapshot block
  const buildNumberMatch = snapshotContent.match(
    /<buildNumber>(.*?)<\/buildNumber>/,
  );
  if (!buildNumberMatch) {
    return '';
  }
  const buildNumber = buildNumberMatch[1];

  const fullVersion = `${version}-${timestamp}-${buildNumber}`;
  const finalUrl = `https://central.sonatype.com/repository/maven-snapshots/com/facebook/react/${artifactCoordinate}/${version}-SNAPSHOT/${artifactCoordinate}-${fullVersion}-${artifactName}`;
  return finalUrl;
}

/**
 * Computes core release version needed for finding Hermes artifacts
 */
function coreVersionForTVVersion(version /*: string */) /*: string */ {
  const match = version.match(/(.+)-(.+)/);
  if (!match) {
    // This is not a TV release or prerelease
    // Check for the override used to build RNTester for PRs on RNTV main
    if (process.env.REACT_NATIVE_OVERRIDE_NIGHTLY_BUILD_VERSION) {
      const nightlyBuildVersion =
        process.env.REACT_NATIVE_OVERRIDE_NIGHTLY_BUILD_VERSION;
      utilsLog(`Overriding Hermes core version to ${nightlyBuildVersion}`);
      return nightlyBuildVersion;
    }
    // Otherwise, return the entire version string
    return version;
  }
  const coreBaseVersion = match[1];
  const prerelease = match[2];
  const prereleaseMatch = prerelease.match(/0rc(\d+)/);
  // Check to see if this matches the convention for TV prereleases ("0.79.0-0rc1", etc.)
  if (!prereleaseMatch) {
    // If not, return the core version part ("0.79.0")
    utilsLog(`core_version = ${coreBaseVersion}`);
    return coreBaseVersion;
  }
  // This is a TV prerelease, so return the core prerelease version ("0.79.0-rc.1")
  const corePrereleaseVersion = `${coreBaseVersion}-rc.${prereleaseMatch[1]}`;
  utilsLog(`core_version = ${corePrereleaseVersion}`);
  return corePrereleaseVersion;
}

module.exports = {
  createFolderIfNotExists,
  throwIfOnEden,
  createLogger,
  computeNightlyTarballURL,
  coreVersionForTVVersion,
};
