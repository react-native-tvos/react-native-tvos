/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollViewComponentView.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTConstants.h>
#import <React/RCTScrollEvent.h>

#import <react/renderer/components/scrollview/RCTComponentViewHelpers.h>
#import <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#import <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>
#import <react/renderer/components/scrollview/ScrollViewState.h>
#import <react/renderer/components/scrollview/conversions.h>

#import "RCTConversions.h"
#import "RCTCustomPullToRefreshViewProtocol.h"
#import "RCTEnhancedScrollView.h"
#import "RCTFabricComponentsPlugins.h"

#if TARGET_OS_TV
#import "RCTTVRemoteHandler.h"
#endif

using namespace facebook::react;

static const CGFloat kClippingLeeway = 44.0;
static const float TV_DEFAULT_SWIPE_DURATION = 0.3;

static UIScrollViewKeyboardDismissMode RCTUIKeyboardDismissModeFromProps(const ScrollViewProps &props)
{
  switch (props.keyboardDismissMode) {
    case ScrollViewKeyboardDismissMode::None:
      return UIScrollViewKeyboardDismissModeNone;
    case ScrollViewKeyboardDismissMode::OnDrag:
      return UIScrollViewKeyboardDismissModeOnDrag;
    case ScrollViewKeyboardDismissMode::Interactive:
      return UIScrollViewKeyboardDismissModeInteractive;
  }
}

static UIScrollViewIndicatorStyle RCTUIScrollViewIndicatorStyleFromProps(const ScrollViewProps &props)
{
  switch (props.indicatorStyle) {
    case ScrollViewIndicatorStyle::Default:
      return UIScrollViewIndicatorStyleDefault;
    case ScrollViewIndicatorStyle::Black:
      return UIScrollViewIndicatorStyleBlack;
    case ScrollViewIndicatorStyle::White:
      return UIScrollViewIndicatorStyleWhite;
  }
}

// Once Fabric implements proper NativeAnimationDriver, this should be removed.
// This is just a workaround to allow animations based on onScroll event.
// This is only used to animate sticky headers in ScrollViews, and only the contentOffset and tag is used.
// TODO: T116850910 [Fabric][iOS] Make Fabric not use legacy RCTEventDispatcher for native-driven AnimatedEvents
static void RCTSendScrollEventForNativeAnimations_DEPRECATED(UIScrollView *scrollView, NSInteger tag)
{
  static uint16_t coalescingKey = 0;
  RCTScrollEvent *scrollEvent = [[RCTScrollEvent alloc] initWithEventName:@"onScroll"
                                                                 reactTag:[NSNumber numberWithInt:tag]
                                                  scrollViewContentOffset:scrollView.contentOffset
                                                   scrollViewContentInset:scrollView.contentInset
                                                    scrollViewContentSize:scrollView.contentSize
                                                          scrollViewFrame:scrollView.frame
                                                      scrollViewZoomScale:scrollView.zoomScale
                                                                 userData:nil
                                                            coalescingKey:coalescingKey];
  RCTBridge *bridge = [RCTBridge currentBridge];
  if (bridge) {
    [bridge.eventDispatcher sendEvent:scrollEvent];
  } else {
    NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:scrollEvent, @"event", nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED"
                                                        object:nil
                                                      userInfo:userInfo];
  }
}

@interface RCTScrollViewComponentView () <
    UIScrollViewDelegate,
    RCTScrollViewProtocol,
    RCTScrollableProtocol,
    RCTEnhancedScrollViewOverridingDelegate>

@end

@implementation RCTScrollViewComponentView {
  ScrollViewShadowNode::ConcreteState::Shared _state;
  CGSize _contentSize;
  NSTimeInterval _lastScrollEventDispatchTime;
  NSTimeInterval _scrollEventThrottle;
  // Flag indicating whether the scrolling that is currently happening
  // is triggered by user or not.
  // This helps to only update state from `scrollViewDidScroll` in case
  // some other part of the system scrolls scroll view.
  BOOL _isUserTriggeredScrolling;
  BOOL _shouldUpdateContentInsetAdjustmentBehavior;

  CGPoint _contentOffsetWhenClipped;

  __weak UIView *_contentView;

  CGRect _prevFirstVisibleFrame;
  __weak UIView *_firstVisibleView;

  CGFloat _endDraggingSensitivityMultiplier;
  CGFloat _endDraggingSensitivityVelocityMultiplier;
    
  BOOL _blockFirstTouch;
  NSMutableDictionary *_tvRemoteGestureRecognizers;
}

