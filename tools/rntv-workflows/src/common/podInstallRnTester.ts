import spawnAsync from '@expo/spawn-async';
import path from 'path';
import { repoConstants } from './constants';
import { rewriteFileAtPathAsync } from './fileUtils';

const { rnPackagePath, repoName, repoPath } = repoConstants;

const rnTesterPath = path.join(repoPath, 'packages', 'rn-tester');

export const podInstallRnTesterAsync = async (withLocalArtifacts: boolean) => {
  await spawnAsync('yarn', ['clean-ios'], {
    cwd: rnTesterPath,
    stdio: 'inherit',
  });

  // Set up Ruby path
  const pathComponents = ['/opt/homebrew/bin', ...process.env.PATH.split(':')];

  const podInstallEnv = {
    ...process.env,
    PATH: pathComponents.join(':'),
    RCT_NEW_ARCH_ENABLED: '1',
    HERMES_ARTIFACT_FROM_MAVEN_LOCAL: withLocalArtifacts ? '1' : undefined,
    USE_HERMES: '1',
  };

  const hermesEnginePodspecPath = path.join(
    rnPackagePath,
    'sdks',
    'hermes-engine',
    'hermes-engine.podspec',
  );
  await rewriteFileAtPathAsync(hermesEnginePodspecPath, [
    { original: '"react-native"', replacement: `"${repoName}"` },
  ]);

  await spawnAsync('pod', ['install'], {
    cwd: rnTesterPath,
    env: podInstallEnv,
    stdio: 'inherit',
  });
};
