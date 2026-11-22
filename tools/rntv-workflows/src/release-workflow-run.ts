#!/usr/bin/env yarn --silent tsx
'use strict';

/**
 * The two release steps of `create-release.yml`. `start-release.ts` starts that
 * workflow; run this script by hand only to repeat one step.
 *
 *   github-release  Download the tarballs of a successful
 *                   `run-release-builds.yml` run and create the tag and
 *                   GitHub release with `create-release.ts`, on the commit
 *                   the run built.
 *   npm-stage       Stage `@react-native-tvos/virtualized-lists` and
 *                   `react-native-tvos` on npm with `npm stage publish`,
 *                   from the run or, with --from-github-release, from the
 *                   assets of the GitHub release. A package version that is
 *                   already published is skipped. A maintainer approves each
 *                   staged version with 2FA before it goes live.
 *
 * Both steps first check that the run succeeded and built
 * `release-<version>`, and that its tarballs have that version.
 *
 * Usage (from tools/rntv-workflows):
 *   npx tsx src/release-workflow-run.ts <step> <runId> --version <version> [options]
 *
 * Requires: `eas` with access to the run, and `gh` with write access to the
 * repo (`GITHUB_TOKEN`). npm-stage also requires npm 11.15.0 or later and
 * `NPM_TOKEN`, a stage-only npm token for both packages. With --dry-run,
 * `NPM_TOKEN` is not needed and nothing is staged or created.
 */

import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import spawnAsync from '@expo/spawn-async';

import {
  fetchRunAsync,
  isNpmPublishedAsync,
  NPM_REGISTRY,
} from './common/releaseCommands';
import type { NpmTarballs } from './common/releaseUtils';
import {
  defaultNpmTag,
  findNpmTarballs,
  formatCommand,
  isPrerelease,
  isVersionAtLeast,
  RELEASE_REPO,
  validateReleaseRun,
  validateRunId,
} from './common/releaseUtils';

const MINIMUM_NPM_VERSION = '11.15.0';
const STEPS = ['github-release', 'npm-stage'] as const;
type Step = (typeof STEPS)[number];

type ParsedArgs = {
  step: Step;
  runId: string;
  version: string;
  npmTag?: string;
  fromGithubRelease: boolean;
  latest: boolean;
  draft: boolean;
  dryRun: boolean;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const easProjectDir = path.resolve(scriptDir, '..');

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: npx tsx src/release-workflow-run.ts <step> <runId> --version <version> [options]

Run from tools/rntv-workflows. start-release.ts starts both steps on EAS.

Steps:
  github-release           Create the tag and GitHub release
  npm-stage                Stage the npm packages

Arguments:
  <runId>                  ID of a successful run-release-builds.yml run
  --version <version>      The version the run built, such as 0.89.0-0rc2

Options for github-release:
  --draft                  Create the GitHub release as a draft

Options for npm-stage:
  --npm-tag <tag>          npm dist-tag to stage with (default: next for a
                           prerelease, <major>.<minor>-stable otherwise)
  --from-github-release    Stage the tarballs of the GitHub release, not the run's

Options:
  --latest                 Mark the GitHub release as "Latest", and list the
                           npm "latest" tag as a step after approval (stable
                           versions only)
  --dry-run                Stage and create nothing; show what would happen
  --help, -h               Show this help`);
}

function requireValue(option: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${option} requires an argument`);
  }
  return value;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  let version: string | undefined;
  let npmTag: string | undefined;
  let fromGithubRelease = false;
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
      case '--version':
        version = requireValue(arg, argv[++i]);
        break;
      case '--npm-tag':
        npmTag = requireValue(arg, argv[++i]);
        break;
      case '--from-github-release':
        fromGithubRelease = true;
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
        positionals.push(arg);
    }
  }

  const [step, runId, ...rest] = positionals;
  if (!STEPS.includes(step as Step) || !runId || rest.length > 0 || !version) {
    printUsage();
    throw new Error('A step, a run ID and --version are required.');
  }
  validateRunId(runId);
  if (step === 'github-release' && (npmTag !== undefined || fromGithubRelease)) {
    throw new Error('--npm-tag and --from-github-release are options of npm-stage.');
  }
  if (step === 'npm-stage' && draft) {
    throw new Error('--draft is an option of github-release.');
  }
  return {
    step: step as Step,
    runId,
    version,
    npmTag,
    fromGithubRelease,
    latest,
    draft,
    dryRun,
  };
}

function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message);
}

/** Check the run, and return the commit it built. */
async function checkRunAsync(args: ParsedArgs): Promise<string> {
  log(`Fetching workflow run ${args.runId}...`);
  const run = await fetchRunAsync(args.runId, easProjectDir);
  const { commit, branch } = validateReleaseRun(run);
  if (branch !== `release-${args.version}`) {
    throw new Error(`Run ${run.id} built ${branch}, not release-${args.version}.`);
  }
  log(`Run ${run.id} built ${branch} at ${commit}.`);
  return commit;
}

