/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AccessibilityActionEvent} from '../../Components/View/ViewAccessibility';
import type {EdgeInsetsOrSizeProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
} from '../../Types/CoreEventTypes';
import type {TVParallaxPropertiesType} from '../TV/TVViewPropTypes';

import {type AccessibilityProps} from '../../Components/View/ViewAccessibility';
import {type ViewStyleProp} from '../../StyleSheet/StyleSheet';
import * as React from 'react';

export type TouchableWithoutFeedbackPropsIOS = {
  tvParallaxProperties?: TVParallaxPropertiesType,
};

export type TouchableWithoutFeedbackPropsAndroid = {
  /**
   * If true, doesn't play a system sound on touch.
   *
   * @platform android
   */
  touchSoundDisabled?: ?boolean,
};

export type TouchableWithoutFeedbackProps = $ReadOnly<
  {
    children?: ?React.Node,
    /**
     * Delay in ms, from onPressIn, before onLongPress is called.
     */
    delayLongPress?: ?number,
    /**
     * Delay in ms, from the start of the touch, before onPressIn is called.
     */
    delayPressIn?: ?number,
    /**
     * Delay in ms, from the release of the touch, before onPressOut is called.
     */
    delayPressOut?: ?number,
    /**
     * If true, disable all interactions for this component.
     */
    disabled?: ?boolean,
    /**
     * Whether this View should be focusable with a non-touch input device,
     * eg. receive focus with a hardware keyboard / TV remote.
     */
    focusable?: ?boolean,
    /**
     * This defines how far your touch can start away from the button.
     * This is added to pressRetentionOffset when moving off of the button.
     * NOTE The touch area never extends past the parent view bounds and
     * the Z-index of sibling views always takes precedence if a touch hits
     * two overlapping views.
     */
    hitSlop?: ?EdgeInsetsOrSizeProp,
    /**
     * Used to reference react managed views from native code.
     */
    id?: string,
    importantForAccessibility?: ?(
      | 'auto'
      | 'yes'
      | 'no'
      | 'no-hide-descendants'
    ),
    nativeID?: ?string,
    onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "blur" occurs, meaning the element lost focus.
     * Some platforms may not have the concept of blur.
     */
    onBlur?: ?(event: BlurEvent) => mixed,
    /**
     * When `accessible` is true (which is the default) this may be called when
     * the OS-specific concept of "focus" occurs. Some platforms may not have
     * the concept of focus.
     */
    onFocus?: ?(event: FocusEvent) => mixed,
    /**
     * Invoked on mount and layout changes with
     * {nativeEvent: {layout: {x, y, width, height}}}
     */
    onLayout?: ?(event: LayoutChangeEvent) => mixed,
    onLongPress?: ?(event: GestureResponderEvent) => mixed,
    /**
     * Called when the touch is released,
     * but not if cancelled (e.g. by a scroll that steals the responder lock).
     */
    onPress?: ?(event: GestureResponderEvent) => mixed,
    onPressIn?: ?(event: GestureResponderEvent) => mixed,
    onPressOut?: ?(event: GestureResponderEvent) => mixed,
    /**
     * When the scroll view is disabled, this defines how far your
     * touch may move off of the button, before deactivating the button.
     * Once deactivated, try moving it back and you'll see that the button
     * is once again reactivated! Move it back and forth several times
     * while the scroll view is disabled. Ensure you pass in a constant
     * to reduce memory allocations.
     */
    pressRetentionOffset?: ?EdgeInsetsOrSizeProp,
    rejectResponderTermination?: ?boolean,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID?: ?string,
    /**
     * //FIXME: not in doc but available in examples
     */
    style?: ?ViewStyleProp,
  } & TouchableWithoutFeedbackPropsAndroid &
    TouchableWithoutFeedbackPropsIOS &
    AccessibilityProps,
>;
