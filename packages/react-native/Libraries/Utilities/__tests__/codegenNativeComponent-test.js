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

const UIManager = require('../../ReactNative/UIManager').default;
const codegenNativeComponent = require('../codegenNativeComponent').default;

// We need to unmock requireNativeComponent since it's under test.
// Instead, we mock the function it calls, createReactNativeComponentClass,
// so that we don't run into issues populating the registry with the same
// component names.
jest.unmock('../../ReactNative/requireNativeComponent');
jest.mock('../../Renderer/shims/createReactNativeComponentClass', () => ({
  __esModule: true,
  default: componentName => componentName,
}));
jest
  .spyOn(UIManager, 'hasViewManagerConfig')
  .mockImplementation(componentName =>
    componentName.includes('ComponentNameDoesNotExist') ? false : true,
  );

describe('codegenNativeComponent', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    // $FlowExpectedError[cannot-write]
    global.RN$Bridgeless = false;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should require component as is ', () => {
    const component = codegenNativeComponent<$FlowFixMe>('ComponentName');
    expect(component).toBe('ComponentName');
  });

  it('should require paperComponentName', () => {
    const component = codegenNativeComponent<$FlowFixMe>('ComponentName', {
      paperComponentName: 'PaperComponentName',
    });
    expect(component).toBe('PaperComponentName');
  });

  it('should fall back to requiring the deprecated paper component name', () => {
    const component = codegenNativeComponent<$FlowFixMe>(
      'ComponentNameDoesNotExist',
      {
        paperComponentNameDeprecated: 'ComponentName',
      },
    );
    expect(component).toBe('ComponentName');
  });

  it('should require the new component name', () => {
    const component = codegenNativeComponent<$FlowFixMe>('ComponentName', {
      paperComponentNameDeprecated: 'ComponentNameDoesNotExist',
    });
    expect(component).toBe('ComponentName');
  });

  it('should throw if neither component names exist', () => {
    expect(() =>
      codegenNativeComponent<$FlowFixMe>('ComponentNameDoesNotExistOne', {
        paperComponentNameDeprecated: 'ComponentNameDoesNotExistTwo',
      }),
    ).toThrow(
      'Failed to find native component for either ComponentNameDoesNotExistOne or ComponentNameDoesNotExistTwo',
    );
  });

  it('should NOT warn if called directly in BRIDGE mode', () => {
    // $FlowExpectedError[cannot-write]
    global.RN$Bridgeless = false;
    codegenNativeComponent<$FlowFixMe>('ComponentName');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should warn if called directly in BRIDGELESS mode', () => {
    // $FlowExpectedError[cannot-write]
    global.RN$Bridgeless = true;
    codegenNativeComponent<$FlowFixMe>('ComponentName');
    expect(console.warn).toHaveBeenCalledWith(
      `Codegen didn't run for ComponentName. This will be an error in the future. Make sure you are using @react-native/babel-preset when building your JavaScript code.`,
    );
  });
});
