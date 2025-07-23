/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import spawnAsync from '@expo/spawn-async';
import { echo, test } from 'shelljs';
import path from 'path';

import { repoConstants, easConstants } from './constants';
import {
  removeDirectoryIfNeededAsync,
  unpackTarArchiveAsync,
} from './fileUtils';

const { repoPath, repoName, repoUrl } = repoConstants;
const { buildDir } = easConstants;

export async function getBranchNameAsync() /*: string */ {
  const result = await spawnAsync(
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    {
      stdio: 'pipe',
      cwd: repoPath,
    },
  );
  return result.output[0].trim();
}

export async function doesBranchExistAtUrlAsync(
  url: string,
  branchName: string,
) {
  const result = await spawnAsync(
    'git',
    ['ls-remote', '--heads', url, `refs/heads/${branchName}`],
    {
      stdio: 'pipe',
    },
  );
  return result.output[0].trim().length > 0;
}

export async function doesTagExistAtUrlAsync(url: string, tagName: string) {
  const result = await spawnAsync(
    'git',
    ['ls-remote', url, `refs/tags/${tagName}`],
    {
      stdio: 'pipe',
    },
  );
  return result.output[0].trim().length > 0;
}

export async function getCurrentCommitAsync() {
  const result = await spawnAsync('git', ['rev-parse', 'HEAD'], {
    stdio: 'pipe',
    cwd: repoPath,
  });
  return result.output[0].trim();
}

export async function createNewBranchAsync(branchName: string) {
  await spawnAsync('git', ['checkout', '-b', branchName], {
    stdio: 'inherit',
    cwd: repoPath,
  });
}

export async function commitAllChangesAsync(commitMessage: string) {
  await spawnAsync('git', ['commit', '-a', '-m', commitMessage], {
    stdio: 'inherit',
    cwd: repoPath,
  });
}

export async function commitStagedChangesAsync(commitMessage: string) {
  await spawnAsync('git', ['commit', '-m', commitMessage], {
    stdio: 'inherit',
    cwd: repoPath,
  });
}

export async function setCredentialsAsync() {
  if (
    !process.env.GITHUB_USER ||
    !process.env.GITHUB_TOKEN ||
    !process.env.GIT_AUTHOR_NAME ||
    !process.env.GIT_AUTHOR_EMAIL ||
    !process.env.GIT_COMMITTER_NAME ||
    !process.env.GIT_COMMITTER_EMAIL
  ) {
    throw new Error(
      `Secrets GITHUB_USER and GITHUB_TOKEN must be set in EAS in order to push to GitHub`,
    );
  }
  const userName = process.env.GITHUB_NAME;
  const email = process.env.GITHUB_EMAIL;
  await spawnAsync('git', ['config', 'user.email', email], {
    stdio: 'inherit',
    cwd: repoPath,
  });
  await spawnAsync('git', ['config', 'user.name', userName], {
    stdio: 'inherit',
    cwd: repoPath,
  });
  const [repoProtocol, repoUrlPath] = repoUrl.split('//');
  const remoteUrl = `${repoProtocol}//${process.env.GITHUB_USER}:${process.env.GITHUB_TOKEN}@${repoUrlPath}`;
  await spawnAsync('git', ['remote', 'set-url', 'origin', remoteUrl], {
    stdio: 'inherit',
    cwd: repoPath,
  });
}

export async function pushBranchAsync(branchName?: string) {
  await setCredentialsAsync();
  // If new branch, add required arguments
  const args = branchName
    ? ['push', '--set-upstream', 'origin', branchName]
    : ['push'];
  await spawnAsync('git', args, {
    stdio: 'inherit',
    cwd: repoPath,
  });
}

export async function cloneAndInstallBranchAsync(branchName: string) {
  const sourceTarballPath = `${repoPath}.tar.gz`;
  const destinationPath = path.join(buildDir, repoName);
  await removeDirectoryIfNeededAsync(destinationPath);

  echo(`Checking if ${sourceTarballPath} exists...`);
  if (test('-e', sourceTarballPath)) {
    echo(`Unpacking supplied RN archive at ${sourceTarballPath}...`);
    await unpackTarArchiveAsync(sourceTarballPath, '.');
  } else {
    echo(`Clone ${repoName} from ${repoUrl} and ${branchName}...`);
    await spawnAsync(
      'git',
      ['clone', '--single-branch', '--no-tags', repoUrl, '-b', branchName],
      {
        cwd: '.',
        stdio: 'inherit',
      },
    );
  }
  echo('Installing RN dependencies...');
  await spawnAsync('yarn', [], {
    cwd: repoPath,
    stdio: 'inherit',
  });
  echo('Done.');
}
