/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

/*
 * Checks the formatting of the files that differ between a base ref and the
 * working tree, with the same formatters and ignore lists as
 * `yarn format-check`.
 *
 * Usage: yarn format-check-changed [base-ref]   (default: origin/main)
 */

const {spawnSync} = require('node:child_process');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

const CHECKS = [
  {
    name: 'JavaScript',
    extensions: /\.(cjs|cts|flow|js|jsx|md|mjs|mts|ts|tsx|yaml|yml)$/,
    command: [
      path.join(REPO_ROOT, 'node_modules', '.bin', 'prettier'),
      '--check',
    ],
  },
  {
    name: 'C++',
    extensions: /\.(c|cc|cpp|cu|cuh|cxx|h|hh|hpp|hxx|m|mm|proto|tcc)$/,
    command: ['node', path.join(__dirname, 'clang-format.js'), '--check'],
  },
  {
    name: 'Java',
    extensions: /\.java$/,
    command: ['node', path.join(__dirname, 'format-java.js'), '--check'],
  },
  {
    name: 'Kotlin',
    extensions: /\.(kt|kts)$/,
    command: ['node', path.join(__dirname, 'format-kotlin.js'), '--check'],
  },
  {
    name: 'Python',
    extensions: /\.(py|pyi)$/,
    command: ['node', path.join(__dirname, 'format-python.js'), '--check'],
  },
  {
    name: 'Swift',
    extensions: /\.swift$/,
    command: ['node', path.join(__dirname, 'format-swift.js'), '--check'],
  },
];

function changedFiles(baseRef) {
  const result = spawnSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', '-z', baseRef],
    {cwd: REPO_ROOT, encoding: 'utf8'},
  );
  if (result.status !== 0) {
    throw new Error(
      `git diff against ${baseRef} failed: ${result.stderr.trim()}\n` +
        `Fetch the base first, for example: git fetch --depth=1 origin main`,
    );
  }
  return result.stdout.split('\0').filter(file => file !== '');
}

function main() {
  const baseRef = process.argv[2] ?? 'origin/main';
  const files = changedFiles(baseRef);
  let exitStatus = 0;

  for (const check of CHECKS) {
    const checkFiles = files.filter(file => check.extensions.test(file));
    if (checkFiles.length === 0) {
      continue;
    }
    console.log(
      `Checking ${check.name} formatting of ${checkFiles.length} changed file(s)`,
    );
    const [command, ...args] = check.command;
    const result = spawnSync(command, [...args, ...checkFiles], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    if (result.error != null) {
      throw result.error;
    }
    if (result.status !== 0) {
      exitStatus = result.status ?? 1;
    }
  }
  process.exitCode = exitStatus;
}

main();