+ (RCTScrollViewComponentView *_Nullable)findScrollViewComponentViewForView:(UIView *)view
{
  do {
    view = view.superview;
  } while (view != nil && ![view isKindOfClass:[RCTScrollViewComponentView class]]);
  return (RCTScrollViewComponentView *)view;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ScrollViewShadowNode::defaultSharedProps();

    _scrollView = [[RCTEnhancedScrollView alloc] initWithFrame:self.bounds];
    _scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _scrollView.delaysContentTouches = NO;
    ((RCTEnhancedScrollView *)_scrollView).overridingDelegate = self;
    _isUserTriggeredScrolling = NO;
    _shouldUpdateContentInsetAdjustmentBehavior = YES;
    [self addSubview:_scrollView];

    _containerView = [[UIView alloc] initWithFrame:CGRectZero];
    [_scrollView addSubview:_containerView];

    [self.scrollViewDelegateSplitter addDelegate:self];

    _scrollEventThrottle = 0;
    _endDraggingSensitivityVelocityMultiplier = 0;
    _endDraggingSensitivityMultiplier = 1;
      
    _tvRemoteGestureRecognizers = [NSMutableDictionary new];
  }

  return self;
}

- (void)dealloc
{
  // Removing all delegates from the splitter nils the actual delegate which prevents a crash on UIScrollView
  // deallocation.
  [self.scrollViewDelegateSplitter removeAllDelegates];
}

- (RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *)scrollViewDelegateSplitter
{
  return ((RCTEnhancedScrollView *)_scrollView).delegateSplitter;
}

#pragma mark - RCTMountingTransactionObserving

- (void)mountingTransactionWillMount:(const facebook::react::MountingTransaction &)transaction
                withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry
{
  [self _prepareForMaintainVisibleScrollPosition];
}

