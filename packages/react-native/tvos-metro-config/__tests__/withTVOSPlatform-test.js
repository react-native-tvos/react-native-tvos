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
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../../../rn-tester');

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

  test('rejects a config with its own transformerPath', () => {
    expect(() =>
      withTVOSPlatform({transformerPath: 'my-transform-worker'}),
    ).toThrow('my-transform-worker');
  });

  test.each([
    ['tvos', 'ios'],
    ['ios', 'ios'],
    ['android', 'android'],
  ])('inlines Platform.OS in a %s bundle as %s', async (platform, os) => {
    const config = withTVOSPlatform(
      await getDefaultConfig.getDefaultValues(projectRoot),
    );
    const worker = require(config.transformerPath);

    const {output} = await worker.transform(
      config.transformer,
      projectRoot,
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

    expect(output[0].data.code).toContain(`module.exports = "${os}"`);
  });
});
