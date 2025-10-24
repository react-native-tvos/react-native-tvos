#!/usr/bin/env yarn --silent tsx
'use strict';

import { parseArgs, ParseArgsConfig } from "node:util";
import { deploymentStatusAsync, dropDeploymentAsync, getConfig, publishDeploymentAsync, uploadDeploymentBundleAsync } from "./common/sonatypeApiUtils";

const commands = [ 'upload', 'publish', 'drop', 'status'];

const executeScriptAsync = async function () {
  const programConfig: ParseArgsConfig = {
    allowPositionals: true,
    options: {
      help: {type: 'boolean'},
      'auto-publish': {type: 'boolean'},
    },
  };

  const { values: { help, 'auto-publish': autoPublish }, positionals, tokens } = parseArgs(programConfig);

  if (help || !positionals.length) {
    console.log(`
  Usage: node ./tools/rntv-workflows/src/sonatype.ts <command> [options]

  Commands:
    upload <path>   Uploads a deployment bundle to Sonatype. Second argument should be the path to a valid Maven bundle.
    publish <id>    Publishes a deployment to Sonatype. Second argument must be a deployment ID.
    drop <id>       Drops a deployment from Sonatype. Second argument must be a deployment ID.
    status <id>     Checks the status of a deployment in Sonatype. Second argument must be a deployment ID.

  Options:
    --help     Show this help message.
    `);
    return;
  }
  const sonatypeConfig = getConfig();

  const command = positionals[0];
  if (!commands.includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }
  switch (command) {
    case 'upload': {
      if (positionals.length < 2) {
        throw new Error('Missing path argument');
      }
      const bundlePath = positionals[1];
      const deploymentId = await uploadDeploymentBundleAsync(bundlePath, sonatypeConfig, autoPublish === true);
      console.log(`${deploymentId}`);
      break;
    }
    case 'publish': {
      if (positionals.length < 2) {
        throw new Error('Missing deployment ID argument');
      }
      const deploymentId = positionals[1];
      await publishDeploymentAsync(deploymentId, sonatypeConfig);
      console.log('Deployment published');
      break;
    }
    case 'drop': {
      if (positionals.length < 2) {
        throw new Error('Missing deployment ID argument');
      }
      const deploymentId = positionals[1];
      await dropDeploymentAsync(deploymentId, sonatypeConfig);
      console.log('Deployment dropped');
      break;
    }
    case 'status': {
      if (positionals.length < 2) {
        throw new Error('Missing deployment ID argument');
      }
      const deploymentId = positionals[1];
      const status = await deploymentStatusAsync(deploymentId, sonatypeConfig);
      console.log(JSON.stringify(status, null, 2));
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
};

executeScriptAsync();
