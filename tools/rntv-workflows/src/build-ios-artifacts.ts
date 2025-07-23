#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import { echo, test } from 'shelljs';
import path from 'path';
import { promises as fs } from 'node:fs';
import os from 'os';
import spawnAsync from '@expo/spawn-async';

import {
  copyDirectoryAsync,
  copyDirectoryContentsAsync,
  copyPublishGradleFileAsync,
  downloadFileAsync,
  repoConstants,
  readFileFromPathAsync,
  recreateDirectoryAsync,
  runGradlewTasksAsync,
  validateForMaven,
  cloneAndInstallBranchAsync,
  removeDirectoryIfNeededAsync,
  parseVersion,
} from './common';

const {
  rnPackagePath,
  isSnapshot,
  publishToSonatype,
  releaseBranch,
  includeVisionOS,
  includeTVOS,
} = repoConstants;

type HermesBuildType = 'Debug' | 'Release';

const HERMES_ARCHIVE_DIR = path.join(
  rnPackagePath,
  'ReactAndroid',
  'external-artifacts',
  'artifacts',
);
const HERMES_DSYMS_WORKING_DIR = path.join(
  process.env.TMPDIR,
  'hermes_tmp',
  'dSYM',
);
const HERMES_DSYMS_DEST_DIR = path.join(process.env.TMPDIR, 'hermes', 'dSYM');

const SDKS_DIR = path.resolve(rnPackagePath, 'sdks');
const HERMES_DIR = path.join(SDKS_DIR, 'hermes');
const HERMES_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesversion');
const HERMES_PATCH_FILE_PATH = path.join(
  rnPackagePath,
  'scripts',
  'hermes',
  'hermes.patch',
);
const HERMES_SOURCE_BASE_URL = 'https://github.com/facebook/hermes';
const HERMES_TARBALL_DOWNLOAD_DIR = path.join(SDKS_DIR, 'download');

const MAC_DEPLOYMENT_TARGET = '10.13';
const IOS_DEPLOYMENT_TARGET = '15.1';
const XROS_DEPLOYMENT_TARGET = '1.0';

const validateHermesFrameworksExist = (destrootDir: string) => {
  if (
    !test(
      '-e',
      path.join(destrootDir, 'Library/Frameworks/macosx/hermes.framework'),
    )
  ) {
    throw new Error(
      'Error: Hermes macOS Framework not found. Are you sure Hermes has been built?',
    );
  }
  if (
    !test(
      '-e',
      path.join(destrootDir, 'Library/Frameworks/universal/hermes.xcframework'),
    )
  ) {
    throw new Error(
      'Error: Hermes iOS XCFramework not found. Are you sure Hermes has been built?',
    );
  }
};

const createHermesPrebuiltArtifactsTarballAsync = async (
  hermesDir: string,
  buildType: HermesBuildType,
  tarballOutputDir: string,
  excludeDebugSymbols: boolean,
) => {
  validateHermesFrameworksExist(path.join(hermesDir, 'destroot'));

  let tarballTempDir: string;
  try {
    tarballTempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'hermes-engine-destroot-'),
    );

    let args = ['-a'];
    if (excludeDebugSymbols) {
      args.push('--exclude=dSYMs/');
      args.push('--exclude=*.dSYM/');
    }
    args.push('./destroot');
    args.push(tarballTempDir);
    await spawnAsync('rsync', args, {
      cwd: hermesDir,
    });
    if (test('-e', path.join(hermesDir, 'LICENSE'))) {
      await spawnAsync('cp', ['LICENSE', tarballTempDir], { cwd: hermesDir });
    }
  } catch (error) {
    throw new Error(`Failed to copy destroot to tempdir: ${error}`);
  }

  const tarballFilename = `hermes-ios-${buildType.toLowerCase()}.tar.gz`;

  try {
    await spawnAsync(
      'tar',
      ['-C', tarballTempDir, '-czvf', tarballFilename, '.'],
      {
        cwd: tarballOutputDir,
      },
    );
  } catch (error) {
    throw new Error(`[Hermes] Failed to create tarball: ${error}`);
  }

  if (!test('-e', path.join(tarballOutputDir, tarballFilename))) {
    throw new Error(
      `Tarball creation failed, could not locate tarball at ${tarballFilename}`,
    );
  }

  return tarballFilename;
};

