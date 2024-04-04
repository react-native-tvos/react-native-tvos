/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import invariant from 'invariant';
import ReactNative from '../../Renderer/shims/ReactNative';
import type {
  BlurEvent,
  FocusEvent,
  PressEvent,
} from '../../Types/CoreEventTypes';
import Platform from '../../Utilities/Platform';
import TVEventHandler from '../../Components/TV/TVEventHandler';

type TVTouchableConfig = $ReadOnly<{|
  getDisabled: () => boolean,
  onBlur: (event: BlurEvent) => mixed,
  onFocus: (event: FocusEvent) => mixed,
  onPress: (event: PressEvent) => mixed,
  onLongPress: (event: PressEvent) => mixed,
|}>;

export default class TVTouchable {
  _tvEventHandler: TVEventHandler = null;
  _enabled: boolean = false;

  constructor(component: any, config: TVTouchableConfig) {
    invariant(Platform.isTV, 'TVTouchable: Requires `Platform.isTV`.');
    this._tvEventHandler = new TVEventHandler();
    const _tvtouchable = this;
    this._tvEventHandler.enable(component, (_, tvData) => {
      tvData.dispatchConfig = {};
      if (!_tvtouchable._enabled) {
        return;
      }
      if (ReactNative.findNodeHandle(component) === tvData.tag) {
        if (tvData.eventType === 'focus') {
          config.onFocus(tvData);
        } else if (tvData.eventType === 'blur') {
          config.onBlur(tvData);
        } else if (tvData.eventType === 'select') {
          if (!config.getDisabled()) {
            config.onPress(tvData);
          }
        } else if (tvData.eventType === 'longSelect') {
          if (!config.getDisabled()) {
            config.onLongPress(tvData);
          }
        }
      }
    });
    this._enabled = true;
  }

  destroy(): void {
    this._enabled = false;
    this._tvEventHandler.disable();
    this._tvEventHandler = null;
  }
}