- (void)mountingTransactionDidMount:(const MountingTransaction &)transaction
               withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry
{
  [self _remountChildren];
  [self _adjustForMaintainVisibleContentPosition];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>();
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  if (layoutMetrics.layoutDirection != oldLayoutMetrics.layoutDirection) {
    CGAffineTransform transform = (layoutMetrics.layoutDirection == LayoutDirection::LeftToRight)
        ? CGAffineTransformIdentity
        : CGAffineTransformMakeScale(-1, 1);

    _containerView.transform = transform;
    _scrollView.transform = transform;
  }
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldScrollViewProps = static_cast<const ScrollViewProps &>(*_props);
  const auto &newScrollViewProps = static_cast<const ScrollViewProps &>(*props);

#define REMAP_PROP(reactName, localName, target)                      \
  if (oldScrollViewProps.reactName != newScrollViewProps.reactName) { \
    target.localName = newScrollViewProps.reactName;                  \
  }

#define REMAP_VIEW_PROP(reactName, localName) REMAP_PROP(reactName, localName, self)
#define MAP_VIEW_PROP(name) REMAP_VIEW_PROP(name, name)
#define REMAP_SCROLL_VIEW_PROP(reactName, localName) \
  REMAP_PROP(reactName, localName, ((RCTEnhancedScrollView *)_scrollView))
#define MAP_SCROLL_VIEW_PROP(name) REMAP_SCROLL_VIEW_PROP(name, name)

  // FIXME: Commented props are not supported yet.
  MAP_SCROLL_VIEW_PROP(alwaysBounceHorizontal);
  MAP_SCROLL_VIEW_PROP(alwaysBounceVertical);
  MAP_SCROLL_VIEW_PROP(bounces);
  MAP_SCROLL_VIEW_PROP(bouncesZoom);
  MAP_SCROLL_VIEW_PROP(canCancelContentTouches);
  MAP_SCROLL_VIEW_PROP(centerContent);
  // MAP_SCROLL_VIEW_PROP(automaticallyAdjustContentInsets);
  MAP_SCROLL_VIEW_PROP(decelerationRate);
  MAP_SCROLL_VIEW_PROP(directionalLockEnabled);
  MAP_SCROLL_VIEW_PROP(maximumZoomScale);
  MAP_SCROLL_VIEW_PROP(minimumZoomScale);
  MAP_SCROLL_VIEW_PROP(scrollEnabled);
#if !TARGET_OS_TV
  MAP_SCROLL_VIEW_PROP(pagingEnabled);
  MAP_SCROLL_VIEW_PROP(pinchGestureEnabled);
  MAP_SCROLL_VIEW_PROP(scrollsToTop);
#endif
  MAP_SCROLL_VIEW_PROP(showsHorizontalScrollIndicator);
  MAP_SCROLL_VIEW_PROP(showsVerticalScrollIndicator);

  if (oldScrollViewProps.scrollIndicatorInsets != newScrollViewProps.scrollIndicatorInsets) {
    _scrollView.scrollIndicatorInsets = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.scrollIndicatorInsets);
  }

  if (oldScrollViewProps.indicatorStyle != newScrollViewProps.indicatorStyle) {
    _scrollView.indicatorStyle = RCTUIScrollViewIndicatorStyleFromProps(newScrollViewProps);
  }
    
  if (oldScrollViewProps.showsScrollIndex != newScrollViewProps.showsScrollIndex) {
      _scrollView.indexDisplayMode = newScrollViewProps.showsScrollIndex ? UIScrollViewIndexDisplayModeAutomatic : UIScrollViewIndexDisplayModeAlwaysHidden;
  }

  _endDraggingSensitivityMultiplier = newScrollViewProps.endDraggingSensitivityMultiplier;
  _endDraggingSensitivityVelocityMultiplier = newScrollViewProps.endDraggingSensitivityVelocityMultiplier;

  if (oldScrollViewProps.scrollEventThrottle != newScrollViewProps.scrollEventThrottle) {
    // Zero means "send value only once per significant logical event".
    // Prop value is in milliseconds.
    // iOS implementation uses `NSTimeInterval` (in seconds).
    CGFloat throttleInSeconds = newScrollViewProps.scrollEventThrottle / 1000.0;
    CGFloat msPerFrame = 1.0 / 60.0;
    if (throttleInSeconds < 0) {
      _scrollEventThrottle = INFINITY;
    } else if (throttleInSeconds <= msPerFrame) {
      _scrollEventThrottle = 0;
    } else {
      _scrollEventThrottle = throttleInSeconds;
    }
  }

  MAP_SCROLL_VIEW_PROP(zoomScale);

  if (oldScrollViewProps.contentInset != newScrollViewProps.contentInset) {
    _scrollView.contentInset = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.contentInset);
  }

  RCTEnhancedScrollView *scrollView = (RCTEnhancedScrollView *)_scrollView;
  if (oldScrollViewProps.contentOffset != newScrollViewProps.contentOffset) {
    _scrollView.contentOffset = RCTCGPointFromPoint(newScrollViewProps.contentOffset);
  }

  if (oldScrollViewProps.snapToAlignment != newScrollViewProps.snapToAlignment) {
    scrollView.snapToAlignment = RCTNSStringFromString(toString(newScrollViewProps.snapToAlignment));
  }

  scrollView.snapToStart = newScrollViewProps.snapToStart;
  scrollView.snapToEnd = newScrollViewProps.snapToEnd;

  if (oldScrollViewProps.snapToOffsets != newScrollViewProps.snapToOffsets) {
    NSMutableArray<NSNumber *> *snapToOffsets = [NSMutableArray array];
    for (const auto &snapToOffset : newScrollViewProps.snapToOffsets) {
      [snapToOffsets addObject:[NSNumber numberWithFloat:snapToOffset]];
    }
    scrollView.snapToOffsets = snapToOffsets;
  }

  if (oldScrollViewProps.automaticallyAdjustsScrollIndicatorInsets !=
      newScrollViewProps.automaticallyAdjustsScrollIndicatorInsets) {
    scrollView.automaticallyAdjustsScrollIndicatorInsets = newScrollViewProps.automaticallyAdjustsScrollIndicatorInsets;
  }

  if ((oldScrollViewProps.contentInsetAdjustmentBehavior != newScrollViewProps.contentInsetAdjustmentBehavior) ||
      _shouldUpdateContentInsetAdjustmentBehavior) {
    const auto contentInsetAdjustmentBehavior = newScrollViewProps.contentInsetAdjustmentBehavior;
    if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Never) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Automatic) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::ScrollableAxes) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentScrollableAxes;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Always) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAlways;
    }
    _shouldUpdateContentInsetAdjustmentBehavior = NO;
  }

  MAP_SCROLL_VIEW_PROP(disableIntervalMomentum);
  MAP_SCROLL_VIEW_PROP(snapToInterval);

  if (oldScrollViewProps.keyboardDismissMode != newScrollViewProps.keyboardDismissMode) {
    scrollView.keyboardDismissMode = RCTUIKeyboardDismissModeFromProps(newScrollViewProps);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  assert(std::dynamic_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state));
  _state = std::static_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state);
  auto &data = _state->getData();

  auto contentOffset = RCTCGPointFromPoint(data.contentOffset);
  if (!oldState && !CGPointEqualToPoint(contentOffset, CGPointZero)) {
    _scrollView.contentOffset = contentOffset;
  }

  CGSize contentSize = RCTCGSizeFromSize(data.getContentSize());

  if (CGSizeEqualToSize(_contentSize, contentSize)) {
    return;
  }

  _contentSize = contentSize;
  _containerView.frame = CGRect{RCTCGPointFromPoint(data.contentBoundingRect.origin), contentSize};

  [self _preserveContentOffsetIfNeededWithBlock:^{
    self->_scrollView.contentSize = contentSize;
  }];
}

