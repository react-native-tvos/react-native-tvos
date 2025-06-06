/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../../src/private/types/HostComponent';
import type {HostInstance} from '../../../src/private/types/HostInstance';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import {type ViewProps as Props} from './ViewPropTypes';

const ViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>('RCTView', () => ({
    uiViewClassName: 'RCTView',
  }));

interface NativeCommands {
  +hotspotUpdate: (viewRef: HostInstance, x: number, y: number) => void;
  +setPressed: (viewRef: HostInstance, pressed: boolean) => void;
  // Focus Guide API
  +setDestinations: (
    viewRef: React.ElementRef<HostComponent<mixed>>,
    destinations: Array<number>, // Node handles are basically integers
  ) => void;
  +requestTVFocus: (viewRef: React.ElementRef<HostComponent<mixed>>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'hotspotUpdate',
    'setPressed',
    'setDestinations',
    'requestTVFocus',
  ],
});

export default ViewNativeComponent;

export type ViewNativeComponentType = HostComponent<Props>;
