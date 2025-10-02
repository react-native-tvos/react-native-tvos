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

export type TVParallaxPropertiesType = $ReadOnly<{|
  /**
   * If true, parallax effects are enabled.  Defaults to true.
   */
  enabled?: boolean,

  /**
   * Defaults to 2.0.
   */
  shiftDistanceX?: number,

  /**
   * Defaults to 2.0.
   */
  shiftDistanceY?: number,

  /**
   * Defaults to 0.05.
   */
  tiltAngle?: number,

  /**
   * Defaults to 1.0
   */
  magnification?: number,

  /**
   * Defaults to 1.0
   */
  pressMagnification?: number,

  /**
   * Defaults to 0.3
   */
  pressDuration?: number,

  /**
   * Defaults to 0.3
   */
  pressDelay?: number,
|}>;

/**
 * These props are for both Apple TV and Android TV.
 * TODO: update `@react-native/eslint-plugin` so that the
 * name can be changed to TVViewProps
 */
export type TVViewProps = $ReadOnly<{|
  /**
   * @deprecated Replaced by `focusable`.
   *
   * @platform ios
   */
  isTVSelectable?: ?boolean,

  /**
   * Whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
   *
   */
  focusable?: ?boolean,

  /**
   * May be set to true to force the focus engine to move focus to this view.
   *
   */
  hasTVPreferredFocus?: ?boolean,

  /**
   * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
   *
   * @platform ios
   */
  tvParallaxProperties?: ?TVParallaxPropertiesType,

  /**
   * Additional properties needed for flow checks on TVFocusGuideView
   */
  destinations?: ?(Object[]),
  enabled?: boolean,
  autoFocus?: boolean,
  safePadding?: string | null,
  onPressIn?: (event: any) => void,
  onPressOut?: (event: any) => void,

  /**
   * TV next focus forward (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusForward?: ?number,

  /**
   * TV next focus down (see documentation for the View component).
   *
   */
  nextFocusDown?: ?number,

  /**
   * TV next focus left (see documentation for the View component).
   *
   */
  nextFocusLeft?: ?number,

  /**
   * TV next focus right (see documentation for the View component).
   *
   */
  nextFocusRight?: ?number,

  /**
   * TV next focus up (see documentation for the View component).
   *
   */
  nextFocusUp?: ?number,
|}>;
