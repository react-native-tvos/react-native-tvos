#!/usr/bin/env yarn --silent tsx
'use strict';

import { uploadDeploymentBundleAsync } from "./common/sonatypeApiUtils";

const executeScriptAsync = async function () {
  const bundlePath = process.env.BUNDLE_PATH;
  if (!bundlePath) {
    throw new Error('BUNDLE_PATH is not set');
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

  const autoPublish = process.env.AUTO_PUBLISH === 'true';
  const deploymentId = await uploadDeploymentBundleAsync(bundlePath, config, autoPublish);
  console.log(`Deployment created: ${deploymentId}`);
};

executeScriptAsync();
