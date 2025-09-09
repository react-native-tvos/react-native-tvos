#!/usr/bin/env yarn --silent tsx
'use strict';

import { deploymentStatusAsync } from "./common/sonatypeApiUtils";

const executeScriptAsync = async function () {
  const deploymentId = process.env.DEPLOYMENT_ID;
  if (!deploymentId) {
    throw new Error('DEPLOYMENT_ID is not set');
  }

  const sonatypeUsername = process.env.ORG_GRADLE_PROJECT_SONATYPE_USERNAME;
  if (!sonatypeUsername) {
    throw new Error('SONATYPE_USERNAME is not set');
  }

  const sonatypePassword = process.env.ORG_GRADLE_PROJECT_SONATYPE_PASSWORD;
  if (!sonatypePassword) {
    throw new Error('SONATYPE_PASSWORD is not set');
  }

  const config = {
    sonatypeUsername,
    sonatypePassword,
  };

  const status = await deploymentStatusAsync(deploymentId, config);
  console.log(JSON.stringify(status, null, 2));
};

executeScriptAsync();
