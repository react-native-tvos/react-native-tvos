/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.view

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.content.Context
import android.graphics.BlendMode
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Bundle
import android.view.FocusFinder
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import android.view.ViewStructure
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.view.ViewCompat
import androidx.core.view.isNotEmpty
import android.view.accessibility.AccessibilityManager
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.UiThreadUtil.assertOnUiThread
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.common.ReactConstants.TAG
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.touch.OnInterceptTouchEventListener
import com.facebook.react.touch.ReactHitSlopView
import com.facebook.react.touch.ReactInterceptingViewGroup
import com.facebook.react.uimanager.BackgroundStyleApplicator.clipToPaddingBox
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBackgroundColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderColor
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderRadius
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderStyle
import com.facebook.react.uimanager.BackgroundStyleApplicator.setBorderWidth
import com.facebook.react.uimanager.BackgroundStyleApplicator.setFeedbackUnderlay
import com.facebook.react.uimanager.BlendModeHelper.needsIsolatedLayer
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.MeasureSpecAssertions.assertExplicitMeasureSpec
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.PointerEvents.Companion.canBeTouchTarget
import com.facebook.react.uimanager.PointerEvents.Companion.canChildrenBeTouchTarget
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.uimanager.ReactAxOrderHelper
import com.facebook.react.uimanager.ReactClippingProhibitedView
import com.facebook.react.uimanager.ReactClippingViewGroup
import com.facebook.react.uimanager.ReactClippingViewGroupHelper.calculateClippingRect
import com.facebook.react.uimanager.ReactOverflowViewWithInset
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.ReactZIndexedViewGroup
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupDrawingOrderHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil.getUIManagerType
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.PressInEvent
import com.facebook.react.uimanager.events.PressOutEvent
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderStyle
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.uimanager.style.Overflow
import com.facebook.react.views.view.CanvasUtil.enableZ
import java.lang.ref.WeakReference
import java.util.ArrayList
import kotlin.concurrent.Volatile
import kotlin.math.max

/**
 * Backing for a React View. Has support for borders, but since borders aren't common, lazy
 * initializes most of the storage needed for them.
 *
 * @param context A [Context] instance. It's Nullable to not break compatibility with OSS users
 *   (could be made non-null in the future but requires proper comms).
 */
