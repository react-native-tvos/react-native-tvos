/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.annotation.TargetApi
import android.os.Build
import android.view.View

/**
 * Package-local base [android.graphics.drawable.LayerDrawable] for React Native's drawable
 * subsystem.
 *
 * [android.graphics.drawable.Drawable.getLayoutDirection] was only introduced in API 23 (M).
 * [CompositeBackgroundDrawable] reads `layoutDirection` internally, which would throw a
 * [NoSuchMethodError] on API 22. By declaring the override here (and guarding the `super` call),
 * it stays runtime-safe on API 22 while remaining a real framework [LayerDrawable].
 */
internal abstract class LayerDrawable(layers: Array<android.graphics.drawable.Drawable?>) :
    android.graphics.drawable.LayerDrawable(layers) {
  @TargetApi(Build.VERSION_CODES.M)
  override fun getLayoutDirection(): Int =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        super.getLayoutDirection()
      } else {
        View.LAYOUT_DIRECTION_LTR
      }
}
