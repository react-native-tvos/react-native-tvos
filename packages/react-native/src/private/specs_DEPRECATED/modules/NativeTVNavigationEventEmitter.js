/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
  +enableTVMenuKey: () => void;
  +disableTVMenuKey: () => void;
  +enableTVPanGesture: () => void;
  +disableTVPanGesture: () => void;
  +enableGestureHandlersCancelTouches: () => void;
  +disableGestureHandlersCancelTouches: () => void;
}

export default (TurboModuleRegistry.get<Spec>('TVNavigationEventEmitter'): ?Spec);