/*
 * Disables programmatical changing of ScrollView's `contentOffset` if a touch gesture is in progress.
 */
- (void)_preserveContentOffsetIfNeededWithBlock:(void (^)())block
{
  if (!block) {
    return;
  }

  if (!_isUserTriggeredScrolling) {
    return block();
  }

  [((RCTEnhancedScrollView *)_scrollView) preserveContentOffsetWithBlock:block];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_containerView insertSubview:childComponentView atIndex:index];
  if (![childComponentView conformsToProtocol:@protocol(RCTCustomPullToRefreshViewProtocol)]) {
    _contentView = childComponentView;
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
  if (![childComponentView conformsToProtocol:@protocol(RCTCustomPullToRefreshViewProtocol)] &&
      _contentView == childComponentView) {
    _contentView = nil;
  }
}

/*
 * Returns whether or not the scroll view interaction should be blocked because
 * JavaScript was found to be the responder.
 */
- (BOOL)_shouldDisableScrollInteraction
{
  UIView *ancestorView = self.superview;

  while (ancestorView) {
    if ([ancestorView respondsToSelector:@selector(isJSResponder)]) {
      BOOL isJSResponder = ((UIView<RCTComponentViewProtocol> *)ancestorView).isJSResponder;
      if (isJSResponder) {
        return YES;
      }
    }

    ancestorView = ancestorView.superview;
  }

  return NO;
}

- (ScrollViewMetrics)_scrollViewMetrics
{
  ScrollViewMetrics metrics;
  metrics.contentSize = RCTSizeFromCGSize(_scrollView.contentSize);
  metrics.contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  metrics.contentInset = RCTEdgeInsetsFromUIEdgeInsets(_scrollView.contentInset);
  metrics.containerSize = RCTSizeFromCGSize(_scrollView.bounds.size);
  metrics.zoomScale = _scrollView.zoomScale;

  if (_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    metrics.contentOffset.x = metrics.contentSize.width - metrics.containerSize.width - metrics.contentOffset.x;
  }

  return metrics;
}

- (void)_updateStateWithContentOffset
{
  if (!_state) {
    return;
  }
  auto contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  _state->updateState([contentOffset](const ScrollViewShadowNode::ConcreteState::Data &data) {
    auto newData = data;
    newData.contentOffset = contentOffset;
    return std::make_shared<ScrollViewShadowNode::ConcreteState::Data const>(newData);
  });
}

- (void)prepareForRecycle
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  _scrollView.contentOffset = RCTCGPointFromPoint(props.contentOffset);
  // We set the default behavior to "never" so that iOS
  // doesn't do weird things to UIScrollView insets automatically
  // and keeps it as an opt-in behavior.
  _scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  _shouldUpdateContentInsetAdjustmentBehavior = YES;
  _state.reset();
  _isUserTriggeredScrolling = NO;
  CGRect oldFrame = self.frame;
  self.frame = CGRectZero;
  self.frame = oldFrame;
  _contentView = nil;
  _prevFirstVisibleFrame = CGRectZero;
  _firstVisibleView = nil;
  [super prepareForRecycle];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView
                     withVelocity:(CGPoint)velocity
              targetContentOffset:(inout CGPoint *)targetContentOffset
{
  if (fabs(_endDraggingSensitivityMultiplier - 1) > 0.0001f ||
      fabs(_endDraggingSensitivityVelocityMultiplier) > 0.0001f) {
    if (targetContentOffset->y > 0) {
      const CGFloat travel = targetContentOffset->y - scrollView.contentOffset.y;
      targetContentOffset->y = scrollView.contentOffset.y + travel * _endDraggingSensitivityMultiplier +
          velocity.y * _endDraggingSensitivityVelocityMultiplier;
    }
  }
}

