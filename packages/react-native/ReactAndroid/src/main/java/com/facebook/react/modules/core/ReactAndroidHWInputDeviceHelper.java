/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import com.facebook.react.common.SystemClock;
import com.facebook.react.config.ReactFeatureFlags;

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
          .put(KeyEvent.KEYCODE_NUMPAD_ENTER, "select")
          .put(KeyEvent.KEYCODE_BUTTON_SELECT, "select")
          .put(KeyEvent.KEYCODE_SPACE, "select")
          .put(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, "playPause")
          .put(KeyEvent.KEYCODE_MEDIA_PLAY, "play")
          .put(KeyEvent.KEYCODE_MEDIA_PAUSE, "pause")
          .put(KeyEvent.KEYCODE_MEDIA_NEXT, "next")
          .put(KeyEvent.KEYCODE_MEDIA_PREVIOUS, "previous")
          .put(KeyEvent.KEYCODE_MEDIA_REWIND, "rewind")
          .put(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, "fastForward")
          .put(KeyEvent.KEYCODE_MEDIA_RECORD, "record")
          .put(KeyEvent.KEYCODE_MEDIA_STOP, "stop")
          .put(KeyEvent.KEYCODE_MEDIA_NEXT, "next")
          .put(KeyEvent.KEYCODE_MEDIA_PREVIOUS, "previous")
          .put(KeyEvent.KEYCODE_DPAD_UP, "up")
          .put(KeyEvent.KEYCODE_DPAD_RIGHT, "right")
          .put(KeyEvent.KEYCODE_DPAD_DOWN, "down")
          .put(KeyEvent.KEYCODE_DPAD_LEFT, "left")
          .put(KeyEvent.KEYCODE_INFO, "info")
          .put(KeyEvent.KEYCODE_CAPTIONS, "captions")
          .put(KeyEvent.KEYCODE_MENU, "menu")
          .put(KeyEvent.KEYCODE_0, "0")
          .put(KeyEvent.KEYCODE_1, "1")
          .put(KeyEvent.KEYCODE_2, "2")
          .put(KeyEvent.KEYCODE_3, "3")
          .put(KeyEvent.KEYCODE_4, "4")
          .put(KeyEvent.KEYCODE_5, "5")
          .put(KeyEvent.KEYCODE_6, "6")
          .put(KeyEvent.KEYCODE_7, "7")
          .put(KeyEvent.KEYCODE_8, "8")
          .put(KeyEvent.KEYCODE_9, "9")
          .put(KeyEvent.KEYCODE_CHANNEL_DOWN, "channelDown")
          .put(KeyEvent.KEYCODE_CHANNEL_UP, "channelUp")
          .put(KeyEvent.KEYCODE_BOOKMARK, "bookmark")
          .put(KeyEvent.KEYCODE_AVR_INPUT, "avrInput")
          .put(KeyEvent.KEYCODE_AVR_POWER, "avrPower")
          .put(KeyEvent.KEYCODE_DVR, "dvr")
          .put(KeyEvent.KEYCODE_GUIDE, "guide")
          .put(KeyEvent.KEYCODE_PROG_RED, "red")
          .put(KeyEvent.KEYCODE_PROG_GREEN, "green")
          .put(KeyEvent.KEYCODE_PROG_BLUE, "blue")
          .put(KeyEvent.KEYCODE_PROG_YELLOW, "yellow")
          .put(KeyEvent.KEYCODE_STB_INPUT, "stbInput")
          .put(KeyEvent.KEYCODE_STB_POWER, "stbPower")
          .put(KeyEvent.KEYCODE_TV, "tv")
          .put(KeyEvent.KEYCODE_TV_INPUT, "tvInput")
          .put(KeyEvent.KEYCODE_WINDOW, "window")
          .put(KeyEvent.KEYCODE_TV_TELETEXT, "teletext")
          .build();

  private static final Map<Integer, String> KEY_EVENTS_LONG_PRESS_ACTIONS =
      MapBuilder.<Integer, String>builder()
          .put(KeyEvent.KEYCODE_DPAD_CENTER, "longSelect")
          .put(KeyEvent.KEYCODE_ENTER, "longSelect")
          .put(KeyEvent.KEYCODE_NUMPAD_ENTER, "longSelect")
          .put(KeyEvent.KEYCODE_BUTTON_SELECT, "longSelect")
          .put(KeyEvent.KEYCODE_DPAD_UP, "longUp")
          .put(KeyEvent.KEYCODE_DPAD_RIGHT, "longRight")
          .put(KeyEvent.KEYCODE_DPAD_DOWN, "longDown")
          .put(KeyEvent.KEYCODE_DPAD_LEFT, "longLeft")
          .put(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, "longPlayPause")
          .put(KeyEvent.KEYCODE_MEDIA_REWIND, "longRewind")
          .put(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, "longFastForward")
          .put(KeyEvent.KEYCODE_CHANNEL_DOWN, "longChannelDown")
          .put(KeyEvent.KEYCODE_CHANNEL_UP, "longChannelUp")
          .build();

  /**
   * We keep a reference to the last focused view id so that we can send it as a target for key
   * events and be able to send a blur event when focus changes.
   */
  private int mLastFocusedViewId = View.NO_ID;

  // Presses longer than this number of milliseconds are treated as long presses
  // This seems to be roughly the time the emulator waits after the first key down event
  // before sending a continuous stream of rapid key downs on a long press.
  private long mLongPressedDelta = 300;

  // These are used for long press detection
  private long mLastKeyDownTime = 0;
  private boolean longPressEventActive = false;
  private boolean longPressEventStarted = false;

  public ReactAndroidHWInputDeviceHelper() {}

  private boolean isSelectEvent(int eventKeyCode) {
    return eventKeyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
      eventKeyCode == KeyEvent.KEYCODE_BUTTON_SELECT ||
      eventKeyCode == KeyEvent.KEYCODE_NUMPAD_ENTER ||
      eventKeyCode == KeyEvent.KEYCODE_ENTER;
  }

  /** Only the up/right/down/left arrows. The dpad center button is not included */
  private boolean isDPadEvent(int eventKeyCode) {
    return eventKeyCode == KeyEvent.KEYCODE_DPAD_UP ||
      eventKeyCode == KeyEvent.KEYCODE_DPAD_RIGHT ||
      eventKeyCode == KeyEvent.KEYCODE_DPAD_DOWN ||
      eventKeyCode == KeyEvent.KEYCODE_DPAD_LEFT;
  }

  // True if we are in the long press state and we are more than
  // mLongPressedDelta milliseconds since the last long press event was fired
  private boolean isLongPressEventTime(long time) {
    return mLastKeyDownTime != 0 && time - mLastKeyDownTime > mLongPressedDelta;
  }

  /** Called from {@link com.facebook.react.ReactRootView}. This is the main place the key events are handled. */
  public void handleKeyEvent(KeyEvent ev, ReactContext context) {
    int eventKeyCode = ev.getKeyCode();
    int eventKeyAction = ev.getAction();
    long time = SystemClock.uptimeMillis();
    boolean isSelectOrDPadEvent = isDPadEvent(eventKeyCode) || isSelectEvent(eventKeyCode);

    // Simple implementation of long press detection for key down events
    if ((eventKeyAction == KeyEvent.ACTION_DOWN) && isSelectOrDPadEvent) {
      if (mLastKeyDownTime == 0) {
        mLastKeyDownTime = time;
      } else {
        if (isLongPressEventTime(time)) {
          // Activate long press state and don't reset until key up event arrives
          longPressEventActive = true;
        }
      }
    }

    if (shouldDispatchEvent(eventKeyCode, eventKeyAction, time)) {
      if(longPressEventActive) {
        // For long presses, only send the first key down event (aligns with Apple TV gesture detection behavior)
        if(!longPressEventStarted || eventKeyAction == KeyEvent.ACTION_UP) {
          dispatchEvent(
            KEY_EVENTS_LONG_PRESS_ACTIONS.get(eventKeyCode),
            mLastFocusedViewId,
            eventKeyAction,
            context
          );
          longPressEventStarted = true;
        }
        // Update the start time for detecting the next long press event
        mLastKeyDownTime = time;
      } else {
        dispatchEvent(KEY_EVENTS_ACTIONS.get(eventKeyCode), mLastFocusedViewId, eventKeyAction, context);
      }
    }

    // If this is key up event, reset long press detector
    if ((eventKeyAction == KeyEvent.ACTION_UP) && isSelectOrDPadEvent) {
      mLastKeyDownTime = 0;
      longPressEventActive = false;
      longPressEventStarted = false;
    }

  }

  // Android TV: Only send key up actions, unless key down events are enabled or we need to send a long press event
  private boolean shouldDispatchEvent(int eventKeyCode, int eventKeyAction, long time) {
    return KEY_EVENTS_ACTIONS.containsKey(eventKeyCode) && (
      (eventKeyAction == KeyEvent.ACTION_UP) ||
      (eventKeyAction == KeyEvent.ACTION_DOWN && !longPressEventActive && ReactFeatureFlags.enableKeyDownEvents) ||
      (eventKeyAction == KeyEvent.ACTION_DOWN && longPressEventActive && isLongPressEventTime(time))
    );
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
