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
 * Additional View properties for Apple and Android TV
 */
export type TVViewProps = $ReadOnly<{|
  /**
   * When set to true, this view will be focusable
   * and navigable using the TV remote.
   *
   * @platform ios, android
   */
  isTVSelectable?: boolean,

  /**
   * *(TV only)* May be set to true to force the TV focus engine to move focus to this view.
   *
   * @platform ios, android
   */
  hasTVPreferredFocus?: boolean,

  /**
   * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
   *
   * @platform ios
   */
  tvParallaxProperties?: TVParallaxPropertiesType,

|}>;
