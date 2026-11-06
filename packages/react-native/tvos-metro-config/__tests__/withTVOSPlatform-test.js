/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {withTVOSPlatform} = require('../index');
const {getDefaultConfig} = require('metro-config');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const rnTesterRoot = path.resolve(__dirname, '../../../rn-tester');

/**
 * Creates a project whose `node_modules` holds a package.json for each name.
 * A name mapped to another name is a symlink to that package, like an alias
 * that resolves to the same folder.
 */
function createProject(packages) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tvos-metro-'));
  for (const [name, target] of Object.entries(packages)) {
    const packageDir = path.join(projectRoot, 'node_modules', name);
    if (target === name) {
      fs.mkdirSync(packageDir, {recursive: true});
      fs.writeFileSync(
        path.join(packageDir, 'package.json'),
        JSON.stringify({name}),
      );
    } else {
      fs.symlinkSync(
        path.join(projectRoot, 'node_modules', target),
        packageDir,
      );
    }
  }
  return projectRoot;
}

function createContext() {
  return {
    preferNativePlatform: true,
    resolveRequest: jest.fn(() => ({type: 'empty'})),
    sourceExts: ['js', 'ts'],
  };
}

describe('withTVOSPlatform', () => {
  test('resolves tvos requests with .tvos, .ios and .native extensions', () => {
    const {resolver} = withTVOSPlatform({});
    const context = createContext();

    resolver.resolveRequest(context, './Platform', 'tvos');

    expect(context.resolveRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        preferNativePlatform: false,
        sourceExts: [
          'tvos.js',
          'tvos.ts',
          'ios.js',
          'ios.ts',
          'native.js',
          'native.ts',
          'js',
          'ts',
        ],
      }),
      './Platform',
      null,
    );
  });

  test('passes other platforms through unchanged', () => {
    const {resolver} = withTVOSPlatform({});
    const context = createContext();

    resolver.resolveRequest(context, './Platform', 'android');

    expect(context.resolveRequest).toHaveBeenCalledWith(
      context,
      './Platform',
      'android',
    );
  });

  test("runs the config's own resolveRequest", () => {
    const appResolveRequest = jest.fn(() => ({type: 'empty'}));
    const {resolver} = withTVOSPlatform({
      resolver: {resolveRequest: appResolveRequest},
    });
    const context = createContext();

    resolver.resolveRequest(context, './Platform', 'tvos');

    expect(context.resolveRequest).not.toHaveBeenCalled();
    expect(appResolveRequest).toHaveBeenCalledWith(
      expect.objectContaining({preferNativePlatform: false}),
      './Platform',
      null,
    );
  });

  describe('with react-native-tvos next to react-native', () => {
    const projectRoot = createProject({
      'react-native': 'react-native',
      'react-native-tvos': 'react-native-tvos',
    });

    test.each([
      ['react-native', 'react-native-tvos'],
      [
        'react-native/Libraries/Core/InitializeCore',
        'react-native-tvos/Libraries/Core/InitializeCore',
      ],
      ['react-native-safe-area-context', 'react-native-safe-area-context'],
      ['./react-native', './react-native'],
    ])('resolves a tvos request for %s as %s', (moduleName, expected) => {
      const {resolver} = withTVOSPlatform({projectRoot});
      const context = createContext();

      resolver.resolveRequest(context, moduleName, 'tvos');

      expect(context.resolveRequest).toHaveBeenCalledWith(
        expect.anything(),
        expected,
        null,
      );
    });

    test('resolves react-native on other platforms', () => {
      const {resolver} = withTVOSPlatform({projectRoot});
      const context = createContext();

      resolver.resolveRequest(context, 'react-native', 'android');

      expect(context.resolveRequest).toHaveBeenCalledWith(
        context,
        'react-native',
        'android',
      );
    });
  });

  test.each([
    [
      'react-native aliased to react-native-tvos',
      {'react-native': 'react-native'},
    ],
    [
      'both names on one package',
      {'react-native': 'react-native', 'react-native-tvos': 'react-native'},
    ],
  ])('keeps react-native requests with %s', (_, packages) => {
    const {resolver} = withTVOSPlatform({projectRoot: createProject(packages)});
    const context = createContext();

    resolver.resolveRequest(context, 'react-native', 'tvos');

    expect(context.resolveRequest).toHaveBeenCalledWith(
      expect.anything(),
      'react-native',
      null,
    );
  });

  test('rejects a config with its own transformerPath', () => {
    expect(() =>
      withTVOSPlatform({transformerPath: 'my-transform-worker'}),
    ).toThrow('my-transform-worker');
  });

  test.each([
    ['tvos', 'ios'],
    ['ios', 'ios'],
    ['android', 'android'],
  ])(
    'inlines Platform.OS in a %s bundle as %s',
    async (platform, expectedOS) => {
      const config = withTVOSPlatform(
        await getDefaultConfig.getDefaultValues(rnTesterRoot),
      );
      const worker = require(config.transformerPath);

      const {output} = await worker.transform(
        config.transformer,
        rnTesterRoot,
        'Example.js',
        Buffer.from(
          "const {Platform} = require('react-native');\nmodule.exports = Platform.OS;\n",
        ),
        {
          dev: true,
          hot: false,
          inlinePlatform: true,
          inlineRequires: false,
          minify: false,
          platform,
          type: 'module',
          unstable_transformProfile: 'default',
        },
      );

      expect(output[0].data.code).toContain(`module.exports = "${expectedOS}"`);
    },
  );
});