const createHermesDSYMArchivesAsync = async (
  hermesBuildType: HermesBuildType,
) => {
  const WORKING_DIR = path.join(HERMES_DSYMS_WORKING_DIR, hermesBuildType);
  const frameworkTypes = [
    ...['macosx', 'catalyst', 'iphoneos', 'iphonesimulator'],
    ...(includeVisionOS ? ['xros', 'xrsimulator'] : []),
    ...(includeTVOS ? ['appletvos', 'appletvsimulator'] : []),
  ];
  for (const frameworkType of frameworkTypes) {
    await recreateDirectoryAsync(path.join(WORKING_DIR, frameworkType));
    await copyDirectoryAsync(
      path.join(
        HERMES_DIR,
        `build_${frameworkType}`,
        'API',
        'hermes',
        'hermes.framework.dSYM',
      ),
      path.join(WORKING_DIR, frameworkType, 'hermes.framework.dSYM'),
    );
  }
  await spawnAsync(
    'tar',
    ['-C', WORKING_DIR, '-czvf', 'hermes.framework.dSYM', '.'],
    {
      cwd: HERMES_DIR,
    },
  );
  await recreateDirectoryAsync(
    path.join(HERMES_DSYMS_DEST_DIR, hermesBuildType),
  );
  await fs.copyFile(
    path.join(HERMES_DIR, 'hermes.framework.dSYM'),
    path.join(HERMES_DSYMS_DEST_DIR, hermesBuildType, 'hermes.framework.dSYM'),
  );
};

const buildHermesIosArtifactAsync = async (
  buildType: HermesBuildType,
  releaseVersion: string,
) => {
  // Step 1: Clean and prepare directories

  await recreateDirectoryAsync(path.join(rnPackagePath, 'sdks', 'hermes'));
  await recreateDirectoryAsync(path.join(rnPackagePath, 'sdks', 'download'));

  const hermesVersionTag = await readFileFromPathAsync(HERMES_TAG_FILE_PATH);
  const hermesVersionSHAPipe = await spawnAsync(
    'git',
    ['ls-remote', HERMES_SOURCE_BASE_URL, hermesVersionTag],
    {
      stdio: 'pipe',
    },
  );
  const hermesVersionSHA = hermesVersionSHAPipe.output[0].split('\t')[0];
  echo(`hermesVersionSHA = ${hermesVersionSHA}`);

  const hermesDownloadFilename = `hermes-${hermesVersionSHA}.tgz`;

  const hermesDownloadUrl = `${HERMES_SOURCE_BASE_URL}/tarball/${hermesVersionTag}`;

  await downloadFileAsync(
    hermesDownloadUrl,
    HERMES_TARBALL_DOWNLOAD_DIR,
    hermesDownloadFilename,
  );

  const hermesDownloadFilepath = path.resolve(
    HERMES_TARBALL_DOWNLOAD_DIR,
    hermesDownloadFilename,
  );
  echo(`Downloaded ${hermesDownloadUrl} to ${hermesDownloadFilepath}`);

  await spawnAsync(
    'tar',
    [
      'zxf',
      hermesDownloadFilepath,
      '--strip-components=1',
      '--directory',
      HERMES_DIR,
    ],
    {},
  );
  echo(`Unpacked ${hermesDownloadFilepath} to ${HERMES_DIR}`);

  if (test('-e', HERMES_PATCH_FILE_PATH)) {
    await spawnAsync('patch', ['-p1', '-i', HERMES_PATCH_FILE_PATH], {
      cwd: HERMES_DIR,
      stdio: 'inherit',
    });
    echo(`Patched Hermes from ${HERMES_PATCH_FILE_PATH}`);
  }

  await fs.copyFile(
    path.join(SDKS_DIR, 'hermes-engine', 'hermes-engine.podspec'),
    path.join(HERMES_DIR, 'hermes-engine.podspec'),
  );
  await fs.copyFile(
    path.join(SDKS_DIR, 'hermes-engine', 'hermes-utils.rb'),
    path.join(HERMES_DIR, 'hermes-utils.rb'),
  );
  await copyDirectoryContentsAsync(
    path.join(SDKS_DIR, 'hermes-engine', 'utils'),
    path.join(HERMES_DIR, 'utils'),
  );

  // Build Mac binaries
  await spawnAsync('bash', ['./utils/build-mac-framework.sh'], {
    cwd: HERMES_DIR,
    stdio: 'inherit',
    env: {
      BUILD_TYPE: buildType,
      PATH: process.env.PATH,
      MAC_DEPLOYMENT_TARGET,
      IOS_DEPLOYMENT_TARGET,
      XROS_DEPLOYMENT_TARGET,
      HERMES_RELEASE_VERSION: releaseVersion,
    },
  });

  echo(`Built Mac binaries for build type ${buildType}...`);

  // Build iOS/tvOS binaries
  await spawnAsync('bash', ['./utils/build-ios-framework.sh'], {
    cwd: HERMES_DIR,
    stdio: 'inherit',
    env: {
      BUILD_TYPE: buildType,
      PATH: process.env.PATH,
      MAC_DEPLOYMENT_TARGET,
      IOS_DEPLOYMENT_TARGET,
      XROS_DEPLOYMENT_TARGET,
      HERMES_RELEASE_VERSION: releaseVersion,
    },
  });

  echo(`Built iOS/tvOS binaries for build type ${buildType}...`);

  await createHermesPrebuiltArtifactsTarballAsync(
    HERMES_DIR,
    buildType,
    HERMES_ARCHIVE_DIR,
    true,
  );

  echo(`Created Hermes archive in ${HERMES_ARCHIVE_DIR}...`);

  await createHermesDSYMArchivesAsync(buildType);
};