- (BOOL)touchesShouldCancelInContentView:(__unused UIView *)view
{
  // Historically, `UIScrollView`s in React Native do not cancel touches
  // started on `UIControl`-based views (as normal iOS `UIScrollView`s do).
  return ![self _shouldDisableScrollInteraction];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (!_isUserTriggeredScrolling || CoreFeatures::enableGranularScrollViewStateUpdatesIOS) {
    [self _updateStateWithContentOffset];
  }

  NSTimeInterval now = CACurrentMediaTime();
  if ((_lastScrollEventDispatchTime == 0) || (now - _lastScrollEventDispatchTime > _scrollEventThrottle)) {
    _lastScrollEventDispatchTime = now;
    if (_eventEmitter) {
      static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScroll([self _scrollViewMetrics]);
    }

    RCTSendScrollEventForNativeAnimations_DEPRECATED(scrollView, self.tag);
  }

  [self _remountChildrenIfNeeded];
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView
{
  [self scrollViewDidScroll:scrollView];
}

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  _isUserTriggeredScrolling = YES;
  return YES;
}

- (void)scrollViewDidScrollToTop:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  _isUserTriggeredScrolling = NO;
  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollToTop([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollBeginDrag([self _scrollViewMetrics]);
  _isUserTriggeredScrolling = YES;
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollEndDrag([self _scrollViewMetrics]);

  [self _updateStateWithContentOffset];

  if (!decelerate) {
    // ScrollView will not decelerate and `scrollViewDidEndDecelerating` will not be called.
    // `_isUserTriggeredScrolling` must be set to NO here.
    _isUserTriggeredScrolling = NO;
  }
}

- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollBegin([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
  _isUserTriggeredScrolling = NO;
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  [self _handleFinishedScrolling:scrollView];
}

- (void)_handleFinishedScrolling:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];
  [self scrollViewDidScroll:scrollView];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view atScale:(CGFloat)scale
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollEndDrag([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (UIView *)viewForZoomingInScrollView:(__unused UIScrollView *)scrollView
{
  return _containerView;
}

#pragma mark -

- (void)_forceDispatchNextScrollEvent
{
  _lastScrollEventDispatchTime = 0;
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTScrollViewHandleCommand(self, commandName, args);
}

- (void)flashScrollIndicators
{
  [_scrollView flashScrollIndicators];
}

- (void)scrollTo:(double)x y:(double)y animated:(BOOL)animated
{
  CGPoint offset = CGPointMake(x, y);
  CGRect maxRect = CGRectMake(
      fmin(-_scrollView.contentInset.left, 0),
      fmin(-_scrollView.contentInset.top, 0),
      fmax(
          _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right +
              fmax(_scrollView.contentInset.left, 0),
          0.01),
      fmax(
          _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom +
              fmax(_scrollView.contentInset.top, 0),
          0.01)); // Make width and height greater than 0

  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!CGRectContainsPoint(maxRect, offset) && !props.scrollToOverflowEnabled) {
    CGFloat localX = fmax(offset.x, CGRectGetMinX(maxRect));
    localX = fmin(localX, CGRectGetMaxX(maxRect));
    CGFloat localY = fmax(offset.y, CGRectGetMinY(maxRect));
    localY = fmin(localY, CGRectGetMaxY(maxRect));
    offset = CGPointMake(localX, localY);
  }

  [self scrollToOffset:offset animated:animated];
}

- (void)scrollToEnd:(BOOL)animated
{
  BOOL isHorizontal = _scrollView.contentSize.width > self.frame.size.width;
  CGPoint offset;
  if (isHorizontal) {
    CGFloat offsetX = _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right;
    offset = CGPointMake(fmax(offsetX, 0), 0);
  } else {
    CGFloat offsetY = _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom;
    offset = CGPointMake(0, fmax(offsetY, 0));
  }

  [self scrollToOffset:offset animated:animated];
}

#pragma mark - Child views mounting

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Do nothing. ScrollView manages its subview clipping individually in `_remountChildren`.
}

- (void)_remountChildrenIfNeeded
{
  CGPoint contentOffset = _scrollView.contentOffset;

  if (std::abs(_contentOffsetWhenClipped.x - contentOffset.x) < kClippingLeeway &&
      std::abs(_contentOffsetWhenClipped.y - contentOffset.y) < kClippingLeeway) {
    return;
  }

  _contentOffsetWhenClipped = contentOffset;

  [self _remountChildren];
}

- (void)_remountChildren
{
  [_scrollView updateClippedSubviewsWithClipRect:CGRectInset(_scrollView.bounds, -kClippingLeeway, -kClippingLeeway)
                                  relativeToView:_scrollView];
}

#pragma mark - RCTScrollableProtocol

- (CGSize)contentSize
{
  return _contentSize;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  if (_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    // Adjusting offset.x in right to left layout direction.
    offset.x = self.contentSize.width - _scrollView.frame.size.width - offset.x;
  }

  if (CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    return;
  }

  [self _forceDispatchNextScrollEvent];

  [_scrollView setContentOffset:offset animated:animated];

  if (!animated) {
    // When not animated, the expected workflow in ``scrollViewDidEndScrollingAnimation`` after scrolling is not going
    // to get triggered. We will need to manually execute here.
    [self _handleFinishedScrolling:_scrollView];
  }
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  [_scrollView zoomToRect:rect animated:animated];
}

- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter addDelegate:scrollListener];
}

- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter removeDelegate:scrollListener];
}

#pragma mark - Maintain visible content position

- (void)_prepareForMaintainVisibleScrollPosition
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!props.maintainVisibleContentPosition) {
    return;
  }

  BOOL horizontal = _scrollView.contentSize.width > self.frame.size.width;
  int minIdx = props.maintainVisibleContentPosition.value().minIndexForVisible;
  for (NSUInteger ii = minIdx; ii < _contentView.subviews.count; ++ii) {
    // Find the first entirely visible view.
    UIView *subview = _contentView.subviews[ii];
    BOOL hasNewView = NO;
    if (horizontal) {
      hasNewView = subview.frame.origin.x > _scrollView.contentOffset.x;
    } else {
      hasNewView = subview.frame.origin.y > _scrollView.contentOffset.y;
    }
    if (hasNewView || ii == _contentView.subviews.count - 1) {
      _prevFirstVisibleFrame = subview.frame;
      _firstVisibleView = subview;
      break;
    }
  }
}

- (void)_adjustForMaintainVisibleContentPosition
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!props.maintainVisibleContentPosition) {
    return;
  }

  std::optional<int> autoscrollThreshold = props.maintainVisibleContentPosition.value().autoscrollToTopThreshold;
  BOOL horizontal = _scrollView.contentSize.width > self.frame.size.width;
  // TODO: detect and handle/ignore re-ordering
  if (horizontal) {
    CGFloat deltaX = _firstVisibleView.frame.origin.x - _prevFirstVisibleFrame.origin.x;
    if (ABS(deltaX) > 0.5) {
      CGFloat x = _scrollView.contentOffset.x;
      [self _forceDispatchNextScrollEvent];
      _scrollView.contentOffset = CGPointMake(_scrollView.contentOffset.x + deltaX, _scrollView.contentOffset.y);
      if (autoscrollThreshold) {
        // If the offset WAS within the threshold of the start, animate to the start.
        if (x <= autoscrollThreshold.value()) {
          [self scrollToOffset:CGPointMake(0, _scrollView.contentOffset.y) animated:YES];
        }
      }
    }
  } else {
    CGRect newFrame = _firstVisibleView.frame;
    CGFloat deltaY = newFrame.origin.y - _prevFirstVisibleFrame.origin.y;
    if (ABS(deltaY) > 0.5) {
      CGFloat y = _scrollView.contentOffset.y;
      [self _forceDispatchNextScrollEvent];
      _scrollView.contentOffset = CGPointMake(_scrollView.contentOffset.x, _scrollView.contentOffset.y + deltaY);
      if (autoscrollThreshold) {
        // If the offset WAS within the threshold of the start, animate to the start.
        if (y <= autoscrollThreshold.value()) {
          [self scrollToOffset:CGPointMake(_scrollView.contentOffset.x, 0) animated:YES];
        }
      }
    }
  }
}

#pragma mark Apple TV swipe and focus handling

