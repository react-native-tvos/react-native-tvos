import type { SonatypeConfig } from './types';
import spawnAsync from '@expo/spawn-async';
import path from 'node:path';

function bearerToken(config: SonatypeConfig) {
  return `Basic ${Buffer.from(`${config.sonatypeUsername}:${config.sonatypePassword}`).toString('base64')}`;
}

export function getConfig(): SonatypeConfig {
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

  return config;
}

export async function deploymentStatusAsync(deploymentId: string, config: SonatypeConfig) {
  const response = await fetch(`https://central.sonatype.com/api/v1/publisher/status?id=${deploymentId}`, {
    method: 'POST',
    headers: {
      Authorization: bearerToken(config),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get deployment status: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function dropDeploymentAsync(deploymentId: string, config: SonatypeConfig) {
  const response = await fetch(`https://central.sonatype.com/api/v1/publisher/deployment/${deploymentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: bearerToken(config),
    },
  });
  if (response.status !== 204) {
    throw new Error(`Failed to drop deployment: ${response.status} ${response.statusText}`);
  }
}

export async function publishDeploymentAsync(deploymentId: string, config: SonatypeConfig) {
  const response = await fetch(`https://central.sonatype.com/api/v1/publisher/deployment/${deploymentId}`, {
    method: 'POST',
    headers: {
      Authorization: bearerToken(config),
    },
  });
  if (response.status !== 204) {
    throw new Error(`Failed to publish deployment: ${response.status} ${response.statusText}`);
  }
}

export async function uploadDeploymentBundleAsync(bundlePath: string, config: SonatypeConfig, autoPublish?: boolean) {
  /*
  curl --request POST \
  --verbose \
  --header 'Authorization: Bearer ZXhhbXBsZV91c2VybmFtZTpleGFtcGxlX3Bhc3N3b3Jk' \
  --form bundle=@central-bundle.zip \
  https://central.sonatype.com/api/v1/publisher/upload
   */
  const name = path.basename(bundlePath).replace(/\.tgz$/, '');
  const url = `https://central.sonatype.com/api/v1/publisher/upload?name=${name}&publishingType=${autoPublish ? 'AUTOMATIC' : 'USER_MANAGED'}`;
  const result = await spawnAsync('curl', 
    ['--request', 'POST',
      '--header', `Authorization: ${bearerToken(config)}`,
      '--form', `bundle=@${bundlePath}`,
      url], {
    stdio: 'pipe',
  });
  return result.output[0].trim();
}