const executeScriptAsync = async () => {
  validateForMaven();

  const { releaseVersion } = repoConstants;

  const version = parseVersion(releaseVersion, 'tvrelease');

  if (parseInt(version.minor, 10) >= 76) {
    // No need to build Hermes for 76 and later
    echo(`Hermes build not required for RN 0.76 and later.`);
    return;
  }

  await cloneAndInstallBranchAsync(releaseBranch);

  await copyPublishGradleFileAsync();

  await recreateDirectoryAsync(HERMES_ARCHIVE_DIR);
  await recreateDirectoryAsync(HERMES_DSYMS_WORKING_DIR);
  await recreateDirectoryAsync(HERMES_DSYMS_DEST_DIR);

  const buildTypes: HermesBuildType[] = ['Debug', 'Release'];
  for (const buildType of buildTypes) {
    await buildHermesIosArtifactAsync(buildType, releaseVersion);
    await fs.cp(
      path.join(HERMES_DSYMS_DEST_DIR, buildType, 'hermes.framework.dSYM'),
      path.join(
        rnPackagePath,
        'ReactAndroid',
        'external-artifacts',
        'artifacts',
        `hermes-framework-dSYM-${buildType.toLowerCase()}.tar.gz`,
      ),
    );
  }

  echo('Publishing react-native-artifacts to Maven local repository...');
  await runGradlewTasksAsync([
    ':packages:react-native:ReactAndroid:external-artifacts:publishAllPublicationsToMavenTempLocalRepository',
  ]);

  if (publishToSonatype) {
    const publishType = isSnapshot ? 'Snapshot' : 'Release';

    echo('Publishing react-native-artifacts to Sonatype...');
    await runGradlewTasksAsync([
      ':packages:react-native:ReactAndroid:external-artifacts:publishToSonatype',
      'closeAndReleaseSonatypeStagingRepository',
    ]);

    echo(
      `${publishType} of react-native-artifacts prepared for version ${releaseVersion}`,
    );
  } else {
    console.log(
      'PUBLISH_TO_SONATYPE is false, artifacts will not be published.',
    );
  }
  console.log('Clean up temporary files...');

  await removeDirectoryIfNeededAsync(HERMES_DSYMS_WORKING_DIR);
  await removeDirectoryIfNeededAsync(HERMES_DSYMS_DEST_DIR);

  console.log('Done.');
};

executeScriptAsync();
