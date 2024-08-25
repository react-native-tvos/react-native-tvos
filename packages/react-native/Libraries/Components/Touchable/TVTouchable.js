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
import tagForComponentOrHandle from '../TV/tagForComponentOrHandle';
import type {
  BlurEvent,
  FocusEvent,
  PressEvent,
} from '../../Types/CoreEventTypes';
import Platform from '../../Utilities/Platform';
import {tvFocusEventHandler} from '../TV/TVFocusEventHandler';

type TVTouchableConfig = $ReadOnly<{|
  getDisabled: () => boolean,
  onBlur: (event: BlurEvent) => mixed,
  onFocus: (event: FocusEvent) => mixed,
  onPress: (event: PressEvent) => mixed,
  onLongPress: (event: PressEvent) => mixed,
|}>;

export default class TVTouchable {
  _enabled: boolean = false;
  _focusEventHandler: ?any = null;
  _viewTag: ?number = null;

  constructor(component: any, config: TVTouchableConfig) {
    invariant(Platform.isTV, 'TVTouchable: Requires `Platform.isTV`.');
    if (!Platform.isTV) {
      return;
    }
    const _tvtouchable = this;
    this._viewTag = tagForComponentOrHandle(component);
    tvFocusEventHandler.register(this._viewTag, tvData => {
      if (!_tvtouchable._enabled) {
        return;
      }
      if (tagForComponentOrHandle(component) === tvData.tag) {
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
    tvFocusEventHandler.unregister(this._viewTag);
  }
}
