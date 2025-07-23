import { promises as fs } from 'fs';
import path from 'path';
import { test } from 'shelljs';
import { pathToFileURL } from 'url';

import { RepoConstants, MavenConstants, EasConstants } from './types';

const trueStrings = new Set([
  '1',
  'true',
  'TRUE',
  'True',
  'yes',
  'YES',
  'Yes',
  'y',
  'Y',
]);
const falseStrings = new Set([
  '0',
  'false',
  'FALSE',
  'False',
  'no',
  'NO',
  'No',
  'n',
  'N',
]);

export const boolValueFromString: (
  testString: string,
  defaultValue?: boolean,
) => boolean = (testString, defaultValue) => {
  return defaultValue === true
    ? !falseStrings.has(testString)
    : trueStrings.has(testString);
};

const buildDir = process.env.EAS_BUILD_WORKINGDIR ?? '.';
const sourceDir = path.resolve(buildDir, 'src');
const buildRunner = process.env.EAS_BUILD_RUNNER ?? '';
const buildPlatform = process.env.EAS_BUILD_PLATFORM ?? '';
const isBuildLocal = buildRunner !== 'eas-build';
const isSnapshot = boolValueFromString(process.env.IS_SNAPSHOT);
const publishToSonatype = boolValueFromString(process.env.PUBLISH_TO_SONATYPE);
const pushReleaseToRepo = boolValueFromString(process.env.PUSH_RELEASE_TO_REPO);
const includeVisionOS = boolValueFromString(
  process.env.INCLUDE_VISION_OS,
  true,
);
const includeTVOS = boolValueFromString(process.env.INCLUDE_TV_OS, true);
const repoUrl = process.env.REACT_NATIVE_REPO_URL ?? '';
const repoBranch = process.env.REACT_NATIVE_REPO_BRANCH ?? '';
const releaseBranch = process.env.REACT_NATIVE_RELEASE_BRANCH ?? '';
const releaseVersion = process.env.REACT_NATIVE_RELEASE_VERSION ?? '';
const repoName = path.basename(repoUrl);
const repoPath = path.join(buildDir, repoName);
const rnPackagePath = path.join(repoPath, 'packages', 'react-native');
const vlPackagePath = path.join(repoPath, 'packages', 'virtualized-lists');
const mavenLocalPath = path.join(buildDir, 'maven_local');
const mavenLocalUrl = pathToFileURL(mavenLocalPath).toString();
const mavenArtifactsPath = path.join(buildDir, 'maven_artifacts');

export const repoConstants: RepoConstants = {
  repoUrl,
  repoName,
  repoBranch,
  releaseBranch,
  releaseVersion,
  rnPackagePath,
  vlPackagePath,
  repoPath,
  isSnapshot,
  publishToSonatype,
  pushReleaseToRepo,
  includeVisionOS,
  includeTVOS,
};

export const easConstants: EasConstants = {
  buildDir,
  sourceDir,
  buildRunner,
  buildPlatform,
  isBuildLocal,
  mavenLocalPath,
  mavenLocalUrl,
  mavenArtifactsPath,
};

export const getMavenConstantsAsync: () => Promise<MavenConstants> =
  async () => {
    const { repoPath, rnPackagePath: packagePath } = repoConstants;

    if (!test('-e', repoPath)) {
      throw new Error('RN repo has not yet been cloned.');
    }
    const gradleProperties = await fs.readFile(
      path.resolve(packagePath, 'ReactAndroid', 'gradle.properties'),
      { encoding: 'utf-8' },
    );
    const publishingGroupLine = gradleProperties
      .split('\n')
      .filter((line) => line.startsWith('react.internal.publishingGroup='))[0];
    const namespace = publishingGroupLine
      .replace('react.internal.publishingGroup=', '')
      .replace(/\./g, '/')
      .trim();
    const packageJsonString = await fs.readFile(
      path.resolve(packagePath, 'package.json'),
      { encoding: 'utf-8' },
    );
    const releaseVersion = JSON.parse(packageJsonString).version;

    return {
      namespace,
      releaseVersion,
      pushReleaseToRepo,
    };
  };
