/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.tv

import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.ReactViewGroup
import java.lang.ref.WeakReference

public object TVFocusDebugManager {
  @Volatile public var enabled: Boolean = false
  @Volatile public var lastBlurredView: WeakReference<View?> = WeakReference(null)

  private var reactContext: WeakReference<ReactApplicationContext?> = WeakReference(null)

  public fun setContext(context: ReactApplicationContext) {
    reactContext = WeakReference(context)
  }

  public fun emitPreEvent(focused: View?, nextFocused: View?, direction: Int, rootView: View?) {
    val ctx = reactContext.get() ?: return
    if (!ctx.hasActiveReactInstance()) return

    val body = Arguments.createMap().apply {
      putString("eventType", "pre")
      putDouble("timestamp", System.currentTimeMillis().toDouble())
      putString("direction", directionToString(direction))
      putMap("currentlyFocused", if (focused != null) viewInfoFromView(focused) else null)
      putMap("nextFocused", if (nextFocused != null) viewInfoFromView(nextFocused) else null)
      putArray("allFocusables", collectFocusableViews(rootView))
    }
    ctx.emitDeviceEvent("onFocusDebugEvent", body)
  }

  public fun emitPostEvent(previousView: View?, focusedView: View?, rootView: View?) {
    val ctx = reactContext.get() ?: return
    if (!ctx.hasActiveReactInstance()) return

    val body = Arguments.createMap().apply {
      putString("eventType", "post")
      putDouble("timestamp", System.currentTimeMillis().toDouble())
      putString("direction", "unknown")
      putMap("currentlyFocused", if (previousView != null) viewInfoFromView(previousView) else null)
      putMap("nextFocused", if (focusedView != null) viewInfoFromView(focusedView) else null)
      putArray("allFocusables", collectFocusableViews(rootView))
    }
    ctx.emitDeviceEvent("onFocusDebugEvent", body)
  }

  private fun viewInfoFromView(view: View): WritableMap {
    val info = Arguments.createMap()
    info.putInt("tag", view.id)
    info.putString("viewName", view.javaClass.simpleName)

    val location = IntArray(2)
    view.getLocationOnScreen(location)
    val frame = Arguments.createMap().apply {
      // Keep parity with RN measure APIs and JS layout units by emitting DIP values.
      putDouble("x", PixelUtil.toDIPFromPixel(location[0].toFloat()).toDouble())
      putDouble("y", PixelUtil.toDIPFromPixel(location[1].toFloat()).toDouble())
      putDouble("width", PixelUtil.toDIPFromPixel(view.width.toFloat()).toDouble())
      putDouble("height", PixelUtil.toDIPFromPixel(view.height.toFloat()).toDouble())
    }
    info.putMap("frame", frame)

    val focusProps = Arguments.createMap().apply {
      putBoolean("focusable", view.isFocusable)
      if (view is ReactViewGroup) {
        putBoolean("hasTVPreferredFocus", view.hasTVPreferredFocus)
        putBoolean("trapFocusUp", getBoolField(view, "trapFocusUp"))
        putBoolean("trapFocusDown", getBoolField(view, "trapFocusDown"))
        putBoolean("trapFocusLeft", getBoolField(view, "trapFocusLeft"))
        putBoolean("trapFocusRight", getBoolField(view, "trapFocusRight"))
        putBoolean("autoFocus", getBoolField(view, "autoFocus"))
      } else {
        putBoolean("hasTVPreferredFocus", false)
        putBoolean("trapFocusUp", false)
        putBoolean("trapFocusDown", false)
        putBoolean("trapFocusLeft", false)
        putBoolean("trapFocusRight", false)
        putBoolean("autoFocus", false)
      }
    }
    info.putMap("focusProps", focusProps)

    val testID = view.contentDescription?.toString()
    if (!testID.isNullOrEmpty()) {
      info.putString("testID", testID)
    }

    return info
  }

  private fun getBoolField(obj: Any, fieldName: String): Boolean {
    return try {
      val field = obj.javaClass.getDeclaredField(fieldName)
      field.isAccessible = true
      field.getBoolean(obj)
    } catch (e: Exception) {
      false
    }
  }

  private fun collectFocusableViews(rootView: View?): WritableArray {
    val result = Arguments.createArray()
    if (rootView == null) return result

    val focusables = ArrayList<View>()
    rootView.addFocusables(focusables, View.FOCUS_DOWN, View.FOCUSABLES_ALL)
    for (view in focusables) {
      result.pushMap(viewInfoFromView(view))
    }
    return result
  }

  private fun directionToString(direction: Int): String {
    return when (direction) {
      View.FOCUS_UP -> "up"
      View.FOCUS_DOWN -> "down"
      View.FOCUS_LEFT -> "left"
      View.FOCUS_RIGHT -> "right"
      View.FOCUS_FORWARD -> "forward"
      View.FOCUS_BACKWARD -> "backward"
      else -> "unknown"
    }
  }
}

@ReactModule(name = TVFocusDebugModule.NAME)
public class TVFocusDebugModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  init {
    TVFocusDebugManager.setContext(reactContext)
  }

  override public fun getName(): String = NAME

  @ReactMethod
  public fun enable() {
    TVFocusDebugManager.enabled = true
  }

  @ReactMethod
  public fun disable() {
    TVFocusDebugManager.enabled = false
  }

  @ReactMethod
  public fun addListener(eventName: String) {
    // Required for RCTDeviceEventEmitter
  }

  @ReactMethod
  public fun removeListeners(count: Double) {
    // Required for RCTDeviceEventEmitter
  }

  public companion object {
    public const val NAME: String = "TVFocusDebug"
  }
}
