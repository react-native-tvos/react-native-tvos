#!/usr/bin/env yarn --silent tsx
'use strict';

/**
 * Release the artifacts of a successful `run-release-builds.yml` run:
 *
 *   1. Check that the run succeeded and built a `release-*` branch.
 *   2. Download its npm and RNTester tarballs with
 *      `download-workflow-artifacts.ts`.
 *   3. Stage `@react-native-tvos/virtualized-lists` and `react-native-tvos`
 *      on npm with `npm stage publish`. A maintainer approves each staged
 *      version with 2FA before it goes live.
 *   4. Create the tag and GitHub release with `create-release.ts`, on the
 *      commit the run built, with every tarball as an asset.
 *
 * Staging comes first, so a failure there stops the run before anything
 * public is created.
 *
 * Usage (from tools/rntv-workflows):
 *   npx tsx src/release-workflow-run.ts <runId> [options]
 *
 * Requires: `eas` with access to the run, npm 11.15.0 or later, `gh`
 * with write access to the repo (`GITHUB_TOKEN`), and `NPM_TOKEN`, a
 * stage-only npm token for both packages. With `--dry-run`, `gh` and
 * `NPM_TOKEN` are not needed.
 */

import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import spawnAsync from '@expo/spawn-async';

import {
  defaultNpmTag,
  findNpmTarballs,
  isPrerelease,
  isVersionAtLeast,
  ReleaseWorkflowRun,
  validateReleaseRun,
  validateRunId,
} from './common/releaseUtils';

const NPM_REGISTRY = 'https://registry.npmjs.org/';
const MINIMUM_NPM_VERSION = '11.15.0';

type ParsedArgs = {
  runId: string;
  npmTag?: string;
  latest: boolean;
  draft: boolean;
  dryRun: boolean;
};

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: npx tsx src/release-workflow-run.ts <runId> [options]

Run from tools/rntv-workflows.

Arguments:
  <runId>            ID of a successful run-release-builds.yml run

Options:
  --npm-tag <tag>    npm dist-tag to stage with (default: next for a
                     prerelease, <major>.<minor>-stable otherwise)
  --latest           Mark the GitHub release as "Latest" (stable versions only)
  --draft            Create the GitHub release as a draft
  --dry-run          Stage and create nothing; show what would happen
  --help, -h         Show this help`);
}

function parseArgs(argv: string[]): ParsedArgs {
  let runId: string | undefined;
  let npmTag: string | undefined;
  let latest = false;
  let draft = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
        break;
      case '--npm-tag':
        npmTag = argv[++i];
        if (!npmTag) {
          throw new Error('--npm-tag requires an argument');
        }
        break;
      case '--latest':
        latest = true;
        break;
      case '--draft':
        draft = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unrecognized option: ${arg}`);
        }
        if (runId !== undefined) {
          throw new Error(`Unexpected positional argument: ${arg}`);
        }
        runId = arg;
    }
  }

  if (!runId) {
    printUsage();
    throw new Error('A run ID is required.');
  }
  validateRunId(runId);
  return { runId, npmTag, latest, draft, dryRun };
}

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

async function fetchRunAsync(
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

async function checkNpmVersionAsync(): Promise<void> {
  const { stdout } = await spawnAsync('npm', ['--version']);
  if (!isVersionAtLeast(stdout, MINIMUM_NPM_VERSION)) {
    throw new Error(
      `npm stage publish needs npm ${MINIMUM_NPM_VERSION} or later; found ${stdout.trim()}. ` +
        'Install a newer npm, for example with `npm install -g npm@11`.',
    );
  }
}

/**
 * Write an npm config that points at the public registry, with the token
 * when there is one. EAS images set a cache as the default registry, and
 * staging must not go there.
 */
async function writeNpmConfigAsync(
  dir: string,
  dryRun: boolean,
): Promise<string> {
  const token = process.env.NPM_TOKEN;
  if (!token && !dryRun) {
    throw new Error(
      'NPM_TOKEN is not set. Add a stage-only npm token for both packages as the ' +
        'NPM_TOKEN secret of the EAS project.',
    );
  }
  const lines = [`registry=${NPM_REGISTRY}`];
  if (token) {
    lines.push(`//registry.npmjs.org/:_authToken=${token}`);
  }
  const configPath = path.join(dir, 'npmrc');
  await fs.writeFile(configPath, `${lines.join('\n')}\n`, { mode: 0o600 });
  return configPath;
}

async function executeScriptAsync(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const easProjectDir = path.resolve(scriptDir, '..');

  log(`Fetching workflow run ${args.runId}...`);
  const run = await fetchRunAsync(args.runId, easProjectDir);
  const { commit, branch } = validateReleaseRun(run);
  log(`Run ${run.id} built ${branch} at ${commit}.`);

  await checkNpmVersionAsync();

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rntv-release-'));
  try {
    const artifactsDir = path.join(workDir, 'artifacts');
    await spawnAsync(
      'npx',
      [
        'tsx',
        path.join(scriptDir, 'download-workflow-artifacts.ts'),
        args.runId,
        '--out',
        artifactsDir,
      ],
      { cwd: easProjectDir, stdio: 'inherit' },
    );

    const tarballs = findNpmTarballs(await fs.readdir(artifactsDir));
    const { version } = tarballs;
    if (branch !== `release-${version}`) {
      throw new Error(
        `The run built ${branch}, but the npm tarballs have version ${version}.`,
      );
    }

    const prerelease = isPrerelease(version);
    if (args.latest && prerelease) {
      throw new Error(`${version} is a prerelease, so it cannot be the "Latest" release.`);
    }
    const npmTag = args.npmTag ?? defaultNpmTag(version);

    const npmConfig = await writeNpmConfigAsync(workDir, args.dryRun);
    for (const fileName of tarballs.fileNames) {
      log(`\nStaging ${fileName} with tag ${npmTag}...`);
      await spawnAsync(
        'npm',
        [
          'stage',
          'publish',
          path.join(artifactsDir, fileName),
          '--tag',
          npmTag,
          '--access',
          'public',
          '--userconfig',
          npmConfig,
          ...(args.dryRun ? ['--dry-run'] : []),
        ],
        { stdio: 'inherit' },
      );
    }

    log(`\nCreating the GitHub release for ${version}...`);
    await spawnAsync(
      'npx',
      [
        'tsx',
        path.join(scriptDir, 'create-release.ts'),
        artifactsDir,
        '--version',
        version,
        '--target',
        commit,
        ...(prerelease ? ['--prerelease'] : []),
        ...(args.latest ? ['--latest'] : []),
        ...(args.draft ? ['--draft'] : []),
        ...(args.dryRun ? ['--dry-run'] : []),
      ],
      { cwd: easProjectDir, stdio: 'inherit' },
    );

    log(
      `\n${args.dryRun ? 'Dry run done' : 'Done'}. Approve the staged versions with 2FA:\n` +
        `  npm stage list react-native-tvos\n` +
        `  npm stage list @react-native-tvos/virtualized-lists\n` +
        `  npm stage approve <stage-id>   (or approve on npmjs.com)`,
    );
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

executeScriptAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error(`error: ${message}`);
  process.exit(1);
});
