#!/usr/bin/env yarn --silent tsx
'use strict';

/**
 * Create a GitHub release for react-native-tvos using artifacts produced by
 * `download-workflow-artifacts.ts`.
 *
 * Defaults:
 *   - Reads `.tgz` artifacts from the supplied directory (default: cwd).
 *   - Auto-detects the release version from `react-native-<version>.tgz`
 *     (or `react-native-tvos-<version>.tgz`) in that directory.
 *   - Tags the release `v<version>`, names it `<version>`.
 *   - Targets the `release-<version>` branch (e.g. `release-0.85.3-0`),
 *     matching the branch convention used to cut TV releases.
 *   - Uploads every `*.tgz` / `*.tar.gz` file in the directory as a release
 *     asset.
 *   - Repo: react-native-tvos/react-native-tvos.
 *   - Body: empty. Pass `--notes-file <path>` to set release notes (e.g. the
 *     output of `scripts/tv-changelog.sh`), or `--generate-notes` to let gh
 *     auto-generate a PR-based summary. With `--generate-notes`, pass
 *     `--notes-start-tag <tag>` to anchor where the "What's Changed" list
 *     begins (default: gh picks the previous release automatically).
 *   - The release is not marked as "Latest" by default — gh is invoked
 *     with `--latest=false`. Pass `--latest` to opt back in. `--latest`
 *     and `--prerelease` are mutually exclusive (GitHub does not allow a
 *     prerelease to be marked Latest).
 *   - Starts a GitHub discussion in the `Announcements` category alongside
 *     the release. Override with `--discussion-category <name>` or pass
 *     `--discussion-category none` to skip. Drafts cannot have discussions
 *     attached, so `--draft` implicitly disables this.
 *
 * Usage (run from the top of the repository):
 *   tools/rntv-workflows/src/create-release.ts [<artifactsDir>] [options]
 *
 * Examples:
 *   tools/rntv-workflows/src/create-release.ts
 *   tools/rntv-workflows/src/create-release.ts ./build/eas-artifacts/<runId>
 *   tools/rntv-workflows/src/create-release.ts --version 0.85.3-0 --target abc1234
 *   tools/rntv-workflows/src/create-release.ts --notes-file CHANGELOG.md
 *   tools/rntv-workflows/src/create-release.ts --dry-run
 *
 * Requires: a logged-in `gh` CLI with write access to the target repo.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import spawnAsync from '@expo/spawn-async';

const DEFAULT_REPO = 'react-native-tvos/react-native-tvos';

// Matches react-native-<v>.tgz and react-native-tvos-<v>.tgz, but not
// react-native-virtualized-lists-<v>.tgz (which doesn't start its version
// segment with a digit immediately after `react-native-`).
const NPM_TARBALL_VERSION_REGEX = /^react-native(?:-tvos)?-(\d.+?)\.tgz$/;

const DEFAULT_DISCUSSION_CATEGORY = 'Announcements';

type ParsedArgs = {
  artifactsDir: string;
  version?: string;
  target?: string;
  repo: string;
  notesFile?: string;
  generateNotes: boolean;
  // Tag to anchor `--generate-notes` (gh's --notes-start-tag).
  notesStartTag?: string;
  // Resolved category name to attach a discussion to, or `null` to skip.
  discussionCategory: string | null;
  draft: boolean;
  prerelease: boolean;
  latest: boolean;
  dryRun: boolean;
};

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: tools/rntv-workflows/src/create-release.ts [<artifactsDir>] [options]

Run from the top of the repository.

Arguments:
  <artifactsDir>           Directory containing the .tgz artifacts to upload.
                           Defaults to the current working directory.

Options:
  --version <v>            Version to release (default: auto-detected from
                           react-native-<version>.tgz)
  --target <ref>           Git ref/commit for the tag
                           (default: release-<version>)
  --repo <owner/name>      GitHub repo (default: ${DEFAULT_REPO})
  --notes-file <path>      Read release notes from a file
  --generate-notes         Auto-generate notes from PRs since the last release
  --notes-start-tag <tag>  With --generate-notes, anchor the changelog at this
                           tag instead of the auto-detected previous release
  --draft                  Create as a draft release (also disables the
                           release discussion; drafts can't have one)
  --prerelease             Mark as a pre-release (mutually exclusive with --latest)
  --latest                 Mark as the "Latest" release (default: false)
  --discussion-category <name>
                           Start a release discussion in this category
                           (default: ${DEFAULT_DISCUSSION_CATEGORY}). Pass "none" to skip.
  --dry-run                Print what would be created; don't call gh
  --help, -h               Show this help`);
}

function parseArgs(argv: string[]): ParsedArgs {
  let artifactsDir: string | undefined;
  let version: string | undefined;
  let target: string | undefined;
  let repo: string = DEFAULT_REPO;
  let notesFile: string | undefined;
  let generateNotes = false;
  let notesStartTag: string | undefined;
  let draft = false;
  let prerelease = false;
  let latest = false;
  let dryRun = false;
  let discussionCategoryRaw: string = DEFAULT_DISCUSSION_CATEGORY;

  const requireValue = (flag: string, value: string | undefined): string => {
    if (!value) {
      throw new Error(`${flag} requires an argument`);
    }
    return value;
  };

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
      case '--target':
        target = requireValue(arg, argv[++i]);
        break;
      case '--repo':
        repo = requireValue(arg, argv[++i]);
        break;
      case '--notes-file':
        notesFile = requireValue(arg, argv[++i]);
        break;
      case '--generate-notes':
        generateNotes = true;
        break;
      case '--notes-start-tag':
        notesStartTag = requireValue(arg, argv[++i]);
        break;
      case '--draft':
        draft = true;
        break;
      case '--prerelease':
        prerelease = true;
        break;
      case '--latest':
        latest = true;
        break;
      case '--discussion-category':
        discussionCategoryRaw = requireValue(arg, argv[++i]);
        break;
      case '--dry-run':
        dryRun = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unrecognized option: ${arg}`);
        }
        if (artifactsDir !== undefined) {
          throw new Error(`Unexpected positional argument: ${arg}`);
        }
        artifactsDir = arg;
    }
  }

  if (notesFile && generateNotes) {
    throw new Error('--notes-file and --generate-notes are mutually exclusive.');
  }

  if (notesStartTag && !generateNotes) {
    throw new Error(
      '--notes-start-tag only has effect with --generate-notes; pass both or neither.',
    );
  }

  if (latest && prerelease) {
    throw new Error('--latest and --prerelease are mutually exclusive.');
  }

  // gh release create rejects --discussion-category on draft releases. Auto-
  // suppress so users don't have to pass two flags to make a draft work, and
  // honor an explicit "none" sentinel as opt-out for non-draft releases.
  const isNoneSentinel =
    discussionCategoryRaw.toLowerCase() === 'none' ||
    discussionCategoryRaw === '';
  const discussionCategory = draft || isNoneSentinel ? null : discussionCategoryRaw;

  return {
    artifactsDir: path.resolve(artifactsDir ?? process.cwd()),
    version,
    target,
    repo,
    notesFile,
    generateNotes,
    notesStartTag,
    discussionCategory,
    draft,
    prerelease,
    latest,
    dryRun,
  };
}

async function findArtifacts(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /\.(tgz|tar\.gz)$/i.test(e.name))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function detectVersionFromAssets(assets: string[]): string {
  for (const asset of assets) {
    const m = path.basename(asset).match(NPM_TARBALL_VERSION_REGEX);
    if (m) return m[1];
  }
  throw new Error(
    'Could not detect version: no react-native-<version>.tgz tarball found. ' +
      'Use --version to specify it explicitly.',
  );
}

async function executeScriptAsync(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const stat = await fs.stat(args.artifactsDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Artifacts directory not found: ${args.artifactsDir}`);
  }

  const assets = await findArtifacts(args.artifactsDir);
  if (assets.length === 0) {
    throw new Error(`No .tgz / .tar.gz files found in ${args.artifactsDir}`);
  }

  const version = args.version ?? detectVersionFromAssets(assets);
  const tag = `v${version}`;
  const title = version;
  const target = args.target ?? `release-${version}`;

  // eslint-disable-next-line no-console
  console.log(`Repo:    ${args.repo}`);
  // eslint-disable-next-line no-console
  console.log(`Tag:     ${tag}`);
  // eslint-disable-next-line no-console
  console.log(`Title:   ${title}`);
  // eslint-disable-next-line no-console
  console.log(`Target:  ${target}`);
  // eslint-disable-next-line no-console
  console.log(`Assets:  ${assets.length}`);
  for (const asset of assets) {
    // eslint-disable-next-line no-console
    console.log(`  - ${path.basename(asset)}`);
  }

  const ghArgs: string[] = [
    'release',
    'create',
    tag,
    '--repo',
    args.repo,
    '--title',
    title,
    '--target',
    target,
  ];
  if (args.notesFile) {
    ghArgs.push('--notes-file', args.notesFile);
  } else if (args.generateNotes) {
    ghArgs.push('--generate-notes');
    if (args.notesStartTag) {
      ghArgs.push('--notes-start-tag', args.notesStartTag);
    }
  } else {
    // gh requires one of --notes / --notes-file / --generate-notes when
    // running non-interactively.
    ghArgs.push('--notes', '');
  }
  if (args.draft) ghArgs.push('--draft');
  if (args.prerelease) ghArgs.push('--prerelease');
  // Make the latest/not-latest decision explicit. Default is false so an
  // existing "Latest" release isn't accidentally displaced; pass --latest
  // to opt back in.
  ghArgs.push(args.latest ? '--latest=true' : '--latest=false');
  if (args.discussionCategory) {
    ghArgs.push('--discussion-category', args.discussionCategory);
  }
  ghArgs.push(...assets);

  if (args.dryRun) {
    const quoted = ghArgs.map((a) => {
      if (a === '') return '""';
      if (/[\s"']/.test(a)) return JSON.stringify(a);
      return a;
    });
    // eslint-disable-next-line no-console
    console.log(`\n--dry-run: would invoke:\n  gh ${quoted.join(' ')}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log('\nInvoking gh release create...');
  await spawnAsync('gh', ghArgs, { stdio: 'inherit' });
  // eslint-disable-next-line no-console
  console.log(
    `Done. Release: https://github.com/${args.repo}/releases/tag/${tag}`,
  );
}

executeScriptAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.error(`error: ${message}`);
  process.exit(1);
});
