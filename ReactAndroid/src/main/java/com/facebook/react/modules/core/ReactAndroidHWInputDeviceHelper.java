/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import android.view.KeyEvent;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;

import java.util.Map;

/** Responsible for dispatching events specific for hardware inputs. */
public class ReactAndroidHWInputDeviceHelper {

  /**
   * Contains a mapping between handled KeyEvents and the corresponding navigation event that should
   * be fired when the KeyEvent is received.
   */
  private static final Map<Integer, String> KEY_EVENTS_ACTIONS =
      MapBuilder.<Integer, String>builder()
          .put(KeyEvent.KEYCODE_DPAD_CENTER, "select")
          .put(KeyEvent.KEYCODE_ENTER, "select")
          .put(KeyEvent.KEYCODE_SPACE, "select")
          .put(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, "playPause")
          .put(KeyEvent.KEYCODE_MEDIA_PLAY, "play")
          .put(KeyEvent.KEYCODE_MEDIA_PAUSE, "pause")
          .put(KeyEvent.KEYCODE_MEDIA_NEXT, "next")
          .put(KeyEvent.KEYCODE_MEDIA_PREVIOUS, "previous")
          .put(KeyEvent.KEYCODE_MEDIA_REWIND, "rewind")
          .put(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, "fastForward")
          .put(KeyEvent.KEYCODE_DPAD_UP, "up")
          .put(KeyEvent.KEYCODE_DPAD_RIGHT, "right")
          .put(KeyEvent.KEYCODE_DPAD_DOWN, "down")
          .put(KeyEvent.KEYCODE_DPAD_LEFT, "left")
          .build();

  /**
   * We keep a reference to the last focused view id so that we can send it as a target for key
   * events and be able to send a blur event when focus changes.
   */
  private int mLastFocusedViewId = View.NO_ID;

  public ReactAndroidHWInputDeviceHelper() {}

  /** Called from {@link com.facebook.react.ReactRootView}. This is the main place the key events are handled. */
  public void handleKeyEvent(KeyEvent ev, ReactContext context) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    if ((eventKeyAction == KeyEvent.ACTION_UP || eventKeyAction == KeyEvent.ACTION_DOWN)
        && KEY_EVENTS_ACTIONS.containsKey(eventKeyCode)) {
      dispatchEvent(KEY_EVENTS_ACTIONS.get(eventKeyCode), mLastFocusedViewId, eventKeyAction, context);
    }
  }

  /** Called from {@link com.facebook.react.ReactRootView} when focused view changes. */
  public void onFocusChanged(View newFocusedView, ReactContext context) {
    if (mLastFocusedViewId == newFocusedView.getId()) {
      return;
    }
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId, context);
    }
    mLastFocusedViewId = newFocusedView.getId();
    dispatchEvent("focus", newFocusedView.getId(), context);
  }

  /** Called from {@link com.facebook.react.ReactRootView} when the whole view hierarchy looses focus. */
  public void clearFocus(ReactContext context) {
    if (mLastFocusedViewId != View.NO_ID) {
      dispatchEvent("blur", mLastFocusedViewId, context);
    }
    mLastFocusedViewId = View.NO_ID;
  }

  private void dispatchEvent(String eventType, int targetViewId, ReactContext context) {
    dispatchEvent(eventType, targetViewId, -1, context);
  }

  private void dispatchEvent(String eventType, int targetViewId, int eventKeyAction, ReactContext context) {
    WritableMap event = new WritableNativeMap();
    event.putString("eventType", eventType);
    event.putInt("eventKeyAction", eventKeyAction);
    if (targetViewId != View.NO_ID) {
      event.putInt("tag", targetViewId);
      event.putInt("target", targetViewId);
    }
    emitNamedEvent("onHWKeyEvent", event, context);
  }

  public void emitNamedEvent(String eventName, WritableMap event, ReactContext context) {
    if (context != null) {
      context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, event);
    }
  }

}