async function readTarballsAsync(artifactsDir: string, version: string): Promise<NpmTarballs> {
  const tarballs = findNpmTarballs(await fs.readdir(artifactsDir));
  if (tarballs.version !== version) {
    throw new Error(`The npm tarballs have version ${tarballs.version}, not ${version}.`);
  }
  return tarballs;
}

async function downloadRunArtifactsAsync(
  args: ParsedArgs,
  artifactsDir: string,
  include: string,
): Promise<void> {
  await spawnAsync(
    'npx',
    [
      'tsx',
      path.join(scriptDir, 'download-workflow-artifacts.ts'),
      args.runId,
      '--include',
      include,
      '--out',
      artifactsDir,
      '--non-interactive',
    ],
    { cwd: easProjectDir, stdio: 'inherit' },
  );
}

async function createGithubReleaseAsync(
  args: ParsedArgs,
  commit: string,
  artifactsDir: string,
): Promise<void> {
  await downloadRunArtifactsAsync(args, artifactsDir, 'all');
  await readTarballsAsync(artifactsDir, args.version);

  const prerelease = isPrerelease(args.version);

  log(`\nCreating the GitHub release for ${args.version}...`);
  await spawnAsync(
    'npx',
    [
      'tsx',
      path.join(scriptDir, 'create-release.ts'),
      '--out',
      artifactsDir,
      '--non-interactive',
      '--version',
      args.version,
      '--target',
      commit,
      ...(prerelease ? ['--prerelease'] : []),
      ...(args.latest ? ['--latest'] : []),
      ...(args.draft ? ['--draft'] : []),
      ...(args.dryRun ? ['--dry-run'] : []),
    ],
    { cwd: easProjectDir, stdio: 'inherit' },
  );
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
async function writeNpmConfigAsync(dir: string, dryRun: boolean): Promise<string> {
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

async function stageNpmPackagesAsync(
  args: ParsedArgs,
  workDir: string,
  artifactsDir: string,
): Promise<void> {
  await checkNpmVersionAsync();
  if (args.fromGithubRelease) {
    log(`Downloading the npm tarballs of GitHub release v${args.version}...`);
    await spawnAsync(
      'gh',
      [
        'release',
        'download',
        `v${args.version}`,
        '--repo',
        RELEASE_REPO,
        '--pattern',
        'react-native-tvos-*.tgz',
        '--dir',
        artifactsDir,
      ],
      { stdio: 'inherit' },
    );
  } else {
    await downloadRunArtifactsAsync(args, artifactsDir, 'npm');
  }
  const { packages } = await readTarballsAsync(artifactsDir, args.version);
  const npmTag = args.npmTag ?? defaultNpmTag(args.version);
  const npmConfig = await writeNpmConfigAsync(workDir, args.dryRun);

  for (const { name, fileName } of packages) {
    if (await isNpmPublishedAsync(name, args.version)) {
      log(`\n${name}@${args.version} is already published; skipping it.`);
      continue;
    }
    log(`\nStaging ${name}@${args.version} with tag ${npmTag}...`);
    const npmArgs = [
      'stage',
      'publish',
      path.join(artifactsDir, fileName),
      '--tag',
      npmTag,
      '--access',
      'public',
      '--userconfig',
      npmConfig,
    ];
    if (args.dryRun) {
      log(`--dry-run: would run:\n  ${formatCommand('npm', npmArgs)}`);
      npmArgs.push('--dry-run');
    }
    await spawnAsync('npm', npmArgs, { stdio: 'inherit' });
  }

  log(
    `\n${args.dryRun ? 'Dry run done' : 'Done'}. To finish the release:\n` +
      `  1. Approve the staged npm versions with 2FA:\n` +
      `       npm stage list react-native-tvos\n` +
      `       npm stage list @react-native-tvos/virtualized-lists\n` +
      `       npm stage approve <stage-id>   (or approve on npmjs.com)\n` +
      `  2. Sign in to Sonatype and publish the Maven artifacts that\n` +
      `     run-release-builds.yml staged for ${args.version}.` +
      (args.latest
        ? `\n  3. After you approve, make this version the npm "latest":\n` +
          packages
            .map(({ name }) => `       npm dist-tag add ${name}@${args.version} latest`)
            .join('\n')
        : ''),
  );
}

async function executeScriptAsync(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.latest && isPrerelease(args.version)) {
    throw new Error(`${args.version} is a prerelease, so it cannot be the latest release.`);
  }
  const commit = await checkRunAsync(args);

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rntv-release-'));
  try {
    const artifactsDir = path.join(workDir, 'artifacts');
    await fs.mkdir(artifactsDir);
    if (args.step === 'github-release') {
      await createGithubReleaseAsync(args, commit, artifactsDir);
    } else {
      await stageNpmPackagesAsync(args, workDir, artifactsDir);
    }
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
