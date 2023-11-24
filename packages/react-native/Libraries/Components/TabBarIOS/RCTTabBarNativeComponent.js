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

const requireNativeComponent = require('../../ReactNative/requireNativeComponent').default;

import type {ViewProps} from '../View/ViewPropTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  unselectedTintColor?: ColorValue,
  tintColor?: ColorValue,
  unselectedItemTintColor?: ColorValue,
  barTintColor?: ColorValue,
  barStyle?: ?('default' | 'black'),
  translucent?: ?boolean,
  itemPositioning?: ?('fill' | 'center' | 'auto'),
|}>;

// type RCTTabBarNativeType = Class<NativeComponent<NativeProps>>;

module.exports = (requireNativeComponent<NativeProps>('RCTTabBar'): any);
