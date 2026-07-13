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
 * Package-local base [android.graphics.drawable.Drawable] for React Native's drawable subsystem.
 *
 * [android.graphics.drawable.Drawable.getLayoutDirection] was only introduced in API 23 (M). The
 * drawables in this package read `layoutDirection` internally, which would throw a
 * [NoSuchMethodError] on API 22. By declaring the override here (and guarding the `super` call),
 * subclasses that extend this proxy instead of the framework class stay runtime-safe on API 22.
 */
internal abstract class Drawable : android.graphics.drawable.Drawable() {
  @TargetApi(Build.VERSION_CODES.M)
  override fun getLayoutDirection(): Int =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        super.getLayoutDirection()
      } else {
        View.LAYOUT_DIRECTION_LTR
      }
}
