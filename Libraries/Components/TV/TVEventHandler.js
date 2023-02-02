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

import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import Platform from '../../Utilities/Platform';
import {type EventSubscription} from '../../vendor/emitter/EventEmitter';
import NativeTVNavigationEventEmitter from './NativeTVNavigationEventEmitter';
import type {TVRemoteEvent} from '../../Types/CoreEventTypes';

class TVEventHandler {
  __nativeTVNavigationEventListener: ?EventSubscription = null;
  __nativeTVNavigationEventEmitter: ?NativeEventEmitter<TVRemoteEvent> = null;

  enable(component: ?any, callback: Function): void {
    if (Platform.OS === 'ios' && !NativeTVNavigationEventEmitter) {
      return;
    }

    this.__nativeTVNavigationEventEmitter = new NativeEventEmitter<TVRemoteEvent>(
      NativeTVNavigationEventEmitter,
    );
    this.__nativeTVNavigationEventListener = this.__nativeTVNavigationEventEmitter.addListener(
      // $FlowFixMe[prop-missing]
      'onHWKeyEvent',
      data => {
        if (callback) {
          callback(component, data);
        }
      },
    );
  }

  disable(): void {
    if (this.__nativeTVNavigationEventListener) {
      this.__nativeTVNavigationEventListener.remove();
      delete this.__nativeTVNavigationEventListener;
    }
    if (this.__nativeTVNavigationEventEmitter) {
      delete this.__nativeTVNavigationEventEmitter;
    }
  }
}

module.exports = TVEventHandler;
