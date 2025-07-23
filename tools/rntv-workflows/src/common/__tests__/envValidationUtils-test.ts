import { validateForGitHub, validateForMaven } from '../envValidationUtils';

describe('envValidationUtils tests', () => {
  describe('Maven validation tests', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env = {};
    });
    test('Maven env validation with no env set', () => {
      try {
        validateForMaven();
      } catch (e) {
        const errorMessages = `${e}`.substring(7).split('\n');
        // console.log(JSON.stringify(errorMessages, null, 2));
        expect(errorMessages.length).toEqual(6);
      }
    });
    test('Maven env validation succeeds', () => {
      process.env.REACT_NATIVE_REPO_URL = 'https://url';
      process.env.REACT_NATIVE_REPO_BRANCH = 'main';
      process.env.REACT_NATIVE_RELEASE_BRANCH = 'release-0.75.2';
      process.env.REACT_NATIVE_RELEASE_VERSION = '0.75.2';
      process.env.ORG_GRADLE_PROJECT_SIGNING_KEY = 'key';
      process.env.ORG_GRADLE_PROJECT_SIGNING_PWD = 'pwd';
      expect(validateForMaven).not.toThrow(Error);
    });
    test('Maven env validation fails if PUBLISH_TO_SONATYPE set', () => {
      process.env.REACT_NATIVE_REPO_URL = 'https://url';
      process.env.REACT_NATIVE_REPO_BRANCH = 'main';
      process.env.REACT_NATIVE_RELEASE_BRANCH = 'release-0.75.2';
      process.env.REACT_NATIVE_RELEASE_VERSION = '0.75.2';
      process.env.ORG_GRADLE_PROJECT_SIGNING_KEY = 'key';
      process.env.ORG_GRADLE_PROJECT_SIGNING_PWD = 'pwd';
      process.env.PUBLISH_TO_SONATYPE = 'true';
      expect(validateForMaven).toThrow(Error);
    });
    test('Maven env validation succeeds if PUBLISH_TO_SONATYPE set', () => {
      process.env.REACT_NATIVE_REPO_URL = 'https://url';
      process.env.REACT_NATIVE_REPO_BRANCH = 'main';
      process.env.REACT_NATIVE_RELEASE_BRANCH = 'release-0.75.2';
      process.env.REACT_NATIVE_RELEASE_VERSION = '0.75.2';
      process.env.ORG_GRADLE_PROJECT_SIGNING_KEY = 'key';
      process.env.ORG_GRADLE_PROJECT_SIGNING_PWD = 'pwd';
      process.env.PUBLISH_TO_SONATYPE = 'true';
      process.env.ORG_GRADLE_PROJECT_SONATYPE_USERNAME = 'user';
      process.env.ORG_GRADLE_PROJECT_SONATYPE_PASSWORD = 'pwd';
      expect(validateForMaven).not.toThrow(Error);
    });
  });
  describe('Github validation tests', () => {
    beforeEach(() => {
      jest.resetModules();
      process.env = {};
    });
    test('Github env validation with no env set', () => {
      try {
        validateForGitHub();
      } catch (e) {
        const errorMessages = `${e}`.substring(7).split('\n');
        // console.log(JSON.stringify(errorMessages, null, 2));
        expect(errorMessages.length).toEqual(10);
      }
    });
    test('Github env validation with some env set', () => {
      process.env.REACT_NATIVE_REPO_URL = 'https://url';
      process.env.REACT_NATIVE_REPO_BRANCH = 'main';
      process.env.REACT_NATIVE_RELEASE_BRANCH = 'release-0.75.2';
      process.env.REACT_NATIVE_RELEASE_VERSION = '0.75.2';
      process.env.GITHUB_USER = 'bogus';
      process.env.GITHUB_TOKEN = 'bogus';
      process.env.GIT_AUTHOR_NAME = 'bogus';
      process.env.GIT_AUTHOR_EMAIL = 'bogus';
      // process.env.GIT_COMMITTER_NAME = 'bogus';
      // process.env.GIT_COMMITTER_EMAIL = 'bogus';
      try {
        validateForGitHub();
      } catch (e) {
        const errorMessages = `${e}`.substring(7).split('\n');
        // console.log(JSON.stringify(errorMessages, null, 2));
        expect(errorMessages.length).toEqual(2);
      }
    });
    test('Github env validation succeeds', () => {
      process.env.REACT_NATIVE_REPO_URL = 'https://url';
      process.env.REACT_NATIVE_REPO_BRANCH = 'main';
      process.env.REACT_NATIVE_RELEASE_BRANCH = 'release-0.75.2';
      process.env.REACT_NATIVE_RELEASE_VERSION = '0.75.2';
      process.env.GITHUB_USER = 'bogus';
      process.env.GITHUB_TOKEN = 'bogus';
      process.env.GIT_AUTHOR_NAME = 'bogus';
      process.env.GIT_AUTHOR_EMAIL = 'bogus';
      process.env.GIT_COMMITTER_NAME = 'bogus';
      process.env.GIT_COMMITTER_EMAIL = 'bogus';
      expect(validateForGitHub).not.toThrow(Error);
    });
  });
});
