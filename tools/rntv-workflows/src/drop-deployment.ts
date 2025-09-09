#!/usr/bin/env yarn --silent tsx
'use strict';

import { deploymentStatusAsync, dropDeploymentAsync } from "./common/sonatypeApiUtils";

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

  await dropDeploymentAsync(deploymentId, config);
  console.log('Deployment dropped');
};

executeScriptAsync();