#if TARGET_OS_TV
- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context
       withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
    if (context.previouslyFocusedView == context.nextFocusedView || !_props->isTVSelectable) {
        return;
    }
    if (context.nextFocusedView == self) {
        [self becomeFirstResponder];
        [self addSwipeGestureRecognizers];
        [self sendFocusNotification];
        // if we enter the scroll view from different view then block first touch event since it is the event that triggered the focus
        _blockFirstTouch = (unsigned long)context.focusHeading != 0;
        [self addArrowsListeners];
    } else if (context.previouslyFocusedView == self) {
        [self removeArrowsListeners];
        [self sendBlurNotification];
        [self removeSwipeGestureRecognizers];
        [self resignFirstResponder];
        // if we leave the scroll view and go up, then scroll to top; if going down,
        // scroll to bottom
        // Similarly for left and right
        RCTEnhancedScrollView *scrollView = (RCTEnhancedScrollView *)_scrollView;
        if (context.focusHeading == UIFocusHeadingUp && scrollView.snapToStart) {
            [self swipeVerticalScrollToOffset:0.0];
        } else if(context.focusHeading == UIFocusHeadingDown && scrollView.snapToEnd) {
            [self swipeVerticalScrollToOffset:scrollView.contentSize.height];
        } else if(context.focusHeading == UIFocusHeadingLeft && scrollView.snapToStart) {
            [self swipeHorizontalScrollToOffset:0.0];
        } else if(context.focusHeading == UIFocusHeadingRight && scrollView.snapToEnd) {
            [self swipeHorizontalScrollToOffset:scrollView.contentSize.width];
        }
    }
}

- (void)addArrowsListeners
{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:@"RCTTVNavigationEventNotification"
                                               object:nil];
}

- (void)removeArrowsListeners
{
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:@"RCTTVNavigationEventNotification"
                                                  object:nil];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
    NSArray *supportedEvents = [NSArray arrayWithObjects:@"up", @"down", @"left", @"right", nil];

    if (notif.object == nil || notif.object[@"eventType"] == nil || ![supportedEvents containsObject:notif.object[@"eventType"]] ) {
        return;
    }

    if (_blockFirstTouch) {
        _blockFirstTouch = NO;
        return;
    }

    BOOL isHorizontal = _scrollView.contentSize.width > self.frame.size.width;
    if (!isHorizontal) {
        if ([notif.object[@"eventType"] isEqual: @"down"]) {
            [self swipedDown];
            return;
        }

        if ([notif.object[@"eventType"] isEqual: @"up"]) {
            [self swipedUp];
            return;
        }
    }

    if ([notif.object[@"eventType"] isEqual: @"left"]) {
        [self swipedLeft];
        return;
    }

    if ([notif.object[@"eventType"] isEqual: @"right"]) {
        [self swipedRight];
        return;
    }
}

- (BOOL)shouldUpdateFocusInContext:(UIFocusUpdateContext *)context
{
    BOOL isHorizontal = _scrollView.contentSize.width > self.frame.size.width;
    // Keep focus inside the scroll view till the end of the content
    if (isHorizontal) {
        if ((context.focusHeading == UIFocusHeadingLeft && self.scrollView.contentOffset.x > 0)
            || (context.focusHeading == UIFocusHeadingRight && self.scrollView.contentOffset.x < self.scrollView.contentSize.width - self.scrollView.visibleSize.width)
        ) {
            return [UIFocusSystem environment:self containsEnvironment:context.nextFocusedItem];
        }
    } else {
        if ((context.focusHeading == UIFocusHeadingUp && self.scrollView.contentOffset.y > 0)
            || (context.focusHeading == UIFocusHeadingDown && self.scrollView.contentOffset.y < self.scrollView.contentSize.height - self.scrollView.visibleSize.height)
        ) {
            return [UIFocusSystem environment:self containsEnvironment:context.nextFocusedItem];
        }
    }

    return [super shouldUpdateFocusInContext:context];
}

- (void)sendFocusNotification
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTTVNavigationEventNotification"
                                                        object:@{ @"eventType": @"focus", @"tag": @([self tag]) }];
}

- (void)sendBlurNotification
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTTVNavigationEventNotification"
                                                        object:@{ @"eventType": @"blur", @"tag": @([self tag]) }];
}

- (NSInteger)swipeVerticalInterval
{
    RCTEnhancedScrollView *scrollView = (RCTEnhancedScrollView *)_scrollView;
    if (scrollView.snapToInterval) {
        return scrollView.snapToInterval;
    }
    return scrollView.visibleSize.height / 2;
}

