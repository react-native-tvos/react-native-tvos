#!/usr/bin/env -S bun --silent ts-node --transpile-only

'use strict';

import { promises as fs } from 'fs';
import path from 'path';
import { echo, test } from 'shelljs';
import spawnAsync from '@expo/spawn-async';

import { easConstants, removeDirectoryIfNeededAsync } from './common';
import { repoConstants } from './common';
const executeScriptAsync = async () => {
  const { mavenArtifactsPath, mavenLocalPath } = easConstants;
  const { publishToSonatype } = repoConstants;

  if (publishToSonatype) {
    echo(
      'Artifacts have been published to Sonatype, so clean up Maven directories...',
    );
    await removeDirectoryIfNeededAsync(mavenArtifactsPath);
    await removeDirectoryIfNeededAsync(mavenLocalPath);
    return;
  } else {
    if (!test('-e', mavenLocalPath)) {
      echo('No artifacts to package.');
      return;
    }
    echo('Packaging Maven artifacts...');
    if (!test('-e', mavenArtifactsPath)) {
      await fs.mkdir(mavenArtifactsPath);
    }
    const tarballPath = path.join(mavenArtifactsPath, 'maven-artifacts.tgz');
    const files = await fs.readdir(mavenLocalPath);
    await spawnAsync('tar', ['zcf', tarballPath, ...files], {
      cwd: mavenLocalPath,
      stdio: 'inherit',
    });
  }
  echo('Done');
};

executeScriptAsync();
