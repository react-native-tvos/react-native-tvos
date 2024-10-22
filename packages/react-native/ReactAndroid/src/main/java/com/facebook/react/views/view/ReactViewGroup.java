/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import static com.facebook.react.common.ReactConstants.TAG;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.BlendMode;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.FocusFinder;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.ViewStructure;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.animation.Animation;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;

import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.R;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.touch.OnInterceptTouchEventListener;
import com.facebook.react.touch.ReactHitSlopView;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.BackgroundStyleApplicator;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.LengthPercentage;
import com.facebook.react.uimanager.LengthPercentageType;
import com.facebook.react.uimanager.MeasureSpecAssertions;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactAccessibilityDelegate;
import com.facebook.react.uimanager.ReactClippingProhibitedView;
import com.facebook.react.uimanager.ReactClippingViewGroup;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;
import com.facebook.react.uimanager.ReactOverflowViewWithInset;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.ReactZIndexedViewGroup;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.RootViewUtil;
import com.facebook.react.uimanager.ViewGroupDrawingOrderHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.common.ViewUtil;
import com.facebook.react.uimanager.drawable.CSSBackgroundDrawable;
import com.facebook.react.uimanager.style.BackgroundImageLayer;
import com.facebook.react.uimanager.style.BorderRadiusProp;
import com.facebook.react.uimanager.style.BorderStyle;
import com.facebook.react.uimanager.style.ComputedBorderRadius;
import com.facebook.react.uimanager.style.CornerRadii;
import com.facebook.react.uimanager.style.LogicalEdge;
import com.facebook.react.uimanager.style.Overflow;
import java.util.List;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

/**
 * Backing for a React View. Has support for borders, but since borders aren't common, lazy
 * initializes most of the storage needed for them.
 */