public open class ReactViewGroup public constructor(context: Context?) :
    ViewGroup(context),
    ReactInterceptingViewGroup,
    ReactClippingViewGroup,
    ReactPointerEventsView,
    ReactHitSlopView,
    ReactZIndexedViewGroup,
    ReactOverflowViewWithInset {

  public override val overflowInset: Rect = Rect()

  private var focusDestinations = IntArray(0)
  private var autoFocus = false
  private var isFocusGuideTalkbackAccessibilityDelegateSet = false
  private var lastFocusedElement: WeakReference<View?>? = null
  private var mRecoverFocus = false
  private var originalIsFocusable = false
  private var trapFocusUp = false
  private var trapFocusDown = false
  private var trapFocusLeft = false
  private var trapFocusRight = false
  public var hasTVPreferredFocus: Boolean = false

  /**
   * This listener will be set for child views when `removeClippedSubview` property is enabled. When
   * children layout is updated, it will call [updateSubviewClipStatus] to notify parent view about
   * that fact so that view can be attached/detached if necessary.
   *
   * TODO(7728005): Attach/detach views in batch - once per frame in case when multiple children
   *   update their layout.
   */
  public class ChildrenLayoutChangeListener(private var parent: ReactViewGroup?) :
      OnLayoutChangeListener {
    override fun onLayoutChange(
        v: View,
        left: Int,
        top: Int,
        right: Int,
        bottom: Int,
        oldLeft: Int,
        oldTop: Int,
        oldRight: Int,
        oldBottom: Int,
    ) {
      if (parent?.removeClippedSubviews == true) {
        parent?.updateSubviewClipStatus(v)
      }
    }

    public fun shutdown() {
      parent = null
    }
  }

  private var recycleCount = 0

  /**
   * Following properties are here to support the option [removeClippedSubviews]. This is a
   * temporary optimization/hack that is mainly applicable to the large list of images. The way it's
   * implemented is that we store an additional array of children in view node. We selectively
   * remove some of the views (detach) from it while still storing them in that additional array. We
   * override all possible add methods for [ViewGroup] so that we can control this process whenever
   * the option is set. We also override [ViewGroup#getChildAt] and [ViewGroup#getChildCount] so
   * those methods may return views that are not attached. This is risky but allows us to perform a
   * correct cleanup in `NativeViewHierarchyManager`.
   */
  internal var _removeClippedSubviews = false

  @Volatile private var inSubviewClippingLoop = false
  private var allChildren: Array<View?>? = null
  internal var allChildrenCount: Int = 0
    private set

  internal var clippingRect: Rect? = null

  public override var hitSlopRect: Rect? = null
  public override var pointerEvents: PointerEvents = PointerEvents.AUTO

  public var axOrderList: MutableList<String>? = null

  private var childrenLayoutChangeListener: ChildrenLayoutChangeListener? = null
  private var onInterceptTouchEventListener: OnInterceptTouchEventListener? = null
  private var needsOffscreenAlphaCompositing = false
  private var backfaceOpacity = 0f
  private var backfaceVisible = false
  private var childrenRemovedWhileTransitioning: MutableSet<Int>? = null
  private var accessibilityStateChangeListener:
      AccessibilityManager.AccessibilityStateChangeListener? =
      null
  private var focusOnAttach = false

  init {
    initView()
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactViewGroup is recycled.
   */
  private fun initView() {
    clipChildren = false

    _removeClippedSubviews = false
    inSubviewClippingLoop = false
    allChildren = null
    allChildrenCount = 0
    clippingRect = null
    hitSlopRect = null
    _overflow = Overflow.VISIBLE
    pointerEvents = PointerEvents.AUTO
    ImportantForInteractionHelper.setImportantForInteraction(this, pointerEvents)
    childrenLayoutChangeListener = null
    onInterceptTouchEventListener = null
    needsOffscreenAlphaCompositing = false
    _drawingOrderHelper = null
    backfaceOpacity = 1f
    backfaceVisible = true
    childrenRemovedWhileTransitioning = null
  }

  internal open fun recycleView() {
    recycleCount++

    // Remove dangling listeners
    val allChildren = allChildren
    if (allChildren != null && childrenLayoutChangeListener != null) {
      childrenLayoutChangeListener?.shutdown()
      for (i in 0..<allChildrenCount) {
        allChildren[i]?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
      }
    }

    // Set default field values
    initView()
    overflowInset.setEmpty()

    // Remove any children
    removeAllViews()

    // If the view is still attached to a parent, we need to remove it from the parent
    // before we can recycle it.
    if (parent != null) {
      (parent as ViewGroup).removeView(this)
    }

    // Reset background, borders
    updateBackgroundDrawable(null)

    resetPointerEvents()

    cleanupFocusGuideTalkbackAccessibilityDelegate()

    // In case a focus was attempted but the view never attached, reset to false
    focusOnAttach = false
  }

  private var _drawingOrderHelper: ViewGroupDrawingOrderHelper? = null
  private val drawingOrderHelper: ViewGroupDrawingOrderHelper
    get() {
      if (_drawingOrderHelper == null) {
        _drawingOrderHelper = ViewGroupDrawingOrderHelper(this)
      }
      return requireNotNull(_drawingOrderHelper)
    }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec)

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec),
        MeasureSpec.getSize(heightMeasureSpec),
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op since UIManager handles actually laying out children.
  }

  @SuppressLint("MissingSuperCall")
  override fun requestLayout() {
    // No-op, terminate `requestLayout` here, UIManager handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }

  @TargetApi(23)
  override fun dispatchProvideStructure(structure: ViewStructure) {
    try {
      super.dispatchProvideStructure(structure)
    } catch (e: NullPointerException) {
      FLog.e(TAG, "NullPointerException when executing dispatchProvideStructure", e)
    }
  }

  override fun setBackgroundColor(color: Int) {
    setBackgroundColor(this, color)
  }

  @Deprecated(
      "setTranslucentBackgroundDrawable is deprecated since React Native 0.76.0 and will be removed in a future version"
  )
  public fun setTranslucentBackgroundDrawable(background: Drawable?) {
    setFeedbackUnderlay(this, background)
  }

  public override fun setOnInterceptTouchEventListener(listener: OnInterceptTouchEventListener) {
    onInterceptTouchEventListener = listener
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    if (onInterceptTouchEventListener?.onInterceptTouchEvent(this, event) == true) {
      return true
    }
    // We intercept the touch event if the children are not supposed to receive it.
    if (!canChildrenBeTouchTarget(pointerEvents)) {
      return true
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    // We do not accept the touch event if this view is not supposed to receive it.
    if (!canBeTouchTarget(pointerEvents)) {
      return false
    }
    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    @Suppress("DEPRECATION")
    if (ReactFeatureFlags.dispatchPointerEvents) {
      // Match the logic from onTouchEvent if pointer events are enabled
      return canBeTouchTarget(pointerEvents)
    }
    return super.onHoverEvent(event)
  }

  override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean {
    // We do not dispatch the motion event if its children are not supposed to receive it
    if (!canChildrenBeTouchTarget(pointerEvents)) {
      return false
    }

    return super.dispatchGenericMotionEvent(ev)
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  override fun hasOverlappingRendering(): Boolean = needsOffscreenAlphaCompositing

  /** See the documentation of needsOffscreenAlphaCompositing in View.js. */
  public fun setNeedsOffscreenAlphaCompositing(needsOffscreenAlphaCompositing: Boolean) {
    this.needsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing
  }

  public fun setBorderWidth(position: Int, width: Float) {
    setBorderWidth(this, LogicalEdge.entries[position], toDIPFromPixel(width))
  }

  public fun setBorderColor(position: Int, color: Int?) {
    setBorderColor(this, LogicalEdge.entries[position], color)
  }

  @Deprecated(
      message = "setBorderRadius(Float) is deprecated and will be removed in the future.",
      replaceWith = ReplaceWith("setBorderRadius(Float,LengthPercentage)"),
  )
  public fun setBorderRadius(borderRadius: Float) {
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(borderRadius, LengthPercentageType.POINT)
    setBorderRadius(this, BorderRadiusProp.BORDER_RADIUS, radius)
  }

  @Deprecated(
      message = "setBorderRadius(Float) is deprecated and will be removed in the future.",
      replaceWith = ReplaceWith("setBorderRadius(Float,LengthPercentage)"),
  )
  public fun setBorderRadius(borderRadius: Float, position: Int) {
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(borderRadius, LengthPercentageType.POINT)
    setBorderRadius(this, BorderRadiusProp.entries[position], radius)
  }

  public fun setBorderRadius(property: BorderRadiusProp, borderRadius: LengthPercentage?) {
    setBorderRadius(this, property, borderRadius)
  }

  public fun setBorderStyle(style: String?) {
    setBorderStyle(this, style?.let { BorderStyle.fromString(it) })
  }

  override var removeClippedSubviews: Boolean
    get() {
      if (ReactNativeFeatureFlags.disableSubviewClippingAndroid()) {
        return false
      }
      return _removeClippedSubviews
    }
    set(newValue) {
      if (ReactNativeFeatureFlags.disableSubviewClippingAndroid()) {
        return
      }

      if (newValue == _removeClippedSubviews) {
        return
      }
      _removeClippedSubviews = newValue
      childrenRemovedWhileTransitioning = null
      if (newValue) {
        val clippingRect = Rect()
        calculateClippingRect(this, clippingRect)
        this.clippingRect = clippingRect

        allChildrenCount = childCount
        val allChildren = arrayOfNulls<View?>(max(12, allChildrenCount))
        childrenLayoutChangeListener = ChildrenLayoutChangeListener(this)
        for (i in 0..<allChildrenCount) {
          val child = getChildAt(i)
          allChildren[i] = child
          child.addOnLayoutChangeListener(childrenLayoutChangeListener)
          setViewClipped(child, false)
        }
        this.allChildren = allChildren
        updateClippingRect()
      } else {
        // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
        val childArray = checkNotNull(allChildren)
        checkNotNull(childrenLayoutChangeListener)
        for (i in 0..<allChildrenCount) {
          childArray[i]?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
        }
        val clippingRect = checkNotNull(clippingRect)
        getDrawingRect(clippingRect)
        updateClippingToRect(clippingRect)
        this.allChildren = null
        this.clippingRect = null
        allChildrenCount = 0
        childrenLayoutChangeListener = null
      }
    }

  override fun getClippingRect(outClippingRect: Rect) {
    outClippingRect.set(checkNotNull(clippingRect))
  }

  override fun updateClippingRect() {
    updateClippingRect(null)
  }

  override fun updateClippingRect(excludedViews: Set<Int>?) {
    if (!_removeClippedSubviews) {
      return
    }

    val clippingRect = checkNotNull(clippingRect)
    calculateClippingRect(this, clippingRect)
    updateClippingToRect(clippingRect, excludedViews)
  }

  internal fun requestFocusFromJS() {
    if (isAttachedToWindow) {
      super.requestFocus(FOCUS_DOWN, null)
    } else {
      focusOnAttach = true
    }
  }

  internal fun clearFocusFromJS() {
    focusOnAttach = false
    super.clearFocus()
  }

  override fun endViewTransition(view: View) {
    super.endViewTransition(view)
    childrenRemovedWhileTransitioning?.remove(view.id)
  }

  private fun trackChildViewTransition(childId: Int) {
    if (childrenRemovedWhileTransitioning == null) {
      childrenRemovedWhileTransitioning = mutableSetOf()
    }
    childrenRemovedWhileTransitioning?.add(childId)
  }

  private fun isChildRemovedWhileTransitioning(child: View): Boolean =
      childrenRemovedWhileTransitioning?.contains(child.id) == true

  internal fun updateClippingToRect(clippingRect: Rect, excludedViewsSet: Set<Int>? = null) {
    val childArray = checkNotNull(allChildren)
    inSubviewClippingLoop = true
    var clippedSoFar = 0
    for (i in 0..<allChildrenCount) {
      try {
        updateSubviewClipStatus(clippingRect, i, clippedSoFar, excludedViewsSet)
      } catch (ex: IndexOutOfBoundsException) {
        var realClippedSoFar = 0
        val uniqueViews: MutableSet<View?> = HashSet()
        var j = 0
        while (j < i) {
          realClippedSoFar += if (isViewClipped(childArray[j], j)) 1 else 0
          uniqueViews.add(childArray[j])
          j++
        }

        throw IllegalStateException(
            "Invalid clipping state. i=$i clippedSoFar=$clippedSoFar count=$childCount allChildrenCount=$allChildrenCount recycleCount=$recycleCount realClippedSoFar=$realClippedSoFar uniqueViewsCount=${uniqueViews.size} excludedViews=${excludedViewsSet?.size ?: 0}",
            ex,
        )
      }
      if (isViewClipped(childArray[i], i)) {
        clippedSoFar++
      }
      if (i - clippedSoFar > childCount) {
        throw IllegalStateException(
            "Invalid clipping state. i=$i clippedSoFar=$clippedSoFar count=$childCount allChildrenCount=$allChildrenCount recycleCount=$recycleCount  excludedViews=${excludedViewsSet?.size ?: 0}"
        )
      }
    }
    inSubviewClippingLoop = false
  }

  private fun updateSubviewClipStatus(
      clippingRect: Rect,
      idx: Int,
      clippedSoFar: Int,
      excludedViewsSet: Set<Int>? = null,
  ) {
    assertOnUiThread()

    val child = checkNotNull(allChildren?.get(idx))
    val intersects = clippingRect.intersects(child.left, child.top, child.right, child.bottom)
    var needUpdateClippingRecursive = false

    // We never want to clip children that are being animated, as this can easily break layout :
    // when layout animation changes size and/or position of views contained inside a listview that
    // clips offscreen children, we need to ensure that, when view exits the viewport, final size
    // and position is set prior to removing the view from its listview parent.
    // Otherwise, when view gets re-attached again, i.e when it re-enters the viewport after scroll,
    // it won't be size and located properly.
    val isAnimating = child.animation?.hasEnded() == false

    val shouldSkipView = excludedViewsSet?.contains(child.id) == true
    if (excludedViewsSet != null) {
      needUpdateClippingRecursive = true
    }
    // We don't want to clip a view that is currently focused at that might break focus navigation
    if (
        !intersects &&
            !isViewClipped(child, idx) &&
            !isAnimating &&
            child !== focusedChild &&
            !shouldSkipView
    ) {
      setViewClipped(child, true)
      recoverFocus(child)
      // We can try saving on invalidate call here as the view that we remove is out of visible area
      // therefore invalidation is not necessary.
      removeViewInLayout(child)
      needUpdateClippingRecursive = true
    } else if ((shouldSkipView || intersects) && isViewClipped(child, idx)) {
      val adjustedIdx = idx - clippedSoFar
      check(adjustedIdx >= 0)
      setViewClipped(child, false)
      addViewInLayout(child, adjustedIdx, defaultLayoutParam, true)
      invalidate()
      needUpdateClippingRecursive = true
    } else if (intersects) {
      // If there is any intersection we need to inform the child to update its clipping rect
      needUpdateClippingRecursive = true
    }

    if (needUpdateClippingRecursive) {
      if ((child as? ReactClippingViewGroup)?.removeClippedSubviews == true) {
        child.updateClippingRect(excludedViewsSet)
      }
    }
  }

  public fun updateSubviewClipStatus(subview: View) {
    if (!_removeClippedSubviews || parent == null) {
      return
    }

    val clippingRect = checkNotNull(clippingRect)
    val allChildren = checkNotNull(allChildren)

    // do fast check whether intersect state changed
    val intersects =
        clippingRect.intersects(subview.left, subview.top, subview.right, subview.bottom)

    // If it was intersecting before, should be attached to the parent
    val oldIntersects = !isViewClipped(subview, null)

    if (intersects != oldIntersects) {
      inSubviewClippingLoop = true
      var clippedSoFar = 0
      for (i in 0..<allChildrenCount) {
        if (allChildren[i] === subview) {
          updateSubviewClipStatus(clippingRect, i, clippedSoFar)
          break
        }
        if (isViewClipped(allChildren[i], i)) {
          clippedSoFar++
        }
      }
      inSubviewClippingLoop = false
    }
  }

  private fun getFirstFocusableView(viewGroup: ReactViewGroup): View? {
    val focusables = ArrayList<View>(0)
    /**
     * `addFocusables` is the method used by `FocusFinder` to determine
     * which elements are `focusable` within the given view.
     * Here we use it for the exact purpose. It mutates/populates the `focusables` array list.
     * Focus direction (FOCUS_DOWN) doesn't matter at all because
     * it's not being used by the underlying implementation.
     *
     * Here we intentionally call `super` method to bypass `ReactViewGroup`'s
     * overriden `addFocusables` logic.
     */
    super.addFocusables(focusables, FOCUS_DOWN, FOCUSABLES_ALL)
    /**
     * Depending on ViewGroup's `descendantFocusability` property,
     * the first element can be the ViewGroup itself.
     * The other ones on the list can be non-focusable as well.
     * So, we run a loop till finding the first real focusable element.
     */
    if (focusables.size <= 0) return null

    var firstFocusableElement: View? = null
    var index = 0
    while (index < focusables.size) {
      val elem = focusables[index]
      if (elem !== viewGroup) {
        firstFocusableElement = elem
        break
      }
      index++
    }

    return firstFocusableElement!!
  }

  private fun moveFocusToFirstFocusable(viewGroup: ReactViewGroup): Boolean {
    val firstFocusableElement = this.getFirstFocusableView(viewGroup)

    if (firstFocusableElement != null) return firstFocusableElement.requestFocus()

    return false
  }

  private fun recoverFocus(view: View) {
    if (!view.hasFocus() || view !is ReactViewGroup) return

    val parentFocusGuide = findParentFocusGuide(view) ?: return

    /**
     * Making `parentFocusGuide` focusable for a brief time to
     * temporarily move the focus to it. We do this to prevent
     * Android from moving the focus to top-left-most element of the screen.
     */
    parentFocusGuide.mRecoverFocus = true
    parentFocusGuide.isFocusable = true
    parentFocusGuide.requestFocus()

    /**
     * We set a Runnable to wait and make sure every layout related action gets completed
     * before trying to find a new focus candidate inside the `parentFocusGuide`.
     */
    runOnUiThread(
      Runnable {
        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */
        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         *//**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */

        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */
        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */
        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */

        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */

        /**
         * Focus can move to an another element while waiting for the next frame.
         * E.g: An element with `hasTVPreferredFocus` can appear.
         *
         * We check here to make sure `parentFocusGuide` still remains the focus
         * before recovering the focus to make sure we don't accidentally override it.
         */
        if (parentFocusGuide.isFocused) {
          moveFocusToFirstFocusable(parentFocusGuide)
        }

        parentFocusGuide.isFocusable = false
        parentFocusGuide.mRecoverFocus = false
      })
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (_removeClippedSubviews) {
      updateClippingRect()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (_removeClippedSubviews) {
      updateClippingRect()
    }

    if (focusOnAttach) {
      requestFocusFromJS()
      focusOnAttach = false
    }
  }

  private fun customDrawOrderDisabled(): Boolean {
    if (id == NO_ID) {
      return false
    }

    // Custom draw order is disabled for Fabric.
    return getUIManagerType(id) == UIManagerType.FABRIC
  }

  override fun onViewAdded(child: View) {
    assertOnUiThread()
    checkViewClippingTag(child, false)
    if (!customDrawOrderDisabled()) {
      drawingOrderHelper.handleAddView(child)
      isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    } else {
      isChildrenDrawingOrderEnabled = false
    }
    super.onViewAdded(child)
  }
  
  override fun removeView(view: View?) {
    if (view != null) {
      recoverFocus(view);
    }
    super.removeView(view);
  }

  override fun removeViewAt(index: Int) {
    recoverFocus(getChildAt(index));
    super.removeViewAt(index);
  }

  override fun onViewRemoved(child: View) {
    assertOnUiThread()
    checkViewClippingTag(child, true)
    if (!customDrawOrderDisabled()) {
      drawingOrderHelper.handleRemoveView(child)
      isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    } else {
      isChildrenDrawingOrderEnabled = false
    }

    // The parent might not be null in case the child is transitioning.
    if (child.parent != null) {
      trackChildViewTransition(child.id)
    }

    super.onViewRemoved(child)
  }

  private fun checkViewClippingTag(child: View, expectedTag: Boolean) {
    if (inSubviewClippingLoop) {
      val tag = child.getTag(R.id.view_clipped)
      if (expectedTag != tag) {
        logSoftException(
            ReactSoftExceptionLogger.Categories.RVG_ON_VIEW_REMOVED,
            ReactNoCrashSoftException("View clipping tag mismatch: tag=$tag expected=$expectedTag"),
        )
      }
    }
    if (_removeClippedSubviews) {
      child.setTag(R.id.view_clipped, expectedTag)
    } else {
      child.setTag(R.id.view_clipped, null)
    }
  }

  override fun getChildDrawingOrder(childCount: Int, index: Int): Int {
    assertOnUiThread()

    return if (!customDrawOrderDisabled()) {
      drawingOrderHelper.getChildDrawingOrder(childCount, index)
    } else {
      index
    }
  }

  override fun getZIndexMappedChildIndex(index: Int): Int {
    assertOnUiThread()

    if (!customDrawOrderDisabled() && drawingOrderHelper.shouldEnableCustomDrawingOrder()) {
      return drawingOrderHelper.getChildDrawingOrder(childCount, index)
    }

    // Fabric behavior
    return index
  }

  override fun updateDrawingOrder() {
    if (customDrawOrderDisabled()) {
      return
    }

    drawingOrderHelper.update()
    isChildrenDrawingOrderEnabled = drawingOrderHelper.shouldEnableCustomDrawingOrder()
    invalidate()
  }

  override fun dispatchSetPressed(pressed: Boolean) {
    // Prevents the ViewGroup from dispatching the pressed state
    // to it's children.
  }

  private fun resetPointerEvents() {
    pointerEvents = PointerEvents.AUTO
  }

  internal fun getChildAtWithSubviewClippingEnabled(index: Int): View? =
      if (index in 0..<allChildrenCount) checkNotNull(allChildren)[index] else null

  internal fun addViewWithSubviewClippingEnabled(
      child: View,
      index: Int,
  ) {
    check(_removeClippedSubviews)
    setViewClipped(child, true) // the view has not been added, so it is "clipped"
    addInArray(child, index)

    // we add view as "clipped" and then run {@link #updateSubviewClipStatus} to conditionally
    // attach it
    val clippingRect = checkNotNull(clippingRect)
    val allChildren = checkNotNull(allChildren)
    inSubviewClippingLoop = true
    var clippedSoFar = 0
    for (i in 0..<index) {
      if (isViewClipped(allChildren[i], i)) {
        clippedSoFar++
      }
    }
    updateSubviewClipStatus(clippingRect, index, clippedSoFar)
    inSubviewClippingLoop = false
    child.addOnLayoutChangeListener(childrenLayoutChangeListener)

    if (child is ReactClippingProhibitedView) {
      runOnUiThread(
          object : Runnable {
            override fun run() {
              if (!child.isShown) {
                logSoftException(
                    ReactSoftExceptionLogger.Categories.CLIPPING_PROHIBITED_VIEW,
                    ReactNoCrashSoftException(
                        "Child view has been added to Parent view in which it is clipped and not visible. This is not legal for this particular child view. Child: [${child.id}] $child Parent: [$id] ${toString()}"
                    ),
                )
              }
            }
          }
      )
    }
  }

  internal fun removeViewWithSubviewClippingEnabled(view: View) {
    assertOnUiThread()
    recoverFocus(view)
    check(_removeClippedSubviews)
    val allChildren = checkNotNull(allChildren)
    view.removeOnLayoutChangeListener(childrenLayoutChangeListener)
    val index = indexOfChildInAllChildren(view)
    if (!isViewClipped(allChildren[index], index)) {
      var clippedSoFar = 0
      for (i in 0..<index) {
        if (isViewClipped(allChildren[i], i)) {
          clippedSoFar++
        }
      }
      removeViewsInLayout(index - clippedSoFar, 1)
      invalidate()
    }
    removeFromArray(index)
  }

  internal fun removeAllViewsWithSubviewClippingEnabled() {
    check(_removeClippedSubviews)
    val allChildren = checkNotNull(allChildren)
    for (i in 0..<allChildrenCount) {
      allChildren[i]?.removeOnLayoutChangeListener(childrenLayoutChangeListener)
    }
    removeAllViewsInLayout()
    allChildrenCount = 0
  }

  /**
   * @param index For logging - index of the view in `allChildren`, or `null` to skip logging.
   * @return `true` if the view has been removed from the ViewGroup.
   */
  private fun isViewClipped(view: View?, index: Int?): Boolean {
    val view = checkNotNull(view)
    val tag = view.getTag(R.id.view_clipped)
    if (tag != null) {
      return tag as Boolean
    }

    val parent = view.parent
    val transitioning = isChildRemovedWhileTransitioning(view)
    if (index != null) {
      logSoftException(
          ReactSoftExceptionLogger.Categories.RVG_IS_VIEW_CLIPPED,
          ReactNoCrashSoftException(
              "View missing clipping tag: index=$index parentNull=${parent == null} parentThis=${parent === this} transitioning=$transitioning"
          ),
      )
    }
    // fallback - should be transitioning or have no parent if the view was removed
    if (parent == null || transitioning) {
      return true
    } else {
      check(parent === this)
      return false
    }
  }

  private fun indexOfChildInAllChildren(child: View): Int {
    val count = allChildrenCount
    val childArray = checkNotNull(allChildren)
    for (i in 0..<count) {
      if (childArray[i] === child) {
        return i
      }
    }
    return -1
  }

  private fun addInArray(child: View, index: Int) {
    var childArray = checkNotNull(allChildren)
    val count = allChildrenCount
    val size = childArray.size
    if (index == count) {
      if (size == count) {
        val allChildren = arrayOfNulls<View?>(size + ARRAY_CAPACITY_INCREMENT)
        System.arraycopy(childArray, 0, allChildren, 0, size)
        childArray = allChildren
        this.allChildren = childArray
      }
      childArray[allChildrenCount++] = child
    } else if (index < count) {
      if (size == count) {
        val allChildren = arrayOfNulls<View?>(size + ARRAY_CAPACITY_INCREMENT)
        System.arraycopy(childArray, 0, allChildren, 0, index)
        System.arraycopy(childArray, index, allChildren, index + 1, count - index)
        childArray = allChildren
        this.allChildren = childArray
      } else {
        System.arraycopy(childArray, index, childArray, index + 1, count - index)
      }
      childArray[index] = child
      allChildrenCount++
    } else {
      throw IndexOutOfBoundsException("index=$index count=$count")
    }
  }

  private fun removeFromArray(index: Int) {
    val childArray = checkNotNull(allChildren)
    val count = allChildrenCount
    when (index) {
      count - 1 -> childArray[--allChildrenCount] = null
      in 0..<count -> {
        System.arraycopy(childArray, index + 1, childArray, index, count - index - 1)
        childArray[--allChildrenCount] = null
      }
      else -> throw IndexOutOfBoundsException()
    }
  }

  private var _overflow: Overflow? = null
  override var overflow: String?
    get() =
        when (_overflow) {
          Overflow.HIDDEN -> "hidden"
          Overflow.SCROLL -> "scroll"
          Overflow.VISIBLE -> "visible"
          else -> null
        }
    set(overflow) {
      _overflow =
          if (overflow == null) {
            Overflow.VISIBLE
          } else {
            Overflow.fromString(overflow)
          }
      invalidate()
    }

  override fun setOverflowInset(left: Int, top: Int, right: Int, bottom: Int) {
    if (
        needsIsolatedLayer(this) &&
            (overflowInset.left != left ||
                overflowInset.top != top ||
                overflowInset.right != right ||
                overflowInset.bottom != bottom)
    ) {
      invalidate()
    }
    overflowInset[left, top, right] = bottom
  }

  /**
   * Set the background for the view or remove the background. It calls [setBackground].
   *
   * @param drawable The [Drawable] to use as the background, or null to remove the background
   */
  private fun updateBackgroundDrawable(drawable: Drawable?) {
    super.setBackground(drawable)
  }

  override fun draw(canvas: Canvas) {
    if (
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            getUIManagerType(this) == UIManagerType.FABRIC &&
            needsIsolatedLayer(this)
    ) {
      // Check if the view is a stacking context and has children, if it does, do the rendering
      // offscreen and then composite back. This follows the idea of group isolation on blending
      // https://www.w3.org/TR/compositing-1/#isolationblending

      val overflowInset = overflowInset
      canvas.saveLayer(
          overflowInset.left.toFloat(),
          overflowInset.top.toFloat(),
          (width + -overflowInset.right).toFloat(),
          (height + -overflowInset.bottom).toFloat(),
          null,
      )
      super.draw(canvas)
      canvas.restore()
    } else {
      super.draw(canvas)
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (_overflow != Overflow.VISIBLE || getTag(R.id.filter) != null) {
      clipToPaddingBox(this, canvas)
    }
    super.dispatchDraw(canvas)
  }

  override fun drawChild(canvas: Canvas, child: View, drawingTime: Long): Boolean {
    val drawWithZ = child.elevation > 0

    if (drawWithZ) {
      enableZ(canvas, true)
    }

    var mixBlendMode: BlendMode? = null
    if (
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            getUIManagerType(this) == UIManagerType.FABRIC &&
            needsIsolatedLayer(this)
    ) {
      mixBlendMode = child.getTag(R.id.mix_blend_mode) as? BlendMode
      if (mixBlendMode != null) {
        val p = Paint()
        p.blendMode = mixBlendMode
        val overflowInset = overflowInset
        canvas.saveLayer(
            overflowInset.left.toFloat(),
            overflowInset.top.toFloat(),
            (width + -overflowInset.right).toFloat(),
            (height + -overflowInset.bottom).toFloat(),
            p,
        )
      }
    }

    val result = super.drawChild(canvas, child, drawingTime)

    if (mixBlendMode != null) {
      canvas.restore()
    }

    if (drawWithZ) {
      enableZ(canvas, false)
    }
    return result
  }

  public fun setOpacityIfPossible(opacity: Float) {
    backfaceOpacity = opacity
    setBackfaceVisibilityDependantOpacity()
  }

  public fun setBackfaceVisibility(backfaceVisibility: String) {
    backfaceVisible = "visible" == backfaceVisibility
    setBackfaceVisibilityDependantOpacity()
  }

  public fun setBackfaceVisibilityDependantOpacity() {
    if (backfaceVisible) {
      alpha = backfaceOpacity
      return
    }

    val rotationX = rotationX
    val rotationY = rotationY

    val isFrontfaceVisible =
        (rotationX >= -90f && rotationX < 90f) && (rotationY >= -90f && rotationY < 90f)

    if (isFrontfaceVisible) {
      alpha = backfaceOpacity
      return
    }

    alpha = 0f
  }

  public fun initializeFocusGuideTalkbackAccessibilityDelegate() {
    if (!this.isTVFocusGuide) {
      return
    }

    this.originalIsFocusable = this.isFocusable

    val viewAccessibilityDelegate: ReactAccessibilityDelegate = object : ReactAccessibilityDelegate(
      this@ReactViewGroup, originalIsFocusable, this@ReactViewGroup.importantForAccessibility
    ) {
      override fun performAccessibilityAction(host: View, action: Int, args: Bundle?): Boolean {
        if (host !is ReactViewGroup) {
          return super.performAccessibilityAction(host, action, args)
        }
        if (action == AccessibilityNodeInfo.ACTION_FOCUS) {
          if (args?.let { host.interceptAccessibilityEvents(action, it) } == true) {
            return true
          }
          // Handle case when focus guide cannot find any focusable child
          if (host.isTVFocusGuide && host.getFirstFocusableView(host) == null) {
            if (host.isNotEmpty()) {
              val child = host.getChildAt(0)
              val childFocusables = ArrayList<View>(0)
              child.addFocusables(childFocusables, FOCUS_DOWN, 0)
              if (childFocusables.isNotEmpty()) {
                childFocusables[0].performAccessibilityAction(action, args)
                return true
              }
            }
          }
          return super.performAccessibilityAction(host, action, args)
        }
        if (action == AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS) {
          if (args?.let { host.interceptAccessibilityEvents(action, it) } == true) {
            return true
          }
          // Handle case when focus guide cannot find any focusable child
          if (host.isTVFocusGuide && host.getFirstFocusableView(host) == null) {
            if (host.isNotEmpty()) {
              val child = host.getChildAt(0)
              val childFocusables = ArrayList<View>(0)
              child.addFocusables(childFocusables, FOCUS_DOWN, 0)
              if (childFocusables.isNotEmpty()) {
                /*
                 * Instead of forwarding AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS,
                 * let's invoke AccessibilityNodeInfo.ACTION_FOCUS
                 * to trigger focus events on JS side - the AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS
                 * will be automatically invoked later
                 */
                childFocusables[0].performAccessibilityAction(
                  AccessibilityNodeInfo.ACTION_FOCUS,
                  args
                )
                return true
              }
            }
            /*
             * Let's consume event here, otherwise there might be an issue with
             * FocusGuide receiving focus instead of one of its child views
             */
            return true
          }
          return super.performAccessibilityAction(host, action, args)
        }
        return super.performAccessibilityAction(host, action, args)
      }
    }
    ViewCompat.setAccessibilityDelegate(this, viewAccessibilityDelegate)
    this.isFocusable = true
    this.isFocusableInTouchMode = true
    // To force Talkback to give the a11y event to the FocusGuide
    // we need to make it look like it has some a11y label to be announced.
    // Because FocusGuide should always have at least one focusable child view,
    // which will receive forwarded a11y event from this FocusGuide,
    // the following fake label will never be announced
    this.contentDescription = "FocusGuide"
    this.isFocusGuideTalkbackAccessibilityDelegateSet = true
  }

  public fun cleanupFocusGuideTalkbackAccessibilityDelegate() {
    ViewCompat.setAccessibilityDelegate(this, null)
    this.isFocusable = this.originalIsFocusable
    this.isFocusableInTouchMode = this.originalIsFocusable
    this.originalIsFocusable = false
    this.contentDescription = null
    this.isFocusGuideTalkbackAccessibilityDelegateSet = false
  }

  public fun hasFocusGuideTalkbackAccessibilityDelegate(): Boolean {
    return this.isFocusGuideTalkbackAccessibilityDelegateSet
  }

  private fun interceptAccessibilityEvents(action: Int, args: Bundle): Boolean {
    if (!this.isTVFocusGuide) {
      return false
    }

    // If it's "FocusGuide", we want to intercept
    // the event and redirect it to either:
    // 1) first available destination view from "destinations" prop
    // 2) last focused element saved when "autoFocus" prop is `true`
    // 3) first focusable child view
    val destinationView = this.findDestinationView()
    if (destinationView != null) {
      try {
        destinationView.performAccessibilityAction(action, args)
        return true
      } catch (e: Exception) {
        FLog.e(
          TAG,
          "Exception when performing accessibility action on destination view - falling back to next case (last focused view): $e"
        )
      }
    }
    val lastFocusedView = lastFocusedElement!!.get()
    if (lastFocusedView != null) {
      try {
        lastFocusedView.performAccessibilityAction(action, args)
        return true
      } catch (e: Exception) {
        FLog.e(
          TAG,
          "Exception when performing accessibility action on last focused view - falling back to next case (first focusable view): $e"
        )
      }
    }
    val firstFocusableView = this.getFirstFocusableView(this)
    if (firstFocusableView != null) {
      try {
        firstFocusableView.performAccessibilityAction(action, args)
        return true
      } catch (e: Exception) {
        FLog.e(
          TAG,
          "Exception when performing accessibility action on first focusable view - focus guide will not handle focus: $e"
        )
      }
    }
    return false
  }

  private fun findDestinationView(): View? {
    for (focusDestination in focusDestinations) {
      val childViewWithTag = findViewById<View>(focusDestination)
      if (childViewWithTag != null) return childViewWithTag
      val viewWithTag = rootView.findViewById<View>(focusDestination)
      if (viewWithTag != null) return viewWithTag
    }
    return null
  }

  private val isFocusDestinationsSet: Boolean
    get() = focusDestinations.isNotEmpty()

  public val isTVFocusGuide: Boolean
    get() =
      /**
       * We don't count a view as `TVFocusGuide` if it has `trapFocus*` props enabled.
       * The reason is, it's a seperate functionality that has nothing to do with other
       * TVFocusGuide features that involves heavy focus management. So, the feature
       * is not directly tied to `TVFocusGuide`.
       */
      isFocusDestinationsSet || autoFocus

  private fun findParentFocusGuide(view: View): ReactViewGroup? {
    var parent: ViewParent? = view.parent

    while (parent != null) {
      if (parent is ReactViewGroup) {
        val elem = parent
        if (elem.isTVFocusGuide) return elem
      }
      parent = parent.parent
    }

    return null
  }

  private val focusedChildOfFocusGuide: View?
    /***
     * This is meant to be used only for TVFocusGuide.
     * @return View | null
     */
    get() {
      if (!isTVFocusGuide) return null

      /*
* We can have nested `TVFocusGuide`s, this is a typical scenario.
* The problem is, returned element from `getFocusedChild` can be
* either a direct `child` of the `TVFocusGuide` or a `descendant` of it.
* Let's say if we run `getFocusedChild` for the Root element, it will always
* give us an element even though the Root element is not the direct parent
* of the focused element.
* So, we need to find the closest `TVFocusGuide` to the focused child
* to make sure the focused element's closest `TVFocusGuide` is "this" one.
*/
      val focusedChild = this.focusedChild ?: return null

      val parentFocusGuide =
        findParentFocusGuide(focusedChild)
      if (parentFocusGuide === this) return focusedChild

      return null
    }

  override fun addFocusables(views: ArrayList<View>, direction: Int, focusableMode: Int) {
    /**
     * TVFocusGuides should reveral their children when `mRecoverFocus` is set.
     * `mRecoverFocus` flag indicates a temporary focus recovery mode it's in which
     * requires full access to children focusable elements.
     */
    if (isTVFocusGuide && !mRecoverFocus && this.descendantFocusability != FOCUS_BLOCK_DESCENDANTS) {
      val focusedChild = focusedChildOfFocusGuide

      /*
       * We only include the view's (TVFocusGuide) itself if it doesn't have a child that currently has the focus.
       * Otherwise, it means focus is already in the `TVFocusGuide` and all of it's descendants should be included
       * for focus calculations.
       */
      if (focusedChild == null) {
        views.add(this)
        return
      }
    }

    super.addFocusables(views, direction, focusableMode)
  }

  override fun requestChildFocus(child: View, focused: View) {
    super.requestChildFocus(child, focused)

    if (autoFocus) {
      lastFocusedElement = WeakReference(focused)
    }
  }

  override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if ((keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && event.repeatCount == 0 && !this.isTVFocusGuide) {
      val mEventDispatcher: EventDispatcher? =
        UIManagerHelper.getEventDispatcherForReactTag(
          this.context as ReactContext, this.id
        )

      if (mEventDispatcher == null) {
        return super.onKeyDown(keyCode, event)
      }

      mEventDispatcher.dispatchEvent(
        PressInEvent(
          UIManagerHelper.getSurfaceId(this.context),
          this.id
        )
      )
    }


    return super.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if ((keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) && !this.isTVFocusGuide) {
      val mEventDispatcher: EventDispatcher? =
        UIManagerHelper.getEventDispatcherForReactTag(
          this.context as ReactContext, this.id
        )

      if (mEventDispatcher == null) {
        return super.onKeyUp(keyCode, event)
      }

      mEventDispatcher.dispatchEvent(
        PressOutEvent(
          UIManagerHelper.getSurfaceId(this.context),
          this.id
        )
      )
    }

    return super.onKeyUp(keyCode, event)
  }

  override fun requestFocus(direction: Int, previouslyFocusedRect: Rect?): Boolean {
    if (!isTVFocusGuide || mRecoverFocus) {
      return super.requestFocus(direction, previouslyFocusedRect)
    }

    if (isFocusDestinationsSet) {
      val destination = findDestinationView()

      // Destination is set but there's no such element on the tree
      // Just skip it to prevent cyclic issues.
      if (destination == null) {
        return false
      }

      if (destination.requestFocus()) {
        return true
      }
    }

    if (this.autoFocus) {
      val lastFocusedElem = lastFocusedElement!!.get()

      if (lastFocusedElem != null) {
        if (lastFocusedElem.isAttachedToWindow) {
          lastFocusedElem.requestFocus()
          return true
        }

        /**
         * `lastFocusedElem` can get detached based on application logic.
         * If the code reaches here, that means we're dealing with that case.
         * We should set `lastFocusedElem` to null and let the focus determination
         * logic below to do its magic and redirect focus to the first element.
         */
        lastFocusedElement = WeakReference(null)
      }

      // Try moving the focus to the first focusable element otherwise.
      return moveFocusToFirstFocusable(this)
    }

    return super.requestFocus(direction, previouslyFocusedRect)
  }

  override fun focusSearch(focused: View, direction: Int): View? {
    /**
     * FocusSearch recursively goes all the way up to the Root view
     * and runs `FocusFinder.findNextFocus()` to determine the next focusable.
     * It finds the next focusable by accounting *every* focusable elements on the screen.
     *
     * That is exactly the thing we want to prevent if the view has a `focusTrap` enabled
     * matching the `direction`. We interrupt `focusSearch` to make the `FocusFinder` run
     * the algorithm only accounting the children elements of the focus trap.
     * This ensures that focus will always stay inside the container until trap gets disabled.
     */
    if ((trapFocusUp && direction == FOCUS_UP)
      || (trapFocusDown && direction == FOCUS_DOWN)
      || (trapFocusLeft && direction == FOCUS_LEFT)
      || (trapFocusRight && direction == FOCUS_RIGHT)
    ) {
      return FocusFinder.getInstance().findNextFocus(this, focused, direction)
    }

    return super.focusSearch(focused, direction)
  }

  public fun setFocusDestinations(focusDestinations: IntArray) {
    this.focusDestinations = focusDestinations
  }

  public fun setAutoFocusTV(autoFocus: Boolean) {
    this.autoFocus = autoFocus
    lastFocusedElement = WeakReference(null)
  }

  public fun setTrapFocusUp(enabled: Boolean) {
    this.trapFocusUp = enabled
  }

  public fun setTrapFocusDown(enabled: Boolean) {
    this.trapFocusDown = enabled
  }

  public fun setTrapFocusLeft(enabled: Boolean) {
    this.trapFocusLeft = enabled
  }

  public fun setTrapFocusRight(enabled: Boolean) {
    this.trapFocusRight = enabled
  }

  override fun addChildrenForAccessibility(outChildren: ArrayList<View>) {
    val axOrderParent = getTag(R.id.accessibility_order_parent)
    var axOrderParentOrderList: MutableList<String>? = null
    if (axOrderParent is ReactViewGroup) {
      axOrderParentOrderList = (axOrderParent as ReactViewGroup?)?.axOrderList
    }

    val axOrder: MutableList<*>? = axOrderList
    if (axOrder != null) {

      val am: AccessibilityManager? =
          this.context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager?
      if (accessibilityStateChangeListener == null && am != null) {
        val newAccessibilityStateChangeListener =
            AccessibilityManager.AccessibilityStateChangeListener { enabled ->
              if (!enabled) {
                for (i in 0..<childCount) {
                  ReactAxOrderHelper.restoreFocusability(getChildAt(i))
                }
              }
            }

        am.addAccessibilityStateChangeListener(newAccessibilityStateChangeListener)
        accessibilityStateChangeListener = newAccessibilityStateChangeListener
      }

      val result = arrayOfNulls<View?>(axOrder.size)

      for (i in 0..<childCount) {
        ReactAxOrderHelper.buildAxOrderList(getChildAt(i), this, axOrder, result)
      }

      for (i in result.indices) {
        val view = result[i]
        if (view != null) {
          if (view.isFocusable) {
            outChildren.add(view)
          } else {
            view.addChildrenForAccessibility(outChildren)
          }
        }
      }
    } else if (axOrderParentOrderList != null) {
      // view is a container so add its children normally
      if (!isFocusable) {
        super.addChildrenForAccessibility(outChildren)
        return

        // If this view can coopt, turn the focusability off its children but add them to the tree
      } else if (isFocusable && (contentDescription == null || contentDescription == "")) {
        super.addChildrenForAccessibility(outChildren)
        for (i in 0..<childCount) {
          ReactAxOrderHelper.disableFocusForSubtree(getChildAt(i), axOrderParentOrderList)
        }
        // if this view is focusable and has a contentDescription then we don't care about its
        // descendants for accessibility
      } else if (isFocusable && !(contentDescription == null || contentDescription == "")) {
        return
      }
    } else {
      super.addChildrenForAccessibility(outChildren)
    }
  }

  public fun cleanUpAxOrderListener() {
    val am = this.context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
    if (am != null) {
      accessibilityStateChangeListener?.let { am.removeAccessibilityStateChangeListener(it) }
    }
    accessibilityStateChangeListener = null
  }

  private companion object {
    const val ARRAY_CAPACITY_INCREMENT = 12
    private val defaultLayoutParam = LayoutParams(0, 0)

    fun setViewClipped(view: View, clipped: Boolean) {
      view.setTag(R.id.view_clipped, clipped)
    }
  }
}
