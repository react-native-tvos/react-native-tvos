/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.config

import com.facebook.proguard.annotations.DoNotStripAny
import kotlin.jvm.JvmField

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * These values are safe defaults and should not require manual changes.
 */
@Deprecated("Use com.facebook.react.internal.featureflags.ReactNativeFeatureFlags instead.")
@DoNotStripAny
public object ReactFeatureFlags {
  @JvmField public var dispatchPointerEvents: Boolean = false
  /**
   * Android TV: Send key down events as well as key up events.
   * Enabling this flag will result in two 'select' TVRemoteEventHandler events
   * (one with key action 0 and one with key action 1) for each press of the center
   * DPad button. (Similarly for arrow keys.)
   * Note: If you enable this flag, long presses of the select or center button will
   * result in an initial 'select' with eventKeyAction = 0 (ACTION_DOWN), before
   * the expected 'longSelect' events are fired. (Similarly for arrow keys.)
   * TODO: Move this flag to ReactNativeFeatureFlags
   */
  @JvmField public var enableKeyDownEvents: Boolean = false
}
