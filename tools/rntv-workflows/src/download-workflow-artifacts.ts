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
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts [<runId>] [--include npm,rntester|all] [--out <dir>] [--release] [--non-interactive]
 *
 * If <runId> is omitted the script lists recent successful runs of the build
 * workflows via `eas workflow:runs` and prompts for one. With
 * `--non-interactive` it never prompts, so <runId> is required. By default the inner
 * tarballs are written to the current working directory (the repository root
 * in the documented invocation).
 *
 * Examples (from the repository root):
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts             # interactive picker
 *   tools/rntv-workflows/src/download-workflow-artifacts.ts --release   # picker of release builds only
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
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import spawnAsync from '@expo/spawn-async';

import { downloadFileAsync, unpackTarArchiveAsync } from './common';
import { RELEASE_BUILDS_WORKFLOW_FILE } from './common/releaseUtils';
import { pickRunIdAsync } from './common/runPicker';

/**
 * Only these workflows produce the artifacts this script downloads, so the
 * run picker is restricted to them. `run-builds.yml` builds main and PRs.
 */
const BUILD_WORKFLOW_FILES = ['run-builds.yml', RELEASE_BUILDS_WORKFLOW_FILE];

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
  workflow: { fileName: string };
  jobs: WorkflowJob[];
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
  /** Only release builds: the picker lists them alone, and a given run must be one. */
  release: boolean;
  nonInteractive: boolean;
};

function workflowFilesFor(args: ParsedArgs): string[] {
  return args.release ? [RELEASE_BUILDS_WORKFLOW_FILE] : BUILD_WORKFLOW_FILES;
}

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
  --release                Only release builds: the picker lists only
                           ${RELEASE_BUILDS_WORKFLOW_FILE} runs, and a given
                           <runId> must be one
  --non-interactive        Never prompt: <runId> is required
  --help, -h               Show this help`);
}

function parseArgs(argv: string[]): ParsedArgs {
  let runId: string | undefined;
  let outDir: string | undefined;
  let release = false;
  let nonInteractive = false;
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
      case '--release':
        release = true;
        break;
      case '--non-interactive':
        nonInteractive = true;
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

  return { runId, outDir, categories, release, nonInteractive };
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

async function executeScriptAsync(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Resolve the project directory from this script's location so the command
  // works regardless of the current working directory.
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const easProjectDir = path.resolve(scriptDir, '..');

  if (!args.runId && args.nonInteractive) {
    throw new Error(
      'No run ID given, and --non-interactive turns the run picker off. Pass a run ID.',
    );
  }
  const runId =
    args.runId ?? (await pickRunIdAsync(easProjectDir, workflowFilesFor(args)));

  // When the picker was used, surface the selected ID so the user has it for
  // re-runs / sharing.
  if (!args.runId) {
    // eslint-disable-next-line no-console
    console.log(`Selected workflow run: ${runId}`);
  }

  const workflow = await fetchWorkflowRun(runId, easProjectDir);
  if (args.release && workflow.workflow.fileName !== RELEASE_BUILDS_WORKFLOW_FILE) {
    throw new Error(
      `Run ${workflow.id} is a run of ${workflow.workflow.fileName}, not ${RELEASE_BUILDS_WORKFLOW_FILE}. ` +
        'Omit --release to download it.',
    );
  }

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
