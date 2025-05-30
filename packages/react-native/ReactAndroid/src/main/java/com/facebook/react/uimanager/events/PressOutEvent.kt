package com.facebook.react.uimanager.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

public class PressOutEvent(surfaceId: Int, viewId: Int) :
  Event<PressOutEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  private companion object {
    private const val EVENT_NAME: String = "topPressOut"
  }
}
