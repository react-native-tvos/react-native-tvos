#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import { echo, test } from 'shelljs';
import path from 'path';
import { promises as fs } from 'fs';
import spawnAsync, { SpawnResult } from '@expo/spawn-async';

import {
  repoConstants,
  easConstants,
  validateEnv,
  cloneAndInstallBranchAsync,
  rewriteReactNativePackageJsonAsync,
  rewriteVirtualizedListsPackageJsonAsync,
} from './common';

const { repoPath, repoBranch } = repoConstants;
const { buildDir } = easConstants;

const testResultsPath = path.join(buildDir, 'unit-tests.log');

const appendToTestResultsAsync = async (text: string) => {
  if (!test('-e', testResultsPath)) {
    await fs.writeFile(testResultsPath, text, { encoding: 'utf-8' });
  } else {
    await fs.appendFile(testResultsPath, text, { encoding: 'utf-8' });
  }
};

export const runTestTaskAsync: (params?: {
  command?: string;
  cwdPath?: string;
  extraArgs?: string[];
}) => Promise<SpawnResult> = async (params) => {
  const args = [];
  if (params?.cwdPath) {
    args.push('--cwd');
    args.push(params?.cwdPath);
  }
  if (params?.extraArgs) {
    params?.extraArgs.forEach((a) => args.push(a));
  }
  if (params?.command) {
    args.push('run');
    args.push(params?.command);
  }
  try {
    return await spawnAsync('yarn', args, {
      stdio: 'inherit',
      cwd: repoPath,
    });
  } catch (e) {
    return e;
  }
};

function describe(message: string) {
  echo(`\n\n>>>>> ${message}\n\n\n`);
}

const executeScriptAsync: () => Promise<void> = async () => {
  validateEnv();

  await cloneAndInstallBranchAsync(repoBranch);

  echo('Executing JavaScript tests');

  echo('Rewrite react-native package JSON...');
  await rewriteReactNativePackageJsonAsync('react-native');

  echo('Rewrite virtualized-lists package JSON...');
  await rewriteVirtualizedListsPackageJsonAsync();

  echo('Reinstall NPM packages...');
  await runTestTaskAsync();

  describe('Test: feature flags codegen');
  const featureFlagsResult = await runTestTaskAsync({
    command: 'featureflags-check',
    cwdPath: path.resolve(
      repoPath,
      'packages',
      'react-native',
    ),
  });
  await appendToTestResultsAsync(featureFlagsResult.output.join('\n'));
  if (featureFlagsResult.status) {
    throw new Error('Feature flags test failed.');
  }

  describe('Test: ESLint');
  const eslintResult = await runTestTaskAsync({ command: 'lint' });
  await appendToTestResultsAsync(eslintResult.output.join('\n'));
  if (eslintResult.status) {
    throw new Error('ESLint test failed.');
  }

  /*
  describe('Test: Flow check');
  const flowResult = await runTestTaskAsync({ command: 'flow-check' });
  await appendToTestResultsAsync(flowResult.output.join('\n'));
  if (flowResult.status) {
    throw new Error('Flow check failed.');
  }
 */
  describe('Test: Build @react-native/codegen');
  const codegenResult = await runTestTaskAsync({
    command: 'build',
    cwdPath: path.resolve(repoPath, 'packages', 'react-native-codegen'),
  });
  await appendToTestResultsAsync(codegenResult.output.join('\n'));
  if (codegenResult.status) {
    throw new Error('Codegen build failed.');
  }

  describe('Test: Build @react-native/codegen-typescript-test');
  const codegenTsResult = await runTestTaskAsync({
    command: 'build',
    cwdPath: path.resolve(
      repoPath,
      'packages',
      'react-native-codegen-typescript-test',
    ),
  });
  await appendToTestResultsAsync(codegenTsResult.output.join('\n'));
  if (codegenTsResult.status) {
    throw new Error('Codegen TS build failed.');
  }

  describe('Test: Jest');
  const jestResult = await runTestTaskAsync({ command: 'test-ci' });
  await appendToTestResultsAsync(jestResult.output.join('\n'));
  if (jestResult.status) {
    throw new Error('Failed to run JavaScript tests.');
  }

  describe('Test: TypeScript tests');
  const tsResult = await runTestTaskAsync({
    command: 'test-typescript-offline',
  });
  await appendToTestResultsAsync(tsResult.output.join('\n'));
  if (tsResult.status) {
    throw new Error('Failed to run TypeScript tests.');
  }
};

executeScriptAsync();
