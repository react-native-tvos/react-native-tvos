import { BuildType, Version } from './types';

const VERSION_REGEX = /^v?((\d+)\.(\d+)\.(\d+)(?:-(.+))?)$/;

const version_type_map = {
  release: validateRelease,
  'dry-run': validateDryRun,
  nightly: validateNightly,
  prealpha: validatePrealpha,
  tvrelease: validateTVRelease,
};

const version_types = new Set(Object.keys(version_type_map));

/**
 * Parses a version string and performs some checks to verify its validity.
 * A valid version is in the format vX.Y.Z[-KKK] where X, Y, Z are numbers and KKK can be something else.
 * The `builtType` is used to enforce that the major version can assume only specific
 * values.
 *
 * Some examples of valid versions are:
 * - stable: 0.68.1
 * - prerelease: 0.Y.Z-rc.K
 * - e2e-test: X.Y.Z-20221116-2018
 * - nightly: X.Y.Z-20221116-0bc4547fc
 * - dryrun: 1000.0.0
 * - prealpha: 0.0.0-prealpha-20221116
 *
 * - tvrelease: 0.75.1-0
 * - tvprerelease: 0.75.1-0rc1, 0.75.1-0test2
 */
export function parseVersion(versionStr: string, buildType: BuildType) {
  const match = extractMatchIfValid(versionStr);
  const [, version, major, minor, patch, prerelease] = match;

  const parsedVersion = {
    version,
    major,
    minor,
    patch,
    prerelease,
  };

  if (buildType != null) {
    validateVersion(parsedVersion, buildType);
  }

  return parsedVersion;
}

export function parseAnyVersion(versionStr: string) {
  for (let buildTypeString of version_types) {
    const buildType = buildTypeString as unknown as BuildType;
    try {
      const parsed = parseVersion(versionStr, buildType);
      if (parsed) {
        return parsed;
      }
    } catch (e) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  }
  throw new Error('Version string did not match any parser.');
}

export function baseCoreVersionStringForTV(versionStr: string) {
  try {
    const tvVersionInfo = parseVersion(versionStr, 'tvrelease');
    let prerelease = null;
    if (isTVPrerelease(tvVersionInfo)) {
      const rcNumber = tvVersionInfo.prerelease.split('rc')[1];
      prerelease = `rc.${rcNumber}`;
    }
    return versionToString({
      ...tvVersionInfo,
      prerelease,
    });
  } catch (e) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  // If the above fails, assume versionStr is a core release
  const versionInfo = parseVersion(versionStr, 'release');
  return versionToString({
    ...versionInfo,
    prerelease: null,
  });
}

function versionToString(versionInfo: Version) {
  const prereleaseString = versionInfo.prerelease
    ? `-${versionInfo.prerelease}`
    : '';
  return `${versionInfo.major}.${versionInfo.minor}.${versionInfo.patch}${prereleaseString}`;
}

function extractMatchIfValid(versionStr /*: string */) {
  const match = versionStr.match(VERSION_REGEX);
  if (!match) {
    throw new Error(
      `You must pass a correctly formatted version; couldn't parse ${versionStr}`,
    );
  }
  return match;
}

function validateVersion(versionObject: Version, buildType: BuildType) {
  if (!version_types.has(buildType)) {
    throw new Error(`Unrecognized build type ${buildType}`);
  }
  const validationFunction = version_type_map[buildType];
  validationFunction(versionObject);
}

/**
 * Releases are in the form of 0.Y.Z[-RC.0]
 */
function validateRelease(version: Version) {
  const validRelease = isStableRelease(version) || isStablePrerelease(version);
  if (!validRelease) {
    throw new Error(`Version ${version.version} is not valid for Release`);
  }
}

/**
 * TV Releases are in the form of 0.Y.Z-0
 * TV Prereleases are in the form of 0.Y.Z-0rc0
 * TV test releases are in the form of 0.Y.Z-0test0
 */
function validateTVRelease(version: Version) {
  const validRelease =
    isTVRelease(version) || isTVPrerelease(version) || isTVTestRelease(version);
  if (!validRelease) {
    throw new Error(`Version ${version.version} is not valid for Release`);
  }
}

function validateDryRun(version: Version) {
  if (
    !isMain(version) &&
    !isNightly(version) &&
    !isStableRelease(version) &&
    !isStablePrerelease(version)
  ) {
    throw new Error(`Version ${version.version} is not valid for dry-runs`);
  }
}

function validateNightly(version: Version) {
  // a valid nightly is a prerelease
  if (!isNightly(version)) {
    throw new Error(`Version ${version.version} is not valid for nightlies`);
  }
}

function validatePrealpha(version: Version) {
  if (!isValidPrealpha(version)) {
    throw new Error(`Version ${version.version} is not valid for prealphas`);
  }
}

export function isStableRelease(version: Version) /*: boolean */ {
  return (
    version.major === '0' &&
    !!version.minor.match(/^\d+$/) &&
    !!version.patch.match(/^\d+$/) &&
    version.prerelease == null
  );
}

export function isStablePrerelease(version: Version) /*: boolean */ {
  return !!(
    version.major === '0' &&
    version.minor.match(/^\d+$/) &&
    version.patch.match(/^\d+$/) &&
    (version.prerelease?.startsWith('rc.') ||
      version.prerelease?.startsWith('rc-') ||
      version.prerelease?.match(/^(\d{8})-(\d{4})$/))
  );
}

export function isTVRelease(version: Version) {
  return !!(
    version.major === '0' &&
    version.minor.match(/^\d+$/) &&
    version.patch.match(/^\d+$/) &&
    version.prerelease?.match(/^(\d+)$/)
  );
}

export function isTVPrerelease(version: Version) {
  return !!(
    version.major === '0' &&
    version.minor.match(/^\d+$/) &&
    version.patch.match(/^\d+$/) &&
    version.prerelease?.match(/^(\d+)rc(\d+)$/)
  );
}

export function isTVTestRelease(version: Version) {
  return !!(
    version.major === '0' &&
    version.minor.match(/^\d+$/) &&
    version.patch.match(/^\d+$/) &&
    version.prerelease?.match(/^(\d+)test(\d+)$/)
  );
}

function isNightly(version: Version) /*: boolean */ {
  // Check if older nightly version
  if (version.major === '0' && version.minor === '0' && version.patch === '0') {
    return true;
  }

  return version.version.includes('nightly');
}

function isMain(version: Version) /*: boolean */ {
  return (
    version.major === '1000' && version.minor === '0' && version.patch === '0'
  );
}

function isValidPrealpha(version /*: Version */) /*: boolean */ {
  return !!(
    version.major === '0' &&
    version.minor === '0' &&
    version.patch === '0' &&
    version.prerelease != null &&
    version.prerelease.match(/^prealpha-(\d{10})$/)
  );
}
