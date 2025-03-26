package com.facebook.react.uimanager.drawable

import android.annotation.TargetApi
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.View

internal abstract class Drawable: Drawable() {
  @TargetApi(Build.VERSION_CODES.M)
  override fun getLayoutDirection(): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      return super.getLayoutDirection()
    }

    return View.LAYOUT_DIRECTION_LTR;
  }
}
