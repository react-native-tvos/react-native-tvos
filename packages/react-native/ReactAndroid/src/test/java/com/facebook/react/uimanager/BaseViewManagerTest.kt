/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.view.View.OnFocusChangeListener
import android.app.UiModeManager
import android.content.res.Configuration
import com.facebook.react.R
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.common.UiModeUtils
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowArguments
import java.util.Locale
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowUIModeManager

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class, ShadowUIModeManager::class])
class BaseViewManagerTest {
  private lateinit var viewManager: BaseViewManager<ReactViewGroup, *>
  private lateinit var view: ReactViewGroup
  private lateinit var themedReactContext: ThemedReactContext

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    viewManager = ReactViewManager()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    themedReactContext = ThemedReactContext(context, context, null, -1)
    view = ReactViewGroup(themedReactContext)
  }

  @Test
  fun testAccessibilityRoleNone() {
    viewManager.setAccessibilityRole(view, "none")
    Assertions.assertThat(view.getTag(R.id.accessibility_role))
        .isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.NONE)
  }

  @Test
  fun testAccessibilityRoleTurkish() {
    Locale.setDefault(Locale.forLanguageTag("tr-TR"))
    viewManager.setAccessibilityRole(view, "image")
    Assertions.assertThat(view.getTag(R.id.accessibility_role))
        .isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.IMAGE)
  }

  @Test
  fun testAccessibilityStateSelected() {
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("selected", true)
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.getTag(R.id.accessibility_state)).isEqualTo(accessibilityState)
    Assertions.assertThat(view.isSelected).isEqualTo(true)
  }

  private fun setTvMode(television: Boolean) {
    val uiModeManager =
        RuntimeEnvironment.getApplication().getSystemService(UiModeManager::class.java)!!
    shadowOf(uiModeManager)
        .setCurrentModeType(
            if (television) Configuration.UI_MODE_TYPE_TELEVISION
            else Configuration.UI_MODE_TYPE_NORMAL)
    val field = UiModeUtils::class.java.getDeclaredField("isTVDeviceCached")
    field.isAccessible = true
    field.set(UiModeUtils::class.java.getDeclaredField("INSTANCE").get(null), null)
  }

  @Test
  fun testAccessibilityStateDisabledDisablesNonFocusableView() {
    setTvMode(television = false)
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("disabled", true)
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.getTag(R.id.accessibility_state)).isEqualTo(accessibilityState)
    Assertions.assertThat(view.isEnabled).isFalse()
  }

  @Test
  fun testAccessibilityStateDisabledDisablesFocusableViewOutsideTv() {
    setTvMode(television = false)
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("disabled", true)
    view.isFocusable = true
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.isEnabled).isFalse()
  }

  @Test
  fun testAccessibilityStateDisabledKeepsFocusableViewEnabledOnTv() {
    setTvMode(television = true)
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("disabled", true)
    view.isFocusable = true
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.getTag(R.id.accessibility_state)).isEqualTo(accessibilityState)
    Assertions.assertThat(view.isEnabled).isTrue()
  }

  @Test
  fun testFocusableReEnablesDisabledViewOnTv() {
    setTvMode(television = true)
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("disabled", true)
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.isEnabled).isFalse()
    (viewManager as ReactViewManager).setFocusable(view, true)
    Assertions.assertThat(view.isEnabled).isTrue()
  }

  @Test
  fun testFocusableDoesNotEnableDisabledViewOutsideTv() {
    setTvMode(television = false)
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("disabled", true)
    viewManager.setViewState(view, accessibilityState)
    (viewManager as ReactViewManager).setFocusable(view, true)
    Assertions.assertThat(view.isEnabled).isFalse()
  }

  @Test
  fun testRoleList() {
    viewManager.setRole(view, "list")
    Assertions.assertThat(view.getTag(R.id.role)).isEqualTo(ReactAccessibilityDelegate.Role.LIST)
  }

  @Test
  fun testAddEventEmittersDoesNotOverrideExistingEventEmitters() {
    val originalFocusListener = mock<OnFocusChangeListener>()
    view.onFocusChangeListener = originalFocusListener
    viewManager.addEventEmitters(themedReactContext, view)
    Assertions.assertThat(view.onFocusChangeListener).isNotEqualTo(originalFocusListener)
    view.onFocusChangeListener.onFocusChange(view, true)
    verify(originalFocusListener, times(1)).onFocusChange(view, true)
  }

  @Test
  fun testDroppingViewInstanceRestoresFocusChangeListener() {
    val originalFocusListener = mock<OnFocusChangeListener>()
    view.onFocusChangeListener = originalFocusListener
    viewManager.addEventEmitters(themedReactContext, view)
    Assertions.assertThat(view.onFocusChangeListener).isNotEqualTo(originalFocusListener)

    view.onFocusChangeListener.onFocusChange(view, true)
    verify(originalFocusListener, times(1)).onFocusChange(view, true)
    Assertions.assertThat(originalFocusListener).isNotEqualTo(view.onFocusChangeListener)

    viewManager.onDropViewInstance(view)
    view.onFocusChangeListener.onFocusChange(view, true)
    verify(originalFocusListener, times(2)).onFocusChange(view, true)
    Assertions.assertThat(originalFocusListener).isEqualTo(view.onFocusChangeListener)
  }

  @Test
  fun testAccessibilityLabelledByString() {
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject("target_id"))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isEqualTo("target_id")
  }

  @Test
  fun testAccessibilityLabelledByArray() {
    val array = JavaOnlyArray.of("first_id", "second_id")
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject(array))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isEqualTo("first_id")
  }

  @Test
  fun testAccessibilityLabelledByNullClearsTag() {
    view.setTag(R.id.labelled_by, "stale_id")
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject(null))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isNull()
  }

  @Test
  fun testAccessibilityLabelledByEmptyArrayDoesNotCrash() {
    view.setTag(R.id.labelled_by, "stale_id")
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject(JavaOnlyArray()))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isNull()
  }
}
