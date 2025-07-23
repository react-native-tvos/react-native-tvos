/**
 * Utilities for validating the environment settings
 */

import { boolValueFromString } from './constants';

/*
These environment variables must always be set:
  REACT_NATIVE_REPO_URL
    e.g. https://github.com/facebook/react-native
      or https://github.com/react-native-tvos/react-native-tvos
  REACT_NATIVE_REPO_BRANCH
    e.g. main, 0.74-stable, doug/ci
  REACT_NATIVE_RELEASE_BRANCH
    e.g. release-0.75.2-0, release-0.76.0-0rc0
  REACT_NATIVE_RELEASE_VERSION
    e.g. 0.75.2, 0.75.2-0, 0.76.0-0rc0
 */

const missingEnvironmentErrorMessage = (envVariableName: string) =>
  `This build profile requires that ${envVariableName} be set as an environment variable.`;

const missingSecretErrorMessage = (secretName: string) =>
  `This build profile requires that ${secretName} be set as a secret environment variable.`;

const requiredEnvVariables = [
  'REACT_NATIVE_REPO_URL',
  'REACT_NATIVE_REPO_BRANCH',
  'REACT_NATIVE_RELEASE_BRANCH',
  'REACT_NATIVE_RELEASE_VERSION',
];

const missingEnvVariables = () => {
  const errorMessages: string[] = [];
  for (const name of requiredEnvVariables) {
    if (!(name in process.env)) {
      errorMessages.push(missingEnvironmentErrorMessage(name));
    }
  }
  return errorMessages;
};

export const missingSecrets = (secretNames: string[]) => {
  const errorMessages: string[] = [];
  for (const name of secretNames) {
    if (!(name in process.env)) {
      errorMessages.push(missingSecretErrorMessage(name));
    }
  }
  return errorMessages;
};

/**
 * Throw error if any required env variables are missing
 */
export const validateEnv = () => {
  const errorMessages = missingEnvVariables();
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'));
  }
};

/**
 * Validate the environment for building Maven artifacts
 */
export const validateForMaven = () => {
  const publishToSonatype = boolValueFromString(
    process.env.PUBLISH_TO_SONATYPE,
  );
  const errorMessages = [
    ...missingEnvVariables(),
    ...missingSecrets([
      'ORG_GRADLE_PROJECT_SIGNING_KEY',
      'ORG_GRADLE_PROJECT_SIGNING_PWD',
    ]),
    ...(publishToSonatype
      ? missingSecrets([
          'ORG_GRADLE_PROJECT_SONATYPE_USERNAME',
          'ORG_GRADLE_PROJECT_SONATYPE_PASSWORD',
        ])
      : []),
  ];
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'));
  }
};

/**
 * Validate the environment for Github operations
 */
export const validateForGitHub = () => {
  const errorMessages = [
    ...missingEnvVariables(),
    ...missingSecrets([
      'GITHUB_USER',
      'GITHUB_TOKEN',
      'GIT_AUTHOR_NAME',
      'GIT_AUTHOR_EMAIL',
      'GIT_COMMITTER_NAME',
      'GIT_COMMITTER_EMAIL',
    ]),
  ];
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'));
  }
};
