/**
 * Commands that `start-release.ts` and `release-workflow-run.ts` share: they
 * read the release state from EAS, GitHub and npm.
 */

import spawnAsync from '@expo/spawn-async';

import type { ReleaseWorkflowRun } from './releaseUtils';
import { RELEASE_BUILDS_WORKFLOW_FILE, RELEASE_REPO } from './releaseUtils';

export const NPM_REGISTRY = 'https://registry.npmjs.org/';

function stderrOf(err: unknown): string {
  return String((err as { stderr?: string }).stderr ?? '');
}

export async function fetchRunAsync(
  runId: string,
  easProjectDir: string,
): Promise<ReleaseWorkflowRun> {
  const result = await spawnAsync(
    'eas',
    ['workflow:view', runId, '--json', '--non-interactive'],
    { cwd: easProjectDir, stdio: ['ignore', 'pipe', 'inherit'] },
  );
  try {
    return JSON.parse(result.stdout) as ReleaseWorkflowRun;
  } catch (err) {
    throw new Error(
      `Failed to parse 'eas workflow:view ${runId}' output as JSON: ${(err as Error).message}`,
    );
  }
}

/** The ID of the most recent successful run of `run-release-builds.yml`. */
export async function findLatestReleaseRunIdAsync(easProjectDir: string): Promise<string> {
  const result = await spawnAsync(
    'eas',
    [
      'workflow:runs',
      '--workflow',
      RELEASE_BUILDS_WORKFLOW_FILE,
      '--status',
      'SUCCESS',
      '--limit',
      '1',
      '--json',
    ],
    { cwd: easProjectDir, stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const runs = JSON.parse(result.stdout) as { id: string }[];
  if (runs.length === 0) {
    throw new Error(`No successful run of ${RELEASE_BUILDS_WORKFLOW_FILE} found.`);
  }
  return runs[0].id;
}

export async function githubReleaseExistsAsync(version: string): Promise<boolean> {
  try {
    await spawnAsync('gh', ['release', 'view', `v${version}`, '--repo', RELEASE_REPO, '--json', 'tagName']);
    return true;
  } catch (err) {
    if (stderrOf(err).includes('release not found')) {
      return false;
    }
    throw new Error(`Failed to look up GitHub release v${version}: ${stderrOf(err).trim()}`);
  }
}

/**
 * Whether `name@version` is published on npm. A staged version that is not
 * yet approved is not published.
 */
export async function isNpmPublishedAsync(name: string, version: string): Promise<boolean> {
  try {
    const { stdout } = await spawnAsync('npm', [
      'view',
      `${name}@${version}`,
      'version',
      '--registry',
      NPM_REGISTRY,
    ]);
    return stdout.trim() === version;
  } catch (err) {
    if (stderrOf(err).includes('E404')) {
      return false;
    }
    throw new Error(`Failed to look up ${name}@${version} on npm: ${stderrOf(err).trim()}`);
  }
}
