/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.common

import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration

/** Utility object providing static methods for working with UI mode properties from Context. */
internal object UiModeUtils {

  private var isTVDeviceCached: Boolean? = null

  /**
   * Determines whether the device is a TV (Android TV / Fire TV).
   * The result is cached after the first call.
   *
   * @param context The context to check the UI mode from
   * @return true if the device is running in television mode, false otherwise
   */
  @JvmStatic
  fun isTVDevice(context: Context): Boolean {
    return isTVDeviceCached ?: run {
      val uiModeManager = context.getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager
      val result = uiModeManager?.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
      isTVDeviceCached = result
      result
    }
  }

  /**
   * Determines whether the current UI mode is dark mode
   *
   * @param context The context to check the UI mode from
   * @return true if the current UI mode is dark mode, false otherwise
   */
  @JvmStatic
  fun isDarkMode(context: Context): Boolean =
      context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
          Configuration.UI_MODE_NIGHT_YES
}
