/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

/**
 * Class responsible for handling layout view creation animation, applied to view whenever a valid
 * config was supplied for the layout animation of CREATE type.
 */
internal class LayoutCreateAnimation : BaseLayoutAnimation() {

  override fun isReverse(): Boolean = false
}