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
  readonly addListener: (eventName: string) => void;
  readonly removeListeners: (count: number) => void;
  readonly enableTVMenuKey: () => void;
  readonly disableTVMenuKey: () => void;
  readonly enableTVPanGesture: () => void;
  readonly disableTVPanGesture: () => void;
  readonly enableGestureHandlersCancelTouches: () => void;
  readonly disableGestureHandlersCancelTouches: () => void;
}

export default TurboModuleRegistry.get<Spec>(
  'TVNavigationEventEmitter',
) as ?Spec;
