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

import NativeTVNavigationEventEmitter from '../../../src/private/specs_DEPRECATED/modules/NativeTVNavigationEventEmitter';
import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import Platform from '../../Utilities/Platform';
import {type EventSubscription} from '../../vendor/emitter/EventEmitter';

type TVRemoteEventDefinitions = {
  tag: [{tag: number}],
  target: [{target: number}],
  eventType: [{eventType: string}],
  eventKeyAction: [{eventKeyAction: string}],
  body: [{body: any}],
};
let __nativeTVNavigationEventEmitter: ?NativeEventEmitter<TVRemoteEventDefinitions> =
  null;

type TVRemoteEventBody = {
  state: string,
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
};

type TVRemoteEvent = {
  eventType: string,
  eventKeyAction: ?number,
  tag: ?number,
  body: ?TVRemoteEventBody,
};

type TVEventHandlerCallback = (event: TVRemoteEvent) => void;
type TVEventHandlerType = {
  addListener: (callback: TVEventHandlerCallback) => EventSubscription,
};

const TVEventHandler: TVEventHandlerType = {
  addListener: (callback: TVEventHandlerCallback) => {
    if (Platform.OS === 'ios' && !NativeTVNavigationEventEmitter) {
      return {remove: () => {}};
    }
    if (!__nativeTVNavigationEventEmitter) {
      __nativeTVNavigationEventEmitter =
        new NativeEventEmitter<TVRemoteEventDefinitions>(
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

export default TVEventHandler;
