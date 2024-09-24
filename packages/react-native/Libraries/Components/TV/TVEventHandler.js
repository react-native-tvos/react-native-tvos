/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {TVRemoteEvent} from '../../Types/CoreEventTypes';

import NativeTVNavigationEventEmitter from '../../../src/private/specs/modules/NativeTVNavigationEventEmitter';
import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import Platform from '../../Utilities/Platform';
import {type EventSubscription} from '../../vendor/emitter/EventEmitter';

let __nativeTVNavigationEventEmitter: ?NativeEventEmitter<TVRemoteEvent> = null;

const TVEventHandler: {
  addListener: (
    callback: (event: any) => void,
  ) => EventSubscription | {remove: () => void},
} = {
  addListener: callback => {
    if (Platform.OS === 'ios' && !NativeTVNavigationEventEmitter) {
      return {remove: () => {}};
    }
    if (!__nativeTVNavigationEventEmitter) {
      __nativeTVNavigationEventEmitter = new NativeEventEmitter<TVRemoteEvent>(
        NativeTVNavigationEventEmitter,
      );
    }
    const subscription: EventSubscription =
      __nativeTVNavigationEventEmitter.addListener(
        // $FlowFixMe[prop-missing]
        'onHWKeyEvent',
        (data: any) => {
          if (callback) {
            callback(data);
          }
        },
      );
    return subscription;
  },
};

module.exports = TVEventHandler;