public class ReactViewGroup extends ViewGroup
    implements ReactInterceptingViewGroup,
        ReactClippingViewGroup,
        ReactPointerEventsView,
        ReactHitSlopView,
        ReactZIndexedViewGroup,
        ReactOverflowViewWithInset {

  private static final int ARRAY_CAPACITY_INCREMENT = 12;
  private static final int DEFAULT_BACKGROUND_COLOR = Color.TRANSPARENT;
  private static final LayoutParams sDefaultLayoutParam = new ViewGroup.LayoutParams(0, 0);
  private final Rect mOverflowInset = new Rect();
  /* should only be used in {@link #updateClippingToRect} */
  private static final Rect sHelperRect = new Rect();

  private @NonNull int[] focusDestinations = new int[0];
  private boolean autoFocus = false;
  private boolean isFocusGuideTalkbackAccessibilityDelegateSet = false;
  private WeakReference<View> lastFocusedElement;
  private boolean mRecoverFocus = false;
  private boolean originalIsFocusable = false;
  private boolean trapFocusUp = false;
  private boolean trapFocusDown = false;
  private boolean trapFocusLeft = false;
  private boolean trapFocusRight = false;


  /**
   * This listener will be set for child views when removeClippedSubview property is enabled. When
   * children layout is updated, it will call {@link #updateSubviewClipStatus} to notify parent view
   * about that fact so that view can be attached/detached if necessary.
   *
   * <p>TODO(7728005): Attach/detach views in batch - once per frame in case when multiple children
   * update their layout.
   */
  private static final class ChildrenLayoutChangeListener implements View.OnLayoutChangeListener {

    private final ReactViewGroup mParent;

    private ChildrenLayoutChangeListener(ReactViewGroup parent) {
      mParent = parent;
    }

    @Override
    public void onLayoutChange(
        View v,
        int left,
        int top,
        int right,
        int bottom,
        int oldLeft,
        int oldTop,
        int oldRight,
        int oldBottom) {
      if (mParent.getRemoveClippedSubviews()) {
        mParent.updateSubviewClipStatus(v);
      }
    }
  }

  // Following properties are here to support the option {@code removeClippedSubviews}. This is a
  // temporary optimization/hack that is mainly applicable to the large list of images. The way
  // it's implemented is that we store an additional array of children in view node. We selectively
  // remove some of the views (detach) from it while still storing them in that additional array.
  // We override all possible add methods for {@link ViewGroup} so that we can control this process
  // whenever the option is set. We also override {@link ViewGroup#getChildAt} and
  // {@link ViewGroup#getChildCount} so those methods may return views that are not attached.
  // This is risky but allows us to perform a correct cleanup in {@link NativeViewHierarchyManager}.
  private boolean mRemoveClippedSubviews;
  private @Nullable View[] mAllChildren;
  private int mAllChildrenCount;
  private @Nullable Rect mClippingRect;
  private @Nullable Rect mHitSlopRect;
  private Overflow mOverflow;
  private PointerEvents mPointerEvents;
  private @Nullable ChildrenLayoutChangeListener mChildrenLayoutChangeListener;
  private @Nullable CSSBackgroundDrawable mCSSBackgroundDrawable;
  private @Nullable OnInterceptTouchEventListener mOnInterceptTouchEventListener;
  private boolean mNeedsOffscreenAlphaCompositing;
  private @Nullable ViewGroupDrawingOrderHelper mDrawingOrderHelper;
  private @Nullable Path mPath;
  private float mBackfaceOpacity;
  private String mBackfaceVisibility;

  public ReactViewGroup(Context context) {
    super(context);
    initView();
  }

  /**
   * Set all default values here as opposed to in the constructor or field defaults. It is important
   * that these properties are set during the constructor, but also on-demand whenever an existing
   * ReactTextView is recycled.
   */
  private void initView() {
    setClipChildren(false);

    mRemoveClippedSubviews = false;
    mAllChildren = null;
    mAllChildrenCount = 0;
    mClippingRect = null;
    mHitSlopRect = null;
    mOverflow = Overflow.VISIBLE;
    mPointerEvents = PointerEvents.AUTO;
    mChildrenLayoutChangeListener = null;
    mCSSBackgroundDrawable = null;
    mOnInterceptTouchEventListener = null;
    mNeedsOffscreenAlphaCompositing = false;
    mDrawingOrderHelper = null;
    mPath = null;
    mBackfaceOpacity = 1.f;
    mBackfaceVisibility = "visible";
  }

  /* package */ void recycleView() {
    // Remove dangling listeners
    if (mAllChildren != null && mChildrenLayoutChangeListener != null) {
      for (int i = 0; i < mAllChildrenCount; i++) {
        mAllChildren[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
      }
    }

    // Set default field values
    initView();
    mOverflowInset.setEmpty();
    sHelperRect.setEmpty();

    // Remove any children
    removeAllViews();

    // Reset background, borders
    updateBackgroundDrawable(null);

    resetPointerEvents();

    cleanupFocusGuideTalkbackAccessibilityDelegate();
  }

  private ViewGroupDrawingOrderHelper getDrawingOrderHelper() {
    if (mDrawingOrderHelper == null) {
      mDrawingOrderHelper = new ViewGroupDrawingOrderHelper(this);
    }
    return mDrawingOrderHelper;
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    MeasureSpecAssertions.assertExplicitMeasureSpec(widthMeasureSpec, heightMeasureSpec);

    setMeasuredDimension(
        MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec));
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // No-op since UIManagerModule handles actually laying out children.
  }

  @Override
  @SuppressLint("MissingSuperCall")
  public void requestLayout() {
    // No-op, terminate `requestLayout` here, UIManagerModule handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }

  @TargetApi(23)
  @Override
  public void dispatchProvideStructure(ViewStructure structure) {
    try {
      super.dispatchProvideStructure(structure);
    } catch (NullPointerException e) {
      FLog.e(TAG, "NullPointerException when executing dispatchProvideStructure", e);
    }
  }

  @Override
  public void setBackgroundColor(int color) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBackgroundColor(this, color);
    } else {
      if (color == Color.TRANSPARENT && mCSSBackgroundDrawable == null) {
        // don't do anything, no need to allocate ReactBackgroundDrawable for transparent background
      } else {
        getOrCreateReactViewBackground().setColor(color);
      }
    }
  }

  @UnstableReactNativeAPI
  /*package*/ void setBackgroundImage(@Nullable List<BackgroundImageLayer> backgroundImageLayers) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBackgroundImage(this, backgroundImageLayers);
    } else {
      getOrCreateReactViewBackground().setBackgroundImage(backgroundImageLayers);
    }
  }

  @Deprecated(since = "0.76.0", forRemoval = true)
  public void setTranslucentBackgroundDrawable(@Nullable Drawable background) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setFeedbackUnderlay(this, background);
    } else {
      // it's required to call setBackground to null, as in some of the cases we may set new
      // background to be a layer drawable that contains a drawable that has been setup
      // as a background previously. This will not work correctly as the drawable callback logic is
      // messed up in AOSP
      updateBackgroundDrawable(null);
      if (mCSSBackgroundDrawable != null && background != null) {
        LayerDrawable layerDrawable =
            new LayerDrawable(new Drawable[] {mCSSBackgroundDrawable, background});
        updateBackgroundDrawable(layerDrawable);
      } else if (background != null) {
        updateBackgroundDrawable(background);
      }
    }
  }

  @Override
  public void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener) {
    mOnInterceptTouchEventListener = listener;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (mOnInterceptTouchEventListener != null
        && mOnInterceptTouchEventListener.onInterceptTouchEvent(this, ev)) {
      return true;
    }
    // We intercept the touch event if the children are not supposed to receive it.
    if (!PointerEvents.canChildrenBeTouchTarget(mPointerEvents)) {
      return true;
    }
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    // We do not accept the touch event if this view is not supposed to receive it.
    if (!PointerEvents.canBeTouchTarget(mPointerEvents)) {
      return false;
    }
    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true;
  }

  @Override
  public boolean dispatchGenericMotionEvent(MotionEvent ev) {
    // We do not dispatch the motion event if its children are not supposed to receive it
    if (!PointerEvents.canChildrenBeTouchTarget(mPointerEvents)) {
      return false;
    }

    return super.dispatchGenericMotionEvent(ev);
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  @Override
  public boolean hasOverlappingRendering() {
    return mNeedsOffscreenAlphaCompositing;
  }

  /** See the documentation of needsOffscreenAlphaCompositing in View.js. */
  public void setNeedsOffscreenAlphaCompositing(boolean needsOffscreenAlphaCompositing) {
    mNeedsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing;
  }

  public void setBorderWidth(int position, float width) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderWidth(
          this, LogicalEdge.values()[position], PixelUtil.toDIPFromPixel(width));
    } else {
      getOrCreateReactViewBackground().setBorderWidth(position, width);
    }
  }

  public void setBorderColor(int position, @Nullable Integer color) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.values()[position], color);
    } else {
      getOrCreateReactViewBackground().setBorderColor(position, color);
    }
  }

  /**
   * @deprecated Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setBorderRadius(float borderRadius) {
    setBorderRadius(borderRadius, BorderRadiusProp.BORDER_RADIUS.ordinal());
  }

  /**
   * @deprecated Use {@link #setBorderRadius(BorderRadiusProp, LengthPercentage)} instead.
   */
  @Deprecated(since = "0.75.0", forRemoval = true)
  public void setBorderRadius(float borderRadius, int position) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable
      LengthPercentage radius =
          Float.isNaN(borderRadius)
              ? null
              : new LengthPercentage(borderRadius, LengthPercentageType.POINT);
      BackgroundStyleApplicator.setBorderRadius(this, BorderRadiusProp.values()[position], radius);
    } else {
      getOrCreateReactViewBackground().setRadius(borderRadius, position);
    }
  }

  public void setBorderRadius(BorderRadiusProp property, @Nullable LengthPercentage borderRadius) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderRadius(this, property, borderRadius);
    } else {
      CSSBackgroundDrawable backgroundDrawable = getOrCreateReactViewBackground();
      backgroundDrawable.setBorderRadius(property, borderRadius);
    }
  }

  public void setBorderStyle(@Nullable String style) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      BackgroundStyleApplicator.setBorderStyle(
          this, style == null ? null : BorderStyle.fromString(style));
    } else {
      getOrCreateReactViewBackground().setBorderStyle(style);
    }
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    if (removeClippedSubviews == mRemoveClippedSubviews) {
      return;
    }
    mRemoveClippedSubviews = removeClippedSubviews;
    if (removeClippedSubviews) {
      mClippingRect = new Rect();
      ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
      mAllChildrenCount = getChildCount();
      int initialSize = Math.max(12, mAllChildrenCount);
      mAllChildren = new View[initialSize];
      mChildrenLayoutChangeListener = new ChildrenLayoutChangeListener(this);
      for (int i = 0; i < mAllChildrenCount; i++) {
        View child = getChildAt(i);
        mAllChildren[i] = child;
        child.addOnLayoutChangeListener(mChildrenLayoutChangeListener);
      }
      updateClippingRect();
    } else {
      // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
      Assertions.assertNotNull(mClippingRect);
      Assertions.assertNotNull(mAllChildren);
      Assertions.assertNotNull(mChildrenLayoutChangeListener);
      for (int i = 0; i < mAllChildrenCount; i++) {
        mAllChildren[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
      }
      getDrawingRect(mClippingRect);
      updateClippingToRect(mClippingRect);
      mAllChildren = null;
      mClippingRect = null;
      mAllChildrenCount = 0;
      mChildrenLayoutChangeListener = null;
    }
  }

  @Override
  public boolean getRemoveClippedSubviews() {
    return mRemoveClippedSubviews;
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(mClippingRect);
  }

  @Override
  public void updateClippingRect() {
    if (!mRemoveClippedSubviews) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);

    ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
    updateClippingToRect(mClippingRect);
  }

  private void updateClippingToRect(Rect clippingRect) {
    Assertions.assertNotNull(mAllChildren);
    int clippedSoFar = 0;
    for (int i = 0; i < mAllChildrenCount; i++) {
      updateSubviewClipStatus(clippingRect, i, clippedSoFar);
      if (mAllChildren[i].getParent() == null) {
        clippedSoFar++;
      }
    }
  }

  private void updateSubviewClipStatus(Rect clippingRect, int idx, int clippedSoFar) {
    UiThreadUtil.assertOnUiThread();

    View child = Assertions.assertNotNull(mAllChildren)[idx];
    sHelperRect.set(child.getLeft(), child.getTop(), child.getRight(), child.getBottom());
    boolean intersects =
        clippingRect.intersects(
            sHelperRect.left, sHelperRect.top, sHelperRect.right, sHelperRect.bottom);
    boolean needUpdateClippingRecursive = false;
    // We never want to clip children that are being animated, as this can easily break layout :
    // when layout animation changes size and/or position of views contained inside a listview that
    // clips offscreen children, we need to ensure that, when view exits the viewport, final size
    // and position is set prior to removing the view from its listview parent.
    // Otherwise, when view gets re-attached again, i.e when it re-enters the viewport after scroll,
    // it won't be size and located properly.
    Animation animation = child.getAnimation();
    boolean isAnimating = animation != null && !animation.hasEnded();
    if (!intersects && child.getParent() != null && !isAnimating) {
      recoverFocus(child);
      // We can try saving on invalidate call here as the view that we remove is out of visible area
      // therefore invalidation is not necessary.
      removeViewInLayout(child);
      needUpdateClippingRecursive = true;
    } else if (intersects && child.getParent() == null) {
      addViewInLayout(child, idx - clippedSoFar, sDefaultLayoutParam, true);
      invalidate();
      needUpdateClippingRecursive = true;
    } else if (intersects) {
      // If there is any intersection we need to inform the child to update its clipping rect
      needUpdateClippingRecursive = true;
    }
    if (needUpdateClippingRecursive) {
      if (child instanceof ReactClippingViewGroup) {
        // we don't use {@link sHelperRect} until the end of this loop, therefore it's safe
        // to call this method that may write to the same {@link sHelperRect} object.
        ReactClippingViewGroup clippingChild = (ReactClippingViewGroup) child;
        if (clippingChild.getRemoveClippedSubviews()) {
          clippingChild.updateClippingRect();
        }
      }
    }
  }

  private void updateSubviewClipStatus(View subview) {
    if (!mRemoveClippedSubviews || getParent() == null) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);

    // do fast check whether intersect state changed
    sHelperRect.set(subview.getLeft(), subview.getTop(), subview.getRight(), subview.getBottom());
    boolean intersects =
        mClippingRect.intersects(
            sHelperRect.left, sHelperRect.top, sHelperRect.right, sHelperRect.bottom);

    // If it was intersecting before, should be attached to the parent
    boolean oldIntersects = (subview.getParent() != null);

    if (intersects != oldIntersects) {
      int clippedSoFar = 0;
      for (int i = 0; i < mAllChildrenCount; i++) {
        if (mAllChildren[i] == subview) {
          updateSubviewClipStatus(mClippingRect, i, clippedSoFar);
          break;
        }
        if (mAllChildren[i].getParent() == null) {
          clippedSoFar++;
        }
      }
    }
  }

  @Override
  public boolean getChildVisibleRect(View child, Rect r, android.graphics.Point offset) {
    return super.getChildVisibleRect(child, r, offset);
  }

  private View getFirstFocusableView(ReactViewGroup viewGroup) {
    ArrayList<View> focusables = new ArrayList<View>(0);
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
    super.addFocusables(focusables, FOCUS_DOWN, FOCUSABLES_ALL);
    /**
     * Depending on ViewGroup's `descendantFocusability` property,
     * the first element can be the ViewGroup itself.
     * The other ones on the list can be non-focusable as well.
     * So, we run a loop till finding the first real focusable element.
     */
    if (focusables.size() <= 0) return null;

    View firstFocusableElement = null;
    int index = 0;
    while (firstFocusableElement == null && index < focusables.size()) {
      View elem = focusables.get(index);
      if (elem != viewGroup) {
        firstFocusableElement = elem;
        break;
      }
      index++;
    }

    return firstFocusableElement;
  }

  boolean moveFocusToFirstFocusable(ReactViewGroup viewGroup) {
    View firstFocusableElement = this.getFirstFocusableView(viewGroup);

    if (firstFocusableElement != null) return firstFocusableElement.requestFocus();

    return false;
  }

  void recoverFocus(View view) {
    if (!view.hasFocus() || !(view instanceof ReactViewGroup)) return;

    ReactViewGroup parentFocusGuide = findParentFocusGuide(view);
    if (parentFocusGuide == null) return;

    /**
     * Making `parentFocusGuide` focusable for a brief time to
     * temporarily move the focus to it. We do this to prevent
     * Android from moving the focus to top-left-most element of the screen.
     */
    parentFocusGuide.mRecoverFocus = true;
    parentFocusGuide.setFocusable(true);
    parentFocusGuide.requestFocus();

    /**
     * We set a Runnable to wait and make sure every layout related action gets completed
     * before trying to find a new focus candidate inside the `parentFocusGuide`.
     */
    UiThreadUtil.runOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          /**
           * Focus can move to an another element while waiting for the next frame.
           * E.g: An element with `hasTVPreferredFocus` can appear.
           *
           * We check here to make sure `parentFocusGuide` still remains the focus
           * before recovering the focus to make sure we don't accidentally override it.
           */
          if (parentFocusGuide.isFocused()) {
            moveFocusToFirstFocusable(parentFocusGuide);
          }

          parentFocusGuide.setFocusable(false);
          parentFocusGuide.mRecoverFocus = false;
        }
      });
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    super.onSizeChanged(w, h, oldw, oldh);
    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  private boolean customDrawOrderDisabled() {
    if (getId() == NO_ID) {
      return false;
    }

    // Custom draw order is disabled for Fabric.
    return ViewUtil.getUIManagerType(getId()) == UIManagerType.FABRIC;
  }

  private void handleAddView(View view) {
    UiThreadUtil.assertOnUiThread();

    if (!customDrawOrderDisabled()) {
      getDrawingOrderHelper().handleAddView(view);
      setChildrenDrawingOrderEnabled(getDrawingOrderHelper().shouldEnableCustomDrawingOrder());
    } else {
      setChildrenDrawingOrderEnabled(false);
    }
  }

  private void handleRemoveView(View view) {
    UiThreadUtil.assertOnUiThread();

    if (!customDrawOrderDisabled()) {
      if (indexOfChild(view) == -1) {
        return;
      }
      getDrawingOrderHelper().handleRemoveView(view);
      setChildrenDrawingOrderEnabled(getDrawingOrderHelper().shouldEnableCustomDrawingOrder());
    } else {
      setChildrenDrawingOrderEnabled(false);
    }
  }

  private void handleRemoveViews(int start, int count) {
    int endIndex = start + count;
    for (int index = start; index < endIndex; index++) {
      if (index < getChildCount()) {
        handleRemoveView(getChildAt(index));
      }
    }
  }

  @Override
  public void addView(View child, int index, ViewGroup.LayoutParams params) {
    // This will get called for every overload of addView so there is not need to override every
    // method.
    handleAddView(child);
    super.addView(child, index, params);
  }

  @Override
  protected boolean addViewInLayout(
      View child, int index, LayoutParams params, boolean preventRequestLayout) {
    handleAddView(child);
    return super.addViewInLayout(child, index, params, preventRequestLayout);
  }

  @Override
  public void removeView(View view) {
    handleRemoveView(view);
    recoverFocus(view);
    super.removeView(view);
  }

  @Override
  public void removeViewAt(int index) {
    handleRemoveView(getChildAt(index));
    recoverFocus(getChildAt(index));
    super.removeViewAt(index);
  }

  @Override
  public void removeViewInLayout(View view) {
    handleRemoveView(view);
    super.removeViewInLayout(view);
  }

  @Override
  public void removeViewsInLayout(int start, int count) {
    handleRemoveViews(start, count);
    super.removeViewsInLayout(start, count);
  }

  @Override
  public void removeViews(int start, int count) {
    handleRemoveViews(start, count);
    super.removeViews(start, count);
  }

  @Override
  protected int getChildDrawingOrder(int childCount, int index) {
    UiThreadUtil.assertOnUiThread();

    if (!customDrawOrderDisabled()) {
      return getDrawingOrderHelper().getChildDrawingOrder(childCount, index);
    } else {
      return index;
    }
  }

  @Override
  public int getZIndexMappedChildIndex(int index) {
    UiThreadUtil.assertOnUiThread();

    if (!customDrawOrderDisabled() && getDrawingOrderHelper().shouldEnableCustomDrawingOrder()) {
      return getDrawingOrderHelper().getChildDrawingOrder(getChildCount(), index);
    }

    // Fabric behavior
    return index;
  }

  @Override
  public void updateDrawingOrder() {
    if (customDrawOrderDisabled()) {
      return;
    }

    getDrawingOrderHelper().update();
    setChildrenDrawingOrderEnabled(getDrawingOrderHelper().shouldEnableCustomDrawingOrder());
    invalidate();
  }

  @Override
  public PointerEvents getPointerEvents() {
    return mPointerEvents;
  }

  @Override
  protected void dispatchSetPressed(boolean pressed) {
    // Prevents the ViewGroup from dispatching the pressed state
    // to it's children.
  }

  public void setPointerEvents(PointerEvents pointerEvents) {
    mPointerEvents = pointerEvents;
  }

  /*package*/ void resetPointerEvents() {
    mPointerEvents = PointerEvents.AUTO;
  }

  /*package*/ int getAllChildrenCount() {
    return mAllChildrenCount;
  }

  /*package*/ @Nullable
  View getChildAtWithSubviewClippingEnabled(int index) {
    return index >= 0 && index < mAllChildrenCount
        ? Assertions.assertNotNull(mAllChildren)[index]
        : null;
  }

  /*package*/ void addViewWithSubviewClippingEnabled(View child, int index) {
    addViewWithSubviewClippingEnabled(child, index, sDefaultLayoutParam);
  }

  /*package*/ void addViewWithSubviewClippingEnabled(
      final View child, int index, ViewGroup.LayoutParams params) {
    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);
    addInArray(child, index);
    // we add view as "clipped" and then run {@link #updateSubviewClipStatus} to conditionally
    // attach it
    int clippedSoFar = 0;
    for (int i = 0; i < index; i++) {
      if (mAllChildren[i].getParent() == null) {
        clippedSoFar++;
      }
    }
    updateSubviewClipStatus(mClippingRect, index, clippedSoFar);
    child.addOnLayoutChangeListener(mChildrenLayoutChangeListener);

    if (child instanceof ReactClippingProhibitedView) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              if (!child.isShown()) {
                ReactSoftExceptionLogger.logSoftException(
                    TAG,
                    new ReactNoCrashSoftException(
                        "Child view has been added to Parent view in which it is clipped and not"
                            + " visible. This is not legal for this particular child view. Child: ["
                            + child.getId()
                            + "] "
                            + child.toString()
                            + " Parent: ["
                            + getId()
                            + "] "
                            + toString()));
              }
            }
          });
    }
  }

  /*package*/ void removeViewWithSubviewClippingEnabled(View view) {
    UiThreadUtil.assertOnUiThread();

    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mClippingRect);
    Assertions.assertNotNull(mAllChildren);
    view.removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
    int index = indexOfChildInAllChildren(view);
    if (mAllChildren[index].getParent() != null) {
      int clippedSoFar = 0;
      for (int i = 0; i < index; i++) {
        if (mAllChildren[i].getParent() == null) {
          clippedSoFar++;
        }
      }
      removeViewsInLayout(index - clippedSoFar, 1);
    }
    removeFromArray(index);
  }

  /*package*/ void removeAllViewsWithSubviewClippingEnabled() {
    Assertions.assertCondition(mRemoveClippedSubviews);
    Assertions.assertNotNull(mAllChildren);
    for (int i = 0; i < mAllChildrenCount; i++) {
      mAllChildren[i].removeOnLayoutChangeListener(mChildrenLayoutChangeListener);
    }
    removeAllViewsInLayout();
    mAllChildrenCount = 0;
  }

  private int indexOfChildInAllChildren(View child) {
    final int count = mAllChildrenCount;
    final View[] children = Assertions.assertNotNull(mAllChildren);
    for (int i = 0; i < count; i++) {
      if (children[i] == child) {
        return i;
      }
    }
    return -1;
  }

  private void addInArray(View child, int index) {
    View[] children = Assertions.assertNotNull(mAllChildren);
    final int count = mAllChildrenCount;
    final int size = children.length;
    if (index == count) {
      if (size == count) {
        mAllChildren = new View[size + ARRAY_CAPACITY_INCREMENT];
        System.arraycopy(children, 0, mAllChildren, 0, size);
        children = mAllChildren;
      }
      children[mAllChildrenCount++] = child;
    } else if (index < count) {
      if (size == count) {
        mAllChildren = new View[size + ARRAY_CAPACITY_INCREMENT];
        System.arraycopy(children, 0, mAllChildren, 0, index);
        System.arraycopy(children, index, mAllChildren, index + 1, count - index);
        children = mAllChildren;
      } else {
        System.arraycopy(children, index, children, index + 1, count - index);
      }
      children[index] = child;
      mAllChildrenCount++;
    } else {
      throw new IndexOutOfBoundsException("index=" + index + " count=" + count);
    }
  }

  private void removeFromArray(int index) {
    final View[] children = Assertions.assertNotNull(mAllChildren);
    final int count = mAllChildrenCount;
    if (index == count - 1) {
      children[--mAllChildrenCount] = null;
    } else if (index >= 0 && index < count) {
      System.arraycopy(children, index + 1, children, index, count - index - 1);
      children[--mAllChildrenCount] = null;
    } else {
      throw new IndexOutOfBoundsException();
    }
  }

  private boolean needsIsolatedLayer() {
    if (!ReactNativeFeatureFlags.enableAndroidMixBlendModeProp()) {
      return false;
    }

    for (int i = 0; i < getChildCount(); i++) {
      if (getChildAt(i).getTag(R.id.mix_blend_mode) != null) {
        return true;
      }
    }

    return false;
  }

  @VisibleForTesting
  public int getBackgroundColor() {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      @Nullable Integer color = BackgroundStyleApplicator.getBackgroundColor(this);
      return color == null ? DEFAULT_BACKGROUND_COLOR : color;
    } else {
      if (getBackground() != null) {
        return ((CSSBackgroundDrawable) getBackground()).getColor();
      }
      return DEFAULT_BACKGROUND_COLOR;
    }
  }

  /* package */ CSSBackgroundDrawable getOrCreateReactViewBackground() {
    if (mCSSBackgroundDrawable == null) {
      mCSSBackgroundDrawable = new CSSBackgroundDrawable(getContext());
      Drawable backgroundDrawable = getBackground();
      updateBackgroundDrawable(
          null); // required so that drawable callback is cleared before we add the
      // drawable back as a part of LayerDrawable
      if (backgroundDrawable == null) {
        updateBackgroundDrawable(mCSSBackgroundDrawable);
      } else {
        LayerDrawable layerDrawable =
            new LayerDrawable(new Drawable[] {mCSSBackgroundDrawable, backgroundDrawable});
        updateBackgroundDrawable(layerDrawable);
      }
      if (!ReactNativeFeatureFlags.setAndroidLayoutDirection()) {
        mCSSBackgroundDrawable.setLayoutDirectionOverride(
            I18nUtil.getInstance().isRTL(getContext())
                ? LAYOUT_DIRECTION_RTL
                : LAYOUT_DIRECTION_LTR);
      }
    }
    return mCSSBackgroundDrawable;
  }

  @Override
  public @Nullable Rect getHitSlopRect() {
    return mHitSlopRect;
  }

  public void setHitSlopRect(@Nullable Rect rect) {
    mHitSlopRect = rect;
  }

  public void setOverflow(@Nullable String overflow) {
    if (overflow == null) {
      mOverflow = Overflow.VISIBLE;
    } else {
      @Nullable Overflow parsedOverflow = Overflow.fromString(overflow);
      mOverflow = parsedOverflow == null ? Overflow.VISIBLE : parsedOverflow;
    }

    invalidate();
  }

  @Override
  public @Nullable String getOverflow() {
    switch (mOverflow) {
      case HIDDEN:
        return "hidden";
      case SCROLL:
        return "scroll";
      case VISIBLE:
        return "visible";
    }

    return null;
  }

  @Override
  public void setOverflowInset(int left, int top, int right, int bottom) {
    if (needsIsolatedLayer()
        && (mOverflowInset.left != left
            || mOverflowInset.top != top
            || mOverflowInset.right != right
            || mOverflowInset.bottom != bottom)) {
      invalidate();
    }
    mOverflowInset.set(left, top, right, bottom);
  }

  @Override
  public Rect getOverflowInset() {
    return mOverflowInset;
  }

  /**
   * Set the background for the view or remove the background. It calls {@link
   * #setBackground(Drawable)} or {@link #setBackgroundDrawable(Drawable)} based on the sdk version.
   *
   * @param drawable {@link Drawable} The Drawable to use as the background, or null to remove the
   *     background
   */
  /* package */ void updateBackgroundDrawable(@Nullable Drawable drawable) {
    super.setBackground(drawable);
  }

  @Override
  public void draw(Canvas canvas) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        && ViewUtil.getUIManagerType(this) == UIManagerType.FABRIC
        && needsIsolatedLayer()) {

      // Check if the view is a stacking context and has children, if it does, do the rendering
      // offscreen and then composite back. This follows the idea of group isolation on blending
      // https://www.w3.org/TR/compositing-1/#isolationblending
      Rect overflowInset = getOverflowInset();
      canvas.saveLayer(
          overflowInset.left,
          overflowInset.top,
          getWidth() + -overflowInset.right,
          getHeight() + -overflowInset.bottom,
          null);
      super.draw(canvas);
      canvas.restore();
    } else {
      super.draw(canvas);
    }
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    if (ReactNativeFeatureFlags.enableBackgroundStyleApplicator()) {
      if (mOverflow != Overflow.VISIBLE || getTag(R.id.filter) != null) {
        BackgroundStyleApplicator.clipToPaddingBox(this, canvas);
      }
      super.dispatchDraw(canvas);
      return;
    }

    try {
      dispatchOverflowDraw(canvas);
      super.dispatchDraw(canvas);
    } catch (NullPointerException | StackOverflowError e) {
      // Adding special exception management for StackOverflowError for logging purposes.
      // This will be removed in the future.
      RootView rootView = RootViewUtil.getRootView(ReactViewGroup.this);
      if (rootView != null) {
        rootView.handleException(e);
      } else {
        if (getContext() instanceof ReactContext) {
          ReactContext reactContext = (ReactContext) getContext();
          reactContext.handleException(
              new IllegalViewOperationException("StackOverflowException", this, e));
        } else {
          throw e;
        }
      }
    }
  }

  @Override
  protected boolean drawChild(Canvas canvas, View child, long drawingTime) {
    boolean drawWithZ = child.getElevation() > 0;

    if (drawWithZ) {
      CanvasUtil.enableZ(canvas, true);
    }

    BlendMode mixBlendMode = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && needsIsolatedLayer()) {
      mixBlendMode = (BlendMode) child.getTag(R.id.mix_blend_mode);
      if (mixBlendMode != null) {
        Paint p = new Paint();
        p.setBlendMode(mixBlendMode);
        Rect overflowInset = getOverflowInset();
        canvas.saveLayer(
            overflowInset.left,
            overflowInset.top,
            getWidth() + -overflowInset.right,
            getHeight() + -overflowInset.bottom,
            p);
      }
    }

    boolean result = super.drawChild(canvas, child, drawingTime);

    if (mixBlendMode != null) {
      canvas.restore();
    }

    if (drawWithZ) {
      CanvasUtil.enableZ(canvas, false);
    }
    return result;
  }

  private void dispatchOverflowDraw(Canvas canvas) {
    Overflow tempOverflow = mOverflow;

    // If the view contains a filter, we clip to the padding box.
    if (getTag(R.id.filter) != null) {
      tempOverflow = Overflow.HIDDEN;
    }

    switch (tempOverflow) {
      case VISIBLE:
        if (mPath != null) {
          mPath.rewind();
        }
        break;
      case HIDDEN:
      case SCROLL:
        float left = 0f;
        float top = 0f;
        float right = getWidth();
        float bottom = getHeight();

        boolean hasClipPath = false;

        if (mCSSBackgroundDrawable != null) {
          final RectF borderWidth = mCSSBackgroundDrawable.getDirectionAwareBorderInsets();

          if (borderWidth.top > 0
              || borderWidth.left > 0
              || borderWidth.bottom > 0
              || borderWidth.right > 0) {
            left += borderWidth.left;
            top += borderWidth.top;
            right -= borderWidth.right;
            bottom -= borderWidth.bottom;
          }

          final ComputedBorderRadius borderRadius =
              mCSSBackgroundDrawable.getComputedBorderRadius();

          if (borderRadius.hasRoundedBorders()) {
            if (mPath == null) {
              mPath = new Path();
            }

            CornerRadii topLeftRadius = borderRadius.getTopLeft().toPixelFromDIP();
            CornerRadii topRightRadius = borderRadius.getTopRight().toPixelFromDIP();
            CornerRadii bottomLeftRadius = borderRadius.getBottomLeft().toPixelFromDIP();
            CornerRadii bottomRightRadius = borderRadius.getBottomRight().toPixelFromDIP();

            mPath.rewind();
            mPath.addRoundRect(
                new RectF(left, top, right, bottom),
                new float[] {
                  Math.max(topLeftRadius.getHorizontal() - borderWidth.left, 0),
                  Math.max(topLeftRadius.getVertical() - borderWidth.top, 0),
                  Math.max(topRightRadius.getHorizontal() - borderWidth.right, 0),
                  Math.max(topRightRadius.getVertical() - borderWidth.top, 0),
                  Math.max(bottomRightRadius.getHorizontal() - borderWidth.right, 0),
                  Math.max(bottomRightRadius.getVertical() - borderWidth.bottom, 0),
                  Math.max(bottomLeftRadius.getHorizontal() - borderWidth.left, 0),
                  Math.max(bottomLeftRadius.getVertical() - borderWidth.bottom, 0),
                },
                Path.Direction.CW);
            canvas.clipPath(mPath);
            hasClipPath = true;
          }
        }

        if (!hasClipPath) {
          canvas.clipRect(new RectF(left, top, right, bottom));
        }
        break;
      default:
        break;
    }
  }

  public void setOpacityIfPossible(float opacity) {
    mBackfaceOpacity = opacity;
    setBackfaceVisibilityDependantOpacity();
  }

  public void setBackfaceVisibility(String backfaceVisibility) {
    mBackfaceVisibility = backfaceVisibility;
    setBackfaceVisibilityDependantOpacity();
  }

  public void setBackfaceVisibilityDependantOpacity() {
    boolean isBackfaceVisible = mBackfaceVisibility.equals("visible");

    if (isBackfaceVisible) {
      setAlpha(mBackfaceOpacity);
      return;
    }

    float rotationX = getRotationX();
    float rotationY = getRotationY();

    boolean isFrontfaceVisible =
        (rotationX >= -90.f && rotationX < 90.f) && (rotationY >= -90.f && rotationY < 90.f);

    if (isFrontfaceVisible) {
      setAlpha(mBackfaceOpacity);
      return;
    }

    setAlpha(0);
  }

  public void initializeFocusGuideTalkbackAccessibilityDelegate() {
    if (!this.isTVFocusGuide()) {
      return;
    }

    this.originalIsFocusable = this.isFocusable();

    ReactAccessibilityDelegate viewAccessibilityDelegate = new ReactAccessibilityDelegate(
      this, originalIsFocusable, this.getImportantForAccessibility()
    ) {
      @Override
      public boolean performAccessibilityAction(View host, int action, Bundle args) {
        if (!(host instanceof ReactViewGroup self)) {
          return super.performAccessibilityAction(host, action, args);
        }
        if (action == AccessibilityNodeInfo.ACTION_FOCUS) {
          if (self.interceptAccessibilityEvents(action, args)) {
            return true;
          }
          // Handle case when focus guide cannot find any focusable child
          if (self.isTVFocusGuide() && self.getFirstFocusableView(self) == null) {
            if (self.getChildCount() > 0) {
              View child = self.getChildAt(0);
              ArrayList<View> childFocusables = new ArrayList<>(0);
              child.addFocusables(childFocusables, FOCUS_DOWN, 0);
              if (!childFocusables.isEmpty()) {
                childFocusables.get(0).performAccessibilityAction(action, args);
                return true;
              }
            }
          }
          return super.performAccessibilityAction(host, action, args);
        }
        if (action == AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS) {
          if (self.interceptAccessibilityEvents(action, args)) {
            return true;
          }
          // Handle case when focus guide cannot find any focusable child
          if (self.isTVFocusGuide() && self.getFirstFocusableView(self) == null) {
            if (self.getChildCount() > 0) {
              View child = self.getChildAt(0);
              ArrayList<View> childFocusables = new ArrayList<>(0);
              child.addFocusables(childFocusables, FOCUS_DOWN, 0);
              if (!childFocusables.isEmpty()) {
                /*
                 * Instead of forwarding AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS,
                 * let's invoke AccessibilityNodeInfo.ACTION_FOCUS
                 * to trigger focus events on JS side - the AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS
                 * will be automatically invoked later
                 */
                childFocusables.get(0).performAccessibilityAction(
                    AccessibilityNodeInfo.ACTION_FOCUS,
                    args
                );
                return true;
              }
            }
            /*
             * Let's consume event here, otherwise there might be an issue with
             * FocusGuide receiving focus instead of one of its child views
             */
            return true;
          }
          return super.performAccessibilityAction(host, action, args);
        }
        return super.performAccessibilityAction(host, action, args);
      }
    };
    ViewCompat.setAccessibilityDelegate(this, viewAccessibilityDelegate);
    this.setFocusable(true);
    this.setFocusableInTouchMode(true);
    // To force Talkback to give the a11y event to the FocusGuide
    // we need to make it look like it has some a11y label to be announced.
    // Because FocusGuide should always have at least one focusable child view,
    // which will receive forwarded a11y event from this FocusGuide,
    // the following fake label will never be announced
    this.setContentDescription("FocusGuide");
    this.isFocusGuideTalkbackAccessibilityDelegateSet = true;
  }

  public void cleanupFocusGuideTalkbackAccessibilityDelegate() {
    ViewCompat.setAccessibilityDelegate(this, null);
    this.setFocusable(this.originalIsFocusable);
    this.setFocusableInTouchMode(this.originalIsFocusable);
    this.originalIsFocusable = false;
    this.setContentDescription(null);
    this.isFocusGuideTalkbackAccessibilityDelegateSet = false;
  }

  public boolean hasFocusGuideTalkbackAccessibilityDelegate() {
    return this.isFocusGuideTalkbackAccessibilityDelegateSet;
  }

  private boolean interceptAccessibilityEvents(int action, Bundle args) {
    if (!this.isTVFocusGuide()) {
      return false;
    }

    // If it's "FocusGuide", we want to intercept
    // the event and redirect it to either:
    // 1) first available destination view from "destinations" prop
    // 2) last focused element saved when "autoFocus" prop is `true`
    // 3) first focusable child view
    View destinationView = this.findDestinationView();
    if (destinationView != null) {
      try {
        destinationView.performAccessibilityAction(action, args);
        return true;
      } catch (Exception e) {
        FLog.e(TAG, "Exception when performing accessibility action on destination view - falling back to next case (last focused view): " + e);
      }
    }
    View lastFocusedView = this.lastFocusedElement.get();
    if (lastFocusedView != null) {
      try {
        lastFocusedView.performAccessibilityAction(action, args);
        return true;
      } catch (Exception e) {
        FLog.e(TAG, "Exception when performing accessibility action on last focused view - falling back to next case (first focusable view): " + e);
      }
    }
    View firstFocusableView = this.getFirstFocusableView(this);
    if (firstFocusableView != null) {
      try {
        firstFocusableView.performAccessibilityAction(action, args);
        return true;
      } catch (Exception e) {
        FLog.e(TAG, "Exception when performing accessibility action on first focusable view - focus guide will not handle focus: " + e);
      }
    }
    return false;
  }

  private View findDestinationView() {
    for (int focusDestination : focusDestinations) {
      View childViewWithTag = findViewById(focusDestination);
      if (childViewWithTag != null) return childViewWithTag;
      View viewWithTag = getRootView().findViewById(focusDestination);
      if (viewWithTag != null) return viewWithTag;
    }
    return null;
  }

  private static boolean requestFocusViewOrAncestor(View destination) {
    View v = destination;
    while (v != null) {
      if (v.requestFocus()) {
        return true;
      }
      ViewParent parent = v.getParent();
      if (parent instanceof View) {
        v = (View) parent;
      } else {
        v = null;
      }
    }
    return false;
  }

  private boolean isFocusDestinationsSet() {
    return focusDestinations.length > 0;
  }

  boolean isTVFocusGuide() {
    /**
     * We don't count a view as `TVFocusGuide` if it has `trapFocus*` props enabled.
     * The reason is, it's a seperate functionality that has nothing to do with other
     * TVFocusGuide features that involves heavy focus management. So, the feature
     * is not directly tied to `TVFocusGuide`.
     */
    return isFocusDestinationsSet() || autoFocus;
  }

  @Nullable
  private ReactViewGroup findParentFocusGuide(View view) {
    ViewParent parent = view.getParent();

    while (parent != null) {
      if (parent instanceof ReactViewGroup) {
        ReactViewGroup elem = (ReactViewGroup) parent;
        if (elem.isTVFocusGuide()) return elem;
      }
      parent = parent.getParent();
    }

    return null;
  }

  /***
   * This is meant to be used only for TVFocusGuide.
   * @return View | null
   */
  @Nullable
  private View getFocusedChildOfFocusGuide() {
    if (!isTVFocusGuide()) return null;

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
    View focusedChild = this.getFocusedChild();
    if (focusedChild == null) return null;

    ReactViewGroup parentFocusGuide = findParentFocusGuide(focusedChild);
    if (parentFocusGuide == this) return focusedChild;

    return null;
  }

  @Override
  public void addFocusables(ArrayList<View> views, int direction, int focusableMode) {
    /**
     * TVFocusGuides should reveral their children when `mRecoverFocus` is set.
     * `mRecoverFocus` flag indicates a temporary focus recovery mode it's in which
     * requires full access to children focusable elements.
     */
    if (isTVFocusGuide() && !mRecoverFocus && this.getDescendantFocusability() != ViewGroup.FOCUS_BLOCK_DESCENDANTS) {
      View focusedChild = getFocusedChildOfFocusGuide();

      /*
       * We only include the view's (TVFocusGuide) itself if it doesn't have a child that currently has the focus.
       * Otherwise, it means focus is already in the `TVFocusGuide` and all of it's descendants should be included
       * for focus calculations.
       */
      if (focusedChild == null) {
        views.add(this);
        return;
      }
    }

    super.addFocusables(views, direction, focusableMode);
  }

  @Override
  public void requestChildFocus(View child, View focused) {
    super.requestChildFocus(child, focused);

    if (autoFocus) {
      lastFocusedElement = new WeakReference<View>(focused);
    }
  }

  @Override
  protected void onFocusChanged(boolean gainFocus, int direction, @Nullable Rect previouslyFocusedRect) {
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect);
  }

  @Override
  public boolean requestFocus(int direction, Rect previouslyFocusedRect) {
    if (!isTVFocusGuide() || mRecoverFocus) {
      return super.requestFocus(direction, previouslyFocusedRect);
    }

    if (isFocusDestinationsSet()) {
      View destination = findDestinationView();

      if (destination != null && requestFocusViewOrAncestor(destination)) {
        return true;
      }
    }

    if (this.autoFocus) {
      View lastFocusedElem = lastFocusedElement.get();

      if (lastFocusedElem != null) {

        if (lastFocusedElem.isAttachedToWindow()) {
          lastFocusedElem.requestFocus();
          return true;
        }

        /**
         * `lastFocusedElem` can get detached based on application logic.
         * If the code reaches here, that means we're dealing with that case.
         * We should set `lastFocusedElem` to null and let the focus determination
         * logic below to do its magic and redirect focus to the first element.
         */
        lastFocusedElement = new WeakReference<View>(null);
      }

      // Try moving the focus to the first focusable element otherwise.
      if (moveFocusToFirstFocusable(this)) {
        return true;
      }
    }

    return super.requestFocus(direction, previouslyFocusedRect);
  }

  @Override
  public View focusSearch(View focused, int direction) {
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
      || (trapFocusRight && direction == FOCUS_RIGHT)) {
      return FocusFinder.getInstance().findNextFocus(this, focused, direction);
    }

    return super.focusSearch(focused, direction);
  }

  public void setFocusDestinations(@NonNull int[] focusDestinations) {
    this.focusDestinations = focusDestinations;
  }

  public void setAutoFocusTV(boolean autoFocus) {
    this.autoFocus = autoFocus;
    lastFocusedElement = new WeakReference<View>(null);
  }

  public void setTrapFocusUp(boolean enabled) {
    this.trapFocusUp = enabled;
  }

  public void setTrapFocusDown(boolean enabled) {
    this.trapFocusDown = enabled;
  }

  public void setTrapFocusLeft(boolean enabled) {
    this.trapFocusLeft = enabled;
  }

  public void setTrapFocusRight(boolean enabled) {
    this.trapFocusRight = enabled;
  }
}
