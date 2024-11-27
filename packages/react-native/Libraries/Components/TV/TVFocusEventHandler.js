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

import Platform from '../../Utilities/Platform';
import {type EventSubscription} from '../../vendor/emitter/EventEmitter';
import TVEventHandler from './TVEventHandler';

class TVFocusEventHandler {
  __subscription: ?EventSubscription = null;
  __callbackMap: Map<any, Function> = new Map();

  constructor() {
    this.__subscription = TVEventHandler.addListener((data: TVRemoteEvent) => {
      const callback = this.__callbackMap.get(data.tag);
      if (callback) {
        callback(data);
      }
    });
  }

  register(componentTag: ?any, callback: Function): void {
    this.__callbackMap.set(componentTag, callback);
  }

  unregister(componentTag: ?any): void {
    this.__callbackMap.delete(componentTag);
  }
}

export const tvFocusEventHandler: TVFocusEventHandler | null = Platform.isTV
  ? new TVFocusEventHandler()
  : null;
