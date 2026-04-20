/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// On Apple TV, this implements back navigation using the TV remote's menu button.
// On iOS, this just implements a stub.

import type {HardwareBackPressEvent} from './HardwareBackPressEvent';

const TVEventHandler = require('../Components/TV/TVEventHandler').default;
const Platform = require('./Platform').default;
const NativeTVNavigationEventEmitter =
  require('../../src/private/specs_DEPRECATED/modules/NativeTVNavigationEventEmitter').default;

type BackPressEventName = 'backPress' | 'hardwareBackPress';
type BackPressHandler = (event: HardwareBackPressEvent) => ?boolean;

function emptyFunction(): void {}

/**
 * Detect hardware button presses for back navigation.
 *
 * Android: Detect hardware back button presses, and programmatically invoke the default back button
 * functionality to exit the app if there are no listeners or if none of the listeners return true.
 *
 * tvOS: Detect presses of the menu button on the TV remote.  (Still to be implemented:
 * programmatically disable menu button handling
 * functionality to exit the app if there are no listeners or if none of the listeners return true.)
 *
 * iOS: Not applicable.
 *
 * The event subscriptions are called in reverse order (i.e. last registered subscription first),
 * and if one subscription returns true then subscriptions registered earlier will not be called.
 *
 * Example:
 *
 * ```javascript
 * BackHandler.addEventListener('hardwareBackPress', function() {
 *  // this.onMainScreen and this.goBack are just examples, you need to use your own implementation here
 *  // Typically you would use the navigator here to go to the last state.
 *
 *  if (!this.onMainScreen()) {
 *    this.goBack();
 *    return true;
 *  }
 *  return false;
 * });
 * ```
 */

type TBackHandler = {
  exitApp(): void,
  addEventListener(
    eventName: BackPressEventName,
    handler: BackPressHandler,
  ): {remove: () => void, ...},
};

let BackHandler: TBackHandler = {
  exitApp: emptyFunction,
  addEventListener: function (
    _eventName: BackPressEventName,
    _handler: BackPressHandler,
  ): {remove: () => void, ...} {
    return {
      remove: emptyFunction,
    };
  },
};

if (Platform.isTV) {
  // Deprecated: use useBackHandler instead. Kept for backward compatibility
  // (e.g. React Navigation). addEventListener/removeEventListener keep the
  // native back handler counter in sync for unmigrated callers.
  const _backPressSubscriptions = new Set<() => ?boolean>();

  TVEventHandler.addListener(function (evt) {
    if (evt && evt.eventType === 'menu') {
      let invokeDefault = true;
      const subscriptions = Array.from(
        _backPressSubscriptions.values(),
      ).reverse();

      for (let i = 0; i < subscriptions.length; ++i) {
        if (subscriptions[i]()) {
          invokeDefault = false;
          break;
        }
      }

      if (invokeDefault) {
        // exitApp is a no-op on tvOS; reached only when a handler returns
        // false, which is a misuse (use enabled:false instead).
        BackHandler.exitApp();
      }
    }
  });

  BackHandler = {
    exitApp: emptyFunction,

    addEventListener: function (
      _eventName: BackPressEventName,
      _handler: () => ?boolean,
    ): {remove: () => void, ...} {
      _backPressSubscriptions.add(_handler);
      // Keep the native counter in sync for unmigrated callers.
      if (NativeTVNavigationEventEmitter != null) {
        NativeTVNavigationEventEmitter.incrementBackHandlerCount();
      }
      return {
        remove: () => BackHandler.removeEventListener(_eventName, _handler),
      };
    },

    removeEventListener: function (
      _eventName: BackPressEventName,
      _handler: () => ?boolean,
    ) {
      if (_backPressSubscriptions.has(_handler)) {
        _backPressSubscriptions.delete(_handler);
        if (NativeTVNavigationEventEmitter != null) {
          NativeTVNavigationEventEmitter.decrementBackHandlerCount();
        }
      }
    },
  };
}

export default BackHandler;
