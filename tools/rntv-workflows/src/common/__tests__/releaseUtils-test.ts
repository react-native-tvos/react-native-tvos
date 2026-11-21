import {
  defaultNpmTag,
  findNpmTarballs,
  isPrerelease,
  isVersionAtLeast,
  ReleaseWorkflowRun,
  validateReleaseRun,
  validateRunId,
} from '../releaseUtils';

const successfulRun: ReleaseWorkflowRun = {
  id: '01a1f713-42a2-7bef-a111-fae51ed4257a',
  status: 'SUCCESS',
  gitCommitHash: '67960630e9073201dff7f28e58a49225a5815c44',
  requestedGitRef: 'refs/heads/release-0.89.0-0rc2',
  workflow: { fileName: 'run-release-builds.yml' },
};

describe('validateRunId', () => {
  test('accepts a UUID', () => {
    expect(() => validateRunId(successfulRun.id)).not.toThrow();
  });
  test('rejects anything else', () => {
    expect(() => validateRunId('')).toThrow('is not an EAS workflow run ID');
    expect(() => validateRunId('01a1f713; rm -rf /')).toThrow(
      'is not an EAS workflow run ID',
    );
  });
});

describe('validateReleaseRun', () => {
  test('returns the commit and branch of a successful release run', () => {
    expect(validateReleaseRun(successfulRun)).toEqual({
      commit: '67960630e9073201dff7f28e58a49225a5815c44',
      branch: 'release-0.89.0-0rc2',
    });
  });
  test('rejects a run of another workflow', () => {
    expect(() =>
      validateReleaseRun({
        ...successfulRun,
        workflow: { fileName: 'run-builds.yml' },
      }),
    ).toThrow('is a run of run-builds.yml');
  });
  test('rejects a run that did not succeed', () => {
    expect(() =>
      validateReleaseRun({ ...successfulRun, status: 'FAILURE' }),
    ).toThrow('has status FAILURE');
  });
  test('rejects a run that did not build a release branch', () => {
    expect(() =>
      validateReleaseRun({ ...successfulRun, requestedGitRef: 'refs/heads/main' }),
    ).toThrow('not a release-* branch');
    expect(() =>
      validateReleaseRun({ ...successfulRun, requestedGitRef: null }),
    ).toThrow('an unknown ref');
  });
  test('rejects a run with no commit', () => {
    expect(() =>
      validateReleaseRun({ ...successfulRun, gitCommitHash: null }),
    ).toThrow('has no commit hash');
  });
});

describe('findNpmTarballs', () => {
  const assets = [
    'react-native-tvos-0.89.0-0rc2.tgz',
    'react-native-tvos-virtualized-lists-0.89.0-0rc2.tgz',
    'rntester-0.89.0-0rc2-appletv-release.tgz',
  ];

  test('finds both tarballs, dependency first', () => {
    expect(findNpmTarballs(assets)).toEqual({
      version: '0.89.0-0rc2',
      fileNames: [
        'react-native-tvos-virtualized-lists-0.89.0-0rc2.tgz',
        'react-native-tvos-0.89.0-0rc2.tgz',
      ],
    });
  });
  test('fails when a tarball is missing', () => {
    expect(() => findNpmTarballs([assets[0], assets[2]])).toThrow(
      'Expected one react-native-tvos-<version>.tgz',
    );
    expect(() => findNpmTarballs([])).toThrow('found: no files');
  });
  test('fails when the versions differ', () => {
    expect(() =>
      findNpmTarballs([
        'react-native-tvos-0.89.0-0rc2.tgz',
        'react-native-tvos-virtualized-lists-0.89.0-0rc1.tgz',
      ]),
    ).toThrow('different versions');
  });
});

describe('isPrerelease and defaultNpmTag', () => {
  test('a numeric suffix is stable', () => {
    expect(isPrerelease('0.88.1-0')).toBe(false);
    expect(defaultNpmTag('0.88.1-0')).toBe('0.88-stable');
    expect(defaultNpmTag('0.85.3-3')).toBe('0.85-stable');
  });
  test('any other suffix is a prerelease', () => {
    expect(isPrerelease('0.89.0-0rc2')).toBe(true);
    expect(isPrerelease('0.75.1-0test2')).toBe(true);
    expect(defaultNpmTag('0.89.0-0rc2')).toBe('next');
  });
  test('a version with no suffix is rejected', () => {
    expect(() => isPrerelease('0.89.0')).toThrow('is not a react-native-tvos version');
  });
});

describe('isVersionAtLeast', () => {
  test('compares each part as a number', () => {
    expect(isVersionAtLeast('11.21.2', '11.15.0')).toBe(true);
    expect(isVersionAtLeast('11.15.0', '11.15.0')).toBe(true);
    expect(isVersionAtLeast('12.0.0\n', '11.15.0')).toBe(true);
    expect(isVersionAtLeast('11.9.0', '11.15.0')).toBe(false);
    expect(isVersionAtLeast('10.9.8', '11.15.0')).toBe(false);
  });
  test('rejects output that is not a version', () => {
    expect(isVersionAtLeast('not-a-version', '11.15.0')).toBe(false);
  });
});