- (NSInteger)swipeHorizontalInterval
{
    RCTEnhancedScrollView *scrollView = (RCTEnhancedScrollView *)_scrollView;
    if (scrollView.snapToInterval) {
        return scrollView.snapToInterval;
    }
    return scrollView.visibleSize.width / 2;
}

- (NSTimeInterval)swipeDuration
{
    auto pressDuration = _props->tvParallaxProperties.pressDuration;
    auto duration = pressDuration.has_value() ? pressDuration.value() : TV_DEFAULT_SWIPE_DURATION;
    if (duration == 0.0) {
        duration = TV_DEFAULT_SWIPE_DURATION;
    }
    return duration;
}

- (void)swipeVerticalScrollToOffset:(CGFloat)yOffset
{
    _blockFirstTouch = NO;
    dispatch_async(dispatch_get_main_queue(), ^{
        CGFloat limitedOffset = yOffset;
        limitedOffset = MAX(limitedOffset, 0.0);
        limitedOffset = MIN(limitedOffset, self.scrollView.contentSize.height - self.scrollView.visibleSize.height);
        [UIView animateWithDuration:[self swipeDuration] animations:^{
            self.scrollView.contentOffset =
                CGPointMake(self.scrollView.contentOffset.x, limitedOffset);
        }];
    });
}

- (void)swipeHorizontalScrollToOffset:(CGFloat)xOffset
{
    _blockFirstTouch = NO;
    dispatch_async(dispatch_get_main_queue(), ^{
        CGFloat limitedOffset = xOffset;
        limitedOffset = MAX(limitedOffset, 0.0);
        limitedOffset = MIN(limitedOffset, self.scrollView.contentSize.width - self.scrollView.visibleSize.width);
        [UIView animateWithDuration:[self swipeDuration] animations:^{
            self.scrollView.contentOffset =
                CGPointMake(limitedOffset, self.scrollView.contentOffset.y);
        }];
    });
}

- (void)swipedUp
{
    CGFloat newOffset = self.scrollView.contentOffset.y - [self swipeVerticalInterval];
    NSLog(@"Swiped up to %f", newOffset);
    [self swipeVerticalScrollToOffset:newOffset];
}

- (void)swipedDown
{
    CGFloat newOffset = self.scrollView.contentOffset.y + [self swipeVerticalInterval];
    NSLog(@"Swiped down to %f", newOffset);
    [self swipeVerticalScrollToOffset:newOffset];
}

- (void)swipedLeft
{
    CGFloat newOffset = self.scrollView.contentOffset.x - [self swipeHorizontalInterval];
    NSLog(@"Swiped left to %f", newOffset);
    [self swipeHorizontalScrollToOffset:newOffset];
}

- (void)swipedRight
{
    CGFloat newOffset = self.scrollView.contentOffset.x + [self swipeHorizontalInterval];
    NSLog(@"Swiped right to %f", newOffset);
    [self swipeHorizontalScrollToOffset:newOffset];
}

- (void)addSwipeGestureRecognizers
{
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedUp) direction:UISwipeGestureRecognizerDirectionUp name:RCTTVRemoteEventSwipeUp];
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedDown) direction:UISwipeGestureRecognizerDirectionDown name:RCTTVRemoteEventSwipeDown];
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedLeft) direction:UISwipeGestureRecognizerDirectionLeft name:RCTTVRemoteEventSwipeLeft];
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedRight) direction:UISwipeGestureRecognizerDirectionRight name:RCTTVRemoteEventSwipeRight];
}

- (void)addSwipeGestureRecognizerWithSelector:(nonnull SEL)selector
                                    direction:(UISwipeGestureRecognizerDirection)direction
                                         name:(NSString *)name
{
    UISwipeGestureRecognizer *recognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:selector];
    recognizer.direction = direction;

    _tvRemoteGestureRecognizers[name] = recognizer;
    [self.scrollView addGestureRecognizer:recognizer];
}

- (void)removeSwipeGestureRecognizers
{
    NSArray *names = [self->_tvRemoteGestureRecognizers allKeys];
    for (NSString *name in names) {
        UIGestureRecognizer *r = self->_tvRemoteGestureRecognizers[name];
        [self.scrollView removeGestureRecognizer:r];
        [self->_tvRemoteGestureRecognizers removeObjectForKey:name];
    }
}
#endif // TARGET_OS_TV

@end

Class<RCTComponentViewProtocol> RCTScrollViewCls(void)
{
  return RCTScrollViewComponentView.class;
}
