#!/usr/bin/env yarn --silent tsx
'use strict';

/**
 * Start `create-release.yml` on EAS for a successful `run-release-builds.yml`
 * run. The version comes from the run's `release-<version>` branch.
 *
 * Before it starts the workflow, the script checks what already exists:
 *
 *   - No GitHub release: the workflow creates the release, then stages the
 *     npm packages.
 *   - A GitHub release, but a package not published on npm: after you
 *     confirm, the workflow stages the packages from the release's assets.
 *   - Both: there is nothing to do.
 *
 * Usage (from tools/rntv-workflows):
 *   npx tsx src/start-release.ts [<runId>] [options]
 *
 * Requires: `eas` signed in to the project, and `gh` signed in.
 */

import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import spawnAsync from '@expo/spawn-async';

import {
  fetchRunAsync,
  findLatestReleaseRunIdAsync,
  githubReleaseExistsAsync,
  isNpmPublishedAsync,
} from './common/releaseCommands';
import {
  NPM_PACKAGE_NAMES,
  planRelease,
  validateReleaseRun,
  validateRunId,
  versionFromBranch,
} from './common/releaseUtils';

const WORKFLOW_FILE = '.eas/workflows/create-release.yml';

type ParsedArgs = {
  runId?: string;
  ref: string;
  npmTag?: string;
  latest: boolean;
  draft: boolean;
  dryRun: boolean;
};

const easProjectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: npx tsx src/start-release.ts [<runId>] [options]

Run from tools/rntv-workflows.

Arguments:
  <runId>            ID of a successful run-release-builds.yml run
                     (default: the most recent one, after you confirm it)

Options:
  --npm-tag <tag>    npm dist-tag to stage with (default: next for a
                     prerelease, <major>.<minor>-stable otherwise)
  --latest           Mark the GitHub release as "Latest" (stable versions only)
  --draft            Create the GitHub release as a draft
  --dry-run          Stage and create nothing; show what would happen
  --ref <ref>        Git ref whose create-release.yml runs (default: main)
  --help, -h         Show this help`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { ref: 'main', latest: false, draft: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
        break;
      case '--npm-tag':
      case '--ref': {
        const value = argv[++i];
        if (!value) {
          throw new Error(`${arg} requires an argument`);
        }
        if (arg === '--ref') {
          args.ref = value;
        } else {
          args.npmTag = value;
        }
        break;
      }
      case '--latest':
        args.latest = true;
        break;
      case '--draft':
        args.draft = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unrecognized option: ${arg}`);
        }
        if (args.runId !== undefined) {
          throw new Error(`Unexpected positional argument: ${arg}`);
        }
        validateRunId(arg);
        args.runId = arg;
    }
  }
  return args;
}

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

async function confirmAsync(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function resolveRunIdAsync(args: ParsedArgs): Promise<string | null> {
  if (args.runId) {
    return args.runId;
  }
  const runId = await findLatestReleaseRunIdAsync(easProjectDir);
  return (await confirmAsync(`Release the most recent successful run, ${runId}?`))
    ? runId
    : null;
}

async function startWorkflowAsync(inputs: Record<string, string>, ref: string): Promise<void> {
  const inputArgs = Object.entries(inputs).flatMap(([key, value]) => ['-F', `${key}=${value}`]);
  // `eas workflow:run` reads inputs from stdin when stdin is open.
  await spawnAsync(
    'eas',
    ['workflow:run', WORKFLOW_FILE, '--ref', ref, '--non-interactive', ...inputArgs],
    { cwd: easProjectDir, stdio: ['ignore', 'inherit', 'inherit'] },
  );
}

async function executeScriptAsync(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const runId = await resolveRunIdAsync(args);
  if (!runId) {
    log('Nothing started.');
    return;
  }

  const run = await fetchRunAsync(runId, easProjectDir);
  const { branch } = validateReleaseRun(run);
  const version = versionFromBranch(branch);
  log(`Run ${runId} built ${branch}.`);

  const githubReleaseExists = await githubReleaseExistsAsync(version);
  const published = await Promise.all(
    NPM_PACKAGE_NAMES.map((name) => isNpmPublishedAsync(name, version)),
  );
  NPM_PACKAGE_NAMES.forEach((name, i) =>
    log(`  ${name}@${version}: ${published[i] ? 'published' : 'not published'} on npm`),
  );
  log(`  GitHub release v${version}: ${githubReleaseExists ? 'exists' : 'does not exist'}`);

  const plan = planRelease({ githubReleaseExists, npmPublished: published.every(Boolean) });
  if (plan === 'done') {
    log(`${version} is already released on GitHub and npm. Nothing started.`);
    return;
  }
  if (plan === 'stage-from-github-release') {
    if (args.latest || args.draft) {
      throw new Error('The GitHub release exists, so --latest and --draft do not apply.');
    }
    if (!(await confirmAsync('Stage the npm packages from the GitHub release assets?'))) {
      log('Nothing started.');
      return;
    }
  }

  await startWorkflowAsync(
    {
      run_id: runId,
      version,
      ...(args.npmTag ? { npm_tag: args.npmTag } : {}),
      latest: String(args.latest),
      draft: String(args.draft),
      dry_run: String(args.dryRun),
      stage_from_github_release: String(plan === 'stage-from-github-release'),
    },
    args.ref,
  );
}

executeScriptAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error(`error: ${message}`);
  process.exit(1);
});
