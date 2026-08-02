#!/usr/bin/env yarn --silent tsx
'use strict';

/**
 * Download specific build artifacts from a finished EAS workflow run.
 *
 * Defaults to fetching the react-native-tvos NPM packages (`build_npm_packages`)
 * and the RNTester app builds (jobs whose key starts with `build_rntester_`).
 *
 * Each EAS artifact bundle is itself a thin wrapper around one or more inner
 * tarballs (e.g. `build/react-native-1000.0.0.tgz`, `build/rntester-*.tgz`).
 * The script downloads the bundle to a temp directory, extracts it, and copies
 * the inner `.tgz` files to the output directory; the outer bundle never lands
 * on disk in `outDir`.
 *
 * Usage (run from the top of the repository):
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts [<runId>] [--include npm,rntester|all] [--out <dir>]
 *
 * If <runId> is omitted the script lists recent successful runs of the build
 * workflows via `eas workflow:runs` and prompts for one. By default the inner
 * tarballs are written to the current working directory (the repository root
 * in the documented invocation).
 *
 * Examples (from the repository root):
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts             # interactive picker
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts 019dfe87-23b9-765a-8906-3217f3269151
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts <runId> --include rntester
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts <runId> --out /tmp/wf-artifacts
 *
 * The shebang invokes the script via `yarn --silent tsx`, which requires a
 * package.json in the current working directory; the repository root has
 * one, so that is the supported invocation point.
 *
 * Requires: a logged-in `eas` CLI with access to the `rntv-eas-workflows` project.
 */

import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import spawnAsync from '@expo/spawn-async';

import { downloadFileAsync, unpackTarArchiveAsync } from './common';

/**
 * Only these workflows produce the artifacts this script downloads, so the
 * run picker is restricted to them.
 */
const BUILD_WORKFLOW_FILES = ['run-builds.yml', 'run-release-builds.yml'];

/** Runs fetched per workflow before the results are merged. */
const RUNS_PER_WORKFLOW = 10;

type WorkflowJob = {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  artifacts?: { buildArtifactsUrl?: string | null };
  turtleBuild?: { artifacts?: { buildArtifactsUrl?: string | null } };
};

type WorkflowRun = {
  id: string;
  jobs: WorkflowJob[];
};

/** A single entry of `eas workflow:runs --json`. */
type WorkflowRunSummary = {
  id: string;
  status: string;
  gitCommitMessage: string;
  gitCommitHash: string;
  startedAt: string;
  finishedAt: string | null;
  trigger: string;
  workflowFileName: string;
};

type CategoryKey = 'npm' | 'rntester';

const CATEGORY_MATCHERS: Record<CategoryKey, (jobKey: string) => boolean> = {
  npm: (jobKey) => jobKey === 'build_npm_packages',
  rntester: (jobKey) => jobKey.startsWith('build_rntester_'),
};

type ParsedArgs = {
  runId?: string;
  outDir?: string;
  categories: Set<CategoryKey>;
};

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: tools/rntv-workflows/src/download-workflow-artifacts.ts [<runId>] [options]

Run from the top of the repository.

Arguments:
  <runId>                  EAS workflow run ID. If omitted, a picker lists
                           recent successful runs of
                           ${BUILD_WORKFLOW_FILES.join(' and ')}.

