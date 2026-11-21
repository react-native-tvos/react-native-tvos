/**
 * Utilities for creating a release from a run of `run-release-builds.yml`.
 */

export const RELEASE_BUILDS_WORKFLOW_FILE = 'run-release-builds.yml';

/** The fields of `eas workflow:view --json` that a release needs. */
export type ReleaseWorkflowRun = {
  id: string;
  status: string;
  gitCommitHash: string | null;
  requestedGitRef: string | null;
  workflow: { fileName: string };
};

export type NpmTarballs = {
  version: string;
  /** File names, in the order they are staged: dependencies first. */
  fileNames: string[];
};

const STABLE_VERSION_REGEX = /^(\d+)\.(\d+)\.\d+-\d+$/;
const ANY_VERSION_REGEX = /^(\d+)\.(\d+)\.\d+-\S+$/;
const RUN_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Throw unless the run ID has the shape of an EAS workflow run ID (a UUID).
 */
export function validateRunId(runId: string): void {
  if (!RUN_ID_REGEX.test(runId)) {
    throw new Error(
      `"${runId}" is not an EAS workflow run ID. Copy the ID from the run's URL on expo.dev.`,
    );
  }
}

/**
 * Check that the run is a successful run of `run-release-builds.yml` on a
 * release branch, and return the commit it built and its branch.
 */
export function validateReleaseRun(run: ReleaseWorkflowRun): {
  commit: string;
  branch: string;
} {
  if (run.workflow.fileName !== RELEASE_BUILDS_WORKFLOW_FILE) {
    throw new Error(
      `Run ${run.id} is a run of ${run.workflow.fileName}, not ${RELEASE_BUILDS_WORKFLOW_FILE}.`,
    );
  }
  if (run.status !== 'SUCCESS') {
    throw new Error(
      `Run ${run.id} has status ${run.status}. Only a successful run can be released.`,
    );
  }
  const branch = run.requestedGitRef?.replace(/^refs\/heads\//, '') ?? '';
  if (!branch.startsWith('release-')) {
    throw new Error(
      `Run ${run.id} built ${run.requestedGitRef ?? 'an unknown ref'}, not a release-* branch.`,
    );
  }
  if (!run.gitCommitHash) {
    throw new Error(`Run ${run.id} has no commit hash.`);
  }
  return { commit: run.gitCommitHash, branch };
}

/**
 * Find the react-native-tvos and @react-native-tvos/virtualized-lists
 * tarballs among the downloaded artifacts. Both must be present, with the
 * same version.
 */
export function findNpmTarballs(fileNames: string[]): NpmTarballs {
  const virtualizedLists = fileNames
    .map((name) => name.match(/^react-native-tvos-virtualized-lists-(\d.*)\.tgz$/))
    .filter((match) => match !== null);
  const reactNative = fileNames
    .map((name) => name.match(/^react-native-tvos-(\d.*)\.tgz$/))
    .filter((match) => match !== null);

  if (reactNative.length !== 1 || virtualizedLists.length !== 1) {
    throw new Error(
      'Expected one react-native-tvos-<version>.tgz and one ' +
        'react-native-tvos-virtualized-lists-<version>.tgz in the artifacts, found: ' +
        (fileNames.join(', ') || 'no files'),
    );
  }

  const version = reactNative[0][1];
  if (virtualizedLists[0][1] !== version) {
    throw new Error(
      `The npm tarballs have different versions: react-native-tvos ${version}, ` +
        `virtualized-lists ${virtualizedLists[0][1]}.`,
    );
  }

  return {
    version,
    fileNames: [virtualizedLists[0][0], reactNative[0][0]],
  };
}

/**
 * A TV version is stable when its suffix is only a number, as in `0.88.1-0`.
 * Any other suffix, as in `0.89.0-0rc2`, is a prerelease.
 */
export function isPrerelease(version: string): boolean {
  if (!ANY_VERSION_REGEX.test(version)) {
    throw new Error(`"${version}" is not a react-native-tvos version, such as 0.88.1-0.`);
  }
  return !STABLE_VERSION_REGEX.test(version);
}

/**
 * The npm dist-tag a version is staged with when none is given: `next` for a
 * prerelease and `<major>.<minor>-stable` for a stable version. `latest` is
 * never a default, because a patch to an older line must not take it.
 */
export function defaultNpmTag(version: string): string {
  if (isPrerelease(version)) {
    return 'next';
  }
  const [, major, minor] = version.match(STABLE_VERSION_REGEX)!;
  return `${major}.${minor}-stable`;
}

/**
 * Compare dotted numeric versions, such as `11.21.2` and `11.15.0`.
 */
export function isVersionAtLeast(version: string, minimum: string): boolean {
  const parts = version.trim().split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);
  for (let i = 0; i < minimumParts.length; i++) {
    const part = parts[i] ?? 0;
    if (Number.isNaN(part)) {
      return false;
    }
    if (part !== minimumParts[i]) {
      return part > minimumParts[i];
    }
  }
  return true;
}
