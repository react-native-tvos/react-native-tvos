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

/*::
import type {Command} from '@react-native-community/cli-types';
 */

// Registers the tvOS platform and the run-tvos, build-tvos, and log-tvos
// commands with the Community CLI. The CLI registers the iOS and Android
// platforms itself, so this file covers tvOS only.

const verbose = Boolean(process.env.DEBUG?.includes('react-native'));

function findCommunityPlatformPackage(
  spec /*: string */,
  startDir /*: string */ = process.cwd(),
) {
  // Apps get `@react-native-community/cli-platform-apple` through
  // `@react-native-community/cli`, not as a direct dependency, so resolve it
  // from the project root. The Community CLI also assumes that the current
  // working directory is the project root.
  const main = require.resolve(spec, {paths: [startDir]});
  // $FlowFixMe[unsupported-syntax]
  return require(main);
}

let apple;
try {
  apple = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-apple',
  );
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-apple not found, the tvOS commands are not registered.',
    );
  }
}

const commands /*: Array<Command> */ = [];

const config = {
  commands,
  platforms: {} /*:: as {[string]: Readonly<{
      projectConfig: unknown,
      dependencyConfig: unknown,
    }>} */,
};

if (apple != null) {
  const platformName = 'tvos';

  config.commands.push(
    {
      name: `run-${platformName}`,
      description:
        'builds your app and starts it on a tvOS simulator or Apple TV device',
      func: apple.createRun({platformName}),
      examples: [
        {
          desc: 'Run on a specific simulator',
          cmd: `npx react-native run-${platformName} --simulator "Apple TV"`,
        },
      ],
      options: apple.getRunOptions({platformName}),
    },
    {
      name: `log-${platformName}`,
      description:
        'displays system logs from a connected tvOS device or simulator',
      func: apple.createLog({platformName}),
      options: apple.getLogOptions({platformName}),
    },
    {
      name: `build-${platformName}`,
      description: 'builds your app for tvOS',
      func: apple.createBuild({platformName}),
      examples: [
        {
          desc: 'Build the app for all tvOS devices in Release mode',
          cmd: `npx react-native build-${platformName} --mode "Release"`,
        },
      ],
      options: apple.getBuildOptions({platformName}),
    },
  );
  config.platforms[platformName] = {
    projectConfig: apple.getProjectConfig({platformName}),
    dependencyConfig: apple.getDependencyConfig({platformName}),
  };
}

module.exports = config;