Options:
  --out, -o <dir>          Output directory (default: current working directory)
  --include <categories>   Comma-separated subset of: npm,rntester,all (default: all)
  --help, -h               Show this help`);
}

function parseArgs(argv: string[]): ParsedArgs {
  let runId: string | undefined;
  let outDir: string | undefined;
  const categories = new Set<CategoryKey>();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      case '--out':
      case '-o':
        outDir = argv[++i];
        if (!outDir) {
          throw new Error('--out/-o requires a directory argument');
        }
        break;
      case '--include': {
        const value = argv[++i];
        if (!value) {
          throw new Error('--include requires a comma-separated value');
        }
        for (const raw of value.split(',')) {
          const cat = raw.trim();
          if (cat === 'all') {
            categories.add('npm');
            categories.add('rntester');
          } else if (cat === 'npm' || cat === 'rntester') {
            categories.add(cat);
          } else {
            throw new Error(`Unknown --include category: "${cat}"`);
          }
        }
        break;
      }
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

  if (categories.size === 0) {
    categories.add('npm');
    categories.add('rntester');
  }

  return { runId, outDir, categories };
}

function getArtifactUrl(job: WorkflowJob): string | null {
  return (
    job.artifacts?.buildArtifactsUrl ??
    job.turtleBuild?.artifacts?.buildArtifactsUrl ??
    null
  );
}

function getExtensionFromUrl(url: string): string {
  // EAS pre-signs the URL with a long query string; strip it before sniffing the suffix.
  const pathOnly = new URL(url).pathname;
  const match = pathOnly.match(/\.(tar\.gz|tgz|zip|aar|jar|apk|ipa)$/i);
  return match ? `.${match[1]}` : '.bin';
}

async function fetchWorkflowRun(
  runId: string,
  easProjectDir: string,
): Promise<WorkflowRun> {
  // eslint-disable-next-line no-console
  console.log(`Fetching workflow run ${runId}...`);

  const result = await spawnAsync(
    'eas',
    ['workflow:view', runId, '--json', '--non-interactive'],
    { cwd: easProjectDir, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  try {
    return JSON.parse(result.stdout) as WorkflowRun;
  } catch (err) {
    throw new Error(
      `Failed to parse 'eas workflow:view' output as JSON: ${(err as Error).message}`,
    );
  }
}

/**
 * Fetch recent successful runs of the build workflows, newest first. Each
 * workflow is queried separately because `--workflow` takes a single file name.
 */
async function listSuccessfulBuildRunsAsync(
  easProjectDir: string,
): Promise<WorkflowRunSummary[]> {
  const perWorkflow = await Promise.all(
    BUILD_WORKFLOW_FILES.map(async (workflowFileName) => {
      const result = await spawnAsync(
        'eas',
        [
          'workflow:runs',
          '--workflow',
          workflowFileName,
          '--status',
          'SUCCESS',
          '--limit',
          String(RUNS_PER_WORKFLOW),
          '--json',
        ],
        { cwd: easProjectDir, stdio: ['ignore', 'pipe', 'pipe'] },
      );
      try {
        return JSON.parse(result.stdout) as WorkflowRunSummary[];
      } catch (err) {
        throw new Error(
          `Failed to parse 'eas workflow:runs --workflow ${workflowFileName}' output as JSON: ${(err as Error).message}`,
        );
      }
    }),
  );

  return perWorkflow
    .flat()
    .sort((a, b) =>
      (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt),
    );
}

function formatTimestamp(timestamp: string | null): string {
  if (timestamp === null) {
    return ' '.repeat(16);
  }
  // 'YYYY-MM-DD HH:MM' in UTC, fixed width so the list stays aligned.
  return timestamp.slice(0, 16).replace('T', ' ');
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}…`
    : value;
}

