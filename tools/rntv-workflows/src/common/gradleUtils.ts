import path from 'path';
import { echo, exit } from 'shelljs';
import spawnAsync from '@expo/spawn-async';

import { easConstants, repoConstants } from './constants';
import { rewriteFileAtPathAsync } from './fileUtils';
import { copyFile } from 'fs/promises';
import glob from 'glob';

const jdkHomePaths = glob.sync(
  '/opt/homebrew/Cellar/openjdk@17/*/libexec/openjdk.jdk/Contents/Home',
);

const jdkHomePath =
  jdkHomePaths.length > 0
    ? jdkHomePaths[0]
    : '/opt/homebrew/Cellar/openjdk@17/17.0.15/libexec/openjdk.jdk/Contents/Home';

export const copyPublishGradleFileAsync = async () => {
  const { rnPackagePath, isSnapshot } = repoConstants;
  const { sourceDir } = easConstants;
  const { mavenLocalUrl } = easConstants;
  const publishGradleSrcPath = path.resolve(sourceDir, 'publish.gradle');
  const publishGradleDestPath = path.resolve(
    rnPackagePath,
    'ReactAndroid',
    'publish.gradle',
  );

  echo(`Rewrite template publish.gradle to ${publishGradleDestPath}...`);
  await copyFile(publishGradleSrcPath, publishGradleDestPath);
  await rewriteFileAtPathAsync(publishGradleDestPath, [
    { original: '$$MAVEN_TEMP_LOCAL_URL$$', replacement: `'${mavenLocalUrl}'` },
    { original: '$$IS_SNAPSHOT$$', replacement: isSnapshot ? 'true' : 'false' },
  ]);

  /*
  const publishGradleText = await fs.readFile(publishGradleSrcPath, {
    encoding: 'utf-8',
  });
  const publishGradleTextFinal = publishGradleText
    .replaceAll('$$MAVEN_TEMP_LOCAL_URL$$', `'${mavenLocalUrl}'`)
    .replaceAll('$$IS_SNAPSHOT$$', isSnapshot ? 'true' : 'false');

  echo(`Write our modified publish.gradle to ${publishGradleDestPath}...`);
  await fs.writeFile(publishGradleDestPath, publishGradleTextFinal, {
    encoding: 'utf-8',
  });
   */
};

export const getGradleEnvAsync: () => Promise<NodeJS.ProcessEnv> = async () => {
  const { buildPlatform, buildRunner } = easConstants;

  if (buildPlatform !== 'ios' || buildRunner !== 'eas-build') {
    echo(`No special env needed for Gradle...`);
    return process.env;
  }

  const JAVA_HOME = jdkHomePath;
  const ANDROID_HOME = '/opt/homebrew/share/android-commandlinetools';
  const pathComponents = [
    ...process.env.PATH.split(':'),
    `${ANDROID_HOME}/cmdline-tools/latest/bin`,
    `${ANDROID_HOME}/build-tools/34.0.0`,
    `/usr/sbin`,
  ];

  echo(
    `Setting up environment for iOS Gradle: JAVA_HOME=${JAVA_HOME}, ANDROID_HOME=${ANDROID_HOME}...`,
  );

  return {
    ...process.env,
    JAVA_HOME,
    ANDROID_HOME,
    PATH: pathComponents.join(':'),
  };
};

export const runGradlewTasksAsync = async (taskNames: string[]) => {
  const { repoPath } = repoConstants;
  const env = await getGradleEnvAsync();
  const gradlewResult = await spawnAsync('./gradlew', taskNames, {
    cwd: repoPath,
    stdio: 'inherit',
    env,
  });
  if (gradlewResult.status) {
    echo('Could not generate artifacts');
    exit(1);
  }
};
