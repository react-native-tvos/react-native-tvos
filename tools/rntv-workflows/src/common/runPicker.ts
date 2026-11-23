/**
 * A picker of recent successful EAS workflow runs, for scripts that take a
 * run ID and ask for one when none is given.
 */

import readline from 'node:readline/promises';
import spawnAsync from '@expo/spawn-async';

/** Runs fetched per workflow before the results are merged. */
const RUNS_PER_WORKFLOW = 10;

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

/**
 * Fetch recent successful runs of the given workflows, newest first. Each
 * workflow is queried separately because `--workflow` takes a single file name.
 */
async function listSuccessfulRunsAsync(
  easProjectDir: string,
  workflowFiles: string[],
): Promise<WorkflowRunSummary[]> {
  const perWorkflow = await Promise.all(
    workflowFiles.map(async (workflowFileName) => {
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
  workflowFiles: string[],
): Promise<string> {
  const indexWidth = String(runs.length).length;

  // eslint-disable-next-line no-console
  console.log(
    `\nRecent successful runs of ${workflowFiles.join(' and ')}:\n`,
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

/**
 * List recent successful runs of the given workflows and return the one picked.
 * Throws when stdin is not a TTY, since the list cannot be answered.
 */
export async function pickRunIdAsync(
  easProjectDir: string,
  workflowFiles: string[],
): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error(
      'No run ID given and stdin is not a TTY, so the picker cannot be shown. Pass a run ID explicitly.',
    );
  }

  // eslint-disable-next-line no-console
  console.log(`Fetching recent successful runs of ${workflowFiles.join(' and ')}...`);
  const runs = await listSuccessfulRunsAsync(easProjectDir, workflowFiles);

  if (runs.length === 0) {
    throw new Error(
      `No successful runs found for ${workflowFiles.join(' or ')}.`,
    );
  }

  return promptForRunIdAsync(runs, workflowFiles);
}
