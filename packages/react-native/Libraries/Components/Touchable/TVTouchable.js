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

import Platform from '../../Utilities/Platform';
import tagForComponentOrHandle from '../TV/tagForComponentOrHandle';
import {tvFocusEventHandler} from '../TV/TVFocusEventHandler';
import invariant from 'invariant';
import Pressability from '../../Pressability/Pressability';

export default class TVTouchable {
  _enabled: boolean = false;
  _focusEventHandler: ?any = null;
  _viewTag: ?number = null;
  _pressability: ?Pressability = null;

  constructor(component: any, pressability: Pressability) {
    invariant(Platform.isTV, 'TVTouchable: Requires `Platform.isTV`.');
    if (!Platform.isTV) {
      return;
    }
    const _tvtouchable = this; // eslint-disable-line consistent-this
    this._pressability = pressability;

    this._viewTag = tagForComponentOrHandle(component);
    tvFocusEventHandler?.register(this._viewTag, tvData => {
      if (!_tvtouchable._enabled) {
        return;
      }
      this._pressability?.getEventHandlers()?.onTVEvent(tvData);
    });
    this._enabled = true;
  }

  destroy(): void {
    this._enabled = false;
    tvFocusEventHandler?.unregister(this._viewTag);
    this._pressability?.reset();
  }
}