function formatRunChoice(run: WorkflowRunSummary): string {
  // 'refs/heads/main@49bf37377a75' -> 'main'
  const ref = run.trigger.replace(/^refs\/heads\//, '').replace(/@[^@]*$/, '');
  return [
    run.workflowFileName.padEnd(22),
    formatTimestamp(run.finishedAt),
    truncate(ref, 24).padEnd(24),
    run.gitCommitHash.slice(0, 8),
    truncate(run.gitCommitMessage.split('\n')[0], 60),
  ].join('  ');
}

async function promptForRunIdAsync(
  runs: WorkflowRunSummary[],
): Promise<string> {
  const indexWidth = String(runs.length).length;

  // eslint-disable-next-line no-console
  console.log(
    `\nRecent successful runs of ${BUILD_WORKFLOW_FILES.join(' and ')}:\n`,
  );
  runs.forEach((run, index) => {
    // eslint-disable-next-line no-console
    console.log(
      `  ${String(index + 1).padStart(indexWidth)}) ${formatRunChoice(run)}`,
    );
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = (
      await rl.question(`\nSelect a run [1-${runs.length}] (default 1): `)
    ).trim();
    const selection = answer === '' ? 1 : Number(answer);

    if (!Number.isInteger(selection) || selection < 1 || selection > runs.length) {
      throw new Error(`Invalid selection: "${answer}"`);
    }

    return runs[selection - 1].id;
  } finally {
    rl.close();
  }
}

async function resolveRunIdAsync(
  easProjectDir: string,
): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error(
      'No run ID given and stdin is not a TTY, so the picker cannot be shown. Pass a run ID explicitly.',
    );
  }

  // eslint-disable-next-line no-console
  console.log('Fetching recent successful build workflow runs...');
  const runs = await listSuccessfulBuildRunsAsync(easProjectDir);

  if (runs.length === 0) {
    throw new Error(
      `No successful runs found for ${BUILD_WORKFLOW_FILES.join(' or ')}.`,
    );
  }

  return promptForRunIdAsync(runs);
}

async function executeScriptAsync(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Resolve the project directory from this script's location so the command
  // works regardless of the current working directory.
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const easProjectDir = path.resolve(scriptDir, '..');

  const runId = args.runId ?? (await resolveRunIdAsync(easProjectDir));

  // When the picker was used, surface the selected ID so the user has it for
  // re-runs / sharing.
  if (!args.runId) {
    // eslint-disable-next-line no-console
    console.log(`Selected workflow run: ${runId}`);
  }

  const workflow = await fetchWorkflowRun(runId, easProjectDir);

  const matched = workflow.jobs.filter(
    (job) =>
      job.type === 'BUILD' &&
      Array.from(args.categories).some((cat) =>
        CATEGORY_MATCHERS[cat](job.key),
      ) &&
      getArtifactUrl(job) !== null,
  );

  if (matched.length === 0) {
    throw new Error(
      `No matching artifacts found in run ${workflow.id} for categories: ${Array.from(args.categories).join(', ')}.`,
    );
  }

  const outDir = args.outDir ? path.resolve(args.outDir) : process.cwd();
  await fs.mkdir(outDir, { recursive: true });

  // eslint-disable-next-line no-console
  console.log(`Downloading ${matched.length} artifact(s) to ${outDir}`);

  for (const job of matched) {
    await extractInnerTarballsForJobAsync(job, outDir);
  }

  // eslint-disable-next-line no-console
  console.log('Done.');
}

async function findInnerTarballsAsync(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findInnerTarballsAsync(full)));
    } else if (entry.isFile() && /\.(tgz|tar\.gz)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

async function extractInnerTarballsForJobAsync(
  job: WorkflowJob,
  outDir: string,
): Promise<void> {
  const url = getArtifactUrl(job)!;
  const outerExt = getExtensionFromUrl(url);
  const outerName = `${job.key}${outerExt}`;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `wf-${job.key}-`));
  try {
    await downloadFileAsync(url, tempDir, outerName);
    await unpackTarArchiveAsync(path.join(tempDir, outerName), tempDir);

    // Don't re-walk the outer archive itself.
    await fs.rm(path.join(tempDir, outerName));

    const innerTarballs = await findInnerTarballsAsync(tempDir);
    if (innerTarballs.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `  ${job.key.padEnd(32)} -> (no .tgz files found inside ${outerName}; skipping)`,
      );
      return;
    }

    for (const tarball of innerTarballs) {
      const fileName = path.basename(tarball);
      const dest = path.join(outDir, fileName);
      // eslint-disable-next-line no-console
      console.log(`  ${job.key.padEnd(32)} -> ${fileName}`);
      await fs.copyFile(tarball, dest);
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

executeScriptAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error(`error: ${message}`);
  process.exit(1);
});
