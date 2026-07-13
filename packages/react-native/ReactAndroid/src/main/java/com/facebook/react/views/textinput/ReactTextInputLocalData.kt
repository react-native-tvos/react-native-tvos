/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.annotation.TargetApi
import android.os.Build
import android.text.Layout
import android.text.SpannableStringBuilder
import android.util.TypedValue
import android.widget.EditText

/** Local state bearer for EditText instance. */
// EditText break-strategy accessors / Layout constants below were added in API 23 (M).
@TargetApi(Build.VERSION_CODES.M)
public class ReactTextInputLocalData(editText: EditText) {
  private val text = SpannableStringBuilder(editText.text)
  private val textSize = editText.textSize
  private val minLines = editText.minLines
  private val maxLines = editText.maxLines
  private val inputType = editText.inputType
  // EditText.getBreakStrategy was introduced in API 23 (M).
  private val breakStrategy =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) editText.breakStrategy
      else Layout.BREAK_STRATEGY_SIMPLE
  private val placeholder: CharSequence? = editText.hint

  public fun apply(editText: EditText) {
    editText.text = text
    editText.setTextSize(TypedValue.COMPLEX_UNIT_PX, textSize)
    editText.minLines = minLines
    editText.maxLines = maxLines
    editText.inputType = inputType
    editText.hint = placeholder
    // EditText.setBreakStrategy was introduced in API 23 (M).
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      editText.breakStrategy = breakStrategy
    }
  }
}
