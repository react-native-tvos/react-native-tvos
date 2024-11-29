/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <CoreGraphics/CoreGraphics.h>
#import <QuartzCore/QuartzCore.h>
#import <objc/runtime.h>

#import <React/RCTAssert.h>
#import <React/RCTBorderDrawing.h>
#import <React/RCTBoxShadow.h>
#import <React/RCTConversions.h>
#import <React/RCTLocalizedString.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>

#import <React/RCTSurfaceHostingProxyRootView.h>
#if TARGET_OS_TV
#import <React/RCTTVNavigationEventNotification.h>
#endif

#import <react/renderer/components/view/ViewComponentDescriptor.h>
#import <react/renderer/components/view/ViewEventEmitter.h>
#import <react/renderer/components/view/ViewProps.h>
#import <react/renderer/components/view/HostPlatformViewProps.h>
#import <react/renderer/components/view/accessibilityPropsConversions.h>
#import <react/renderer/graphics/BlendMode.h>

#ifdef RCT_DYNAMIC_FRAMEWORKS
#import <React/RCTComponentViewFactory.h>
#endif

typedef struct {
  BOOL enabled;
  float shiftDistanceX;
  float shiftDistanceY;
  float tiltAngle;
  float magnification;
  float pressMagnification;
  float pressDuration;
  float pressDelay;
} ParallaxProperties;

using namespace facebook::react;

const CGFloat BACKGROUND_COLOR_ZPOSITION = -1024.0f;

@implementation RCTViewComponentView {
  UIColor *_backgroundColor;
  CALayer *_backgroundColorLayer;
  __weak CALayer *_borderLayer;
  CALayer *_boxShadowLayer;
  CALayer *_filterLayer;
  NSMutableArray<CAGradientLayer *> *_gradientLayers;
  BOOL _needsInvalidateLayer;
  BOOL _isJSResponder;
  BOOL _removeClippedSubviews;
  NSMutableArray<UIView *> *_reactSubviews;
  BOOL _motionEffectsAdded;
  NSSet<NSString *> *_Nullable _propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;
  UIView *_containerView;
  BOOL _useCustomContainerView;
  ParallaxProperties _tvParallaxProperties;
  BOOL _hasTVPreferredFocus;
  UIView *_nextFocusUp;
  UIView *_nextFocusDown;
  UIView *_nextFocusLeft;
  UIView *_nextFocusRight;
  UIView *_nextFocusActiveTarget;
  BOOL _autoFocus;
  BOOL _trapFocusUp;
  BOOL _trapFocusDown;
  BOOL _trapFocusLeft;
  BOOL _trapFocusRight;
  NSArray* _focusDestinations;
  id<UIFocusItem> _previouslyFocusedItem;
}

#ifdef RCT_DYNAMIC_FRAMEWORKS
+ (void)load
{
  [RCTComponentViewFactory.currentComponentViewFactory registerComponentViewClass:self];
}
#endif

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ViewShadowNode::defaultSharedProps();
    _reactSubviews = [NSMutableArray new];
    _useCustomContainerView = NO;
#if TARGET_OS_TV
    _tvParallaxProperties.enabled = YES;
    _tvParallaxProperties.shiftDistanceX = 2.0f;
    _tvParallaxProperties.shiftDistanceY = 2.0f;
    _tvParallaxProperties.tiltAngle = 0.05f;
    _tvParallaxProperties.magnification = 1.0f;
    _tvParallaxProperties.pressMagnification = 1.0f;
    _tvParallaxProperties.pressDuration = 0.3f;
    _tvParallaxProperties.pressDelay = 0.0f;
#else
    self.multipleTouchEnabled = YES;
#endif
  }
  return self;
}

- (facebook::react::Props::Shared)props
{
  return _props;
}

- (void)setContentView:(UIView *)contentView
{
  if (_contentView) {
    [_contentView removeFromSuperview];
  }

  _contentView = contentView;

  if (_contentView) {
    [self.currentContainerView addSubview:_contentView];
    _contentView.frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
  }
}
- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  _backgroundColor = backgroundColor;
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  if ([self.traitCollection hasDifferentColorAppearanceComparedToTraitCollection:previousTraitCollection]) {
    [self invalidateLayer];
  }
}

#if TARGET_OS_TV

#pragma mark - Apple TV methods

- (RCTSurfaceHostingProxyRootView *)containingRootView
{
  UIView *rootview = self;
  if ([rootview class] == [RCTSurfaceHostingProxyRootView class]) {
    return (RCTSurfaceHostingProxyRootView *)rootview;
  }
  do {
    rootview = [rootview superview];
  } while (([rootview class] != [RCTSurfaceHostingProxyRootView class]) && rootview != nil);
  return (RCTSurfaceHostingProxyRootView *)rootview;
}

/// Handles self-focusing logic. Shouldn't be used directly, use `requestFocusSelf` method instead.
-(bool)focusSelf {
  RCTSurfaceHostingProxyRootView *rootview = [self containingRootView];
  if (rootview == nil) return false;
  
  if (self.focusGuide != nil) {
    rootview.reactPreferredFocusEnvironments = self.focusGuide.preferredFocusEnvironments;
  } else {
    rootview.reactPreferredFocusedView = self;
  }

  [rootview setNeedsFocusUpdate];
  [rootview updateFocusIfNeeded];
  return true;
}

/// Tries to move focus to `self`. Does that synchronously if possible, fallbacks to async if it fails.
-(void)requestFocusSelf {
  bool focusedSync = [self focusSelf];
  
  if (!focusedSync) {
    // `focusSelf` function relies on `rootView` which may not be present on the first render.
    // `focusSelf` fails and returns `false` in that case. We try re-executing the same action
    // by putting it to the main queue to make sure it runs after UI creation is completed.
    dispatch_async(dispatch_get_main_queue(), ^{
      [self focusSelf];
    });
  }
}

- (void)addFocusGuide:(NSArray*)destinations {
  if (self.focusGuide == nil) {
    self.focusGuide = [UIFocusGuide new];
    [self addLayoutGuide:self.focusGuide];

    [self.focusGuide.topAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
    [self.focusGuide.bottomAnchor constraintEqualToAnchor:self.bottomAnchor].active = YES;
    [self.focusGuide.widthAnchor constraintEqualToAnchor:self.widthAnchor].active = YES;
    [self.focusGuide.heightAnchor constraintEqualToAnchor:self.heightAnchor].active = YES;
  }
  
  self.focusGuide.preferredFocusEnvironments = destinations;
}

- (void)removeFocusGuide {
  if (self.focusGuide != nil) {
    _focusDestinations = nil;
    _previouslyFocusedItem = nil;

    [self removeLayoutGuide:self.focusGuide];
    self.focusGuide = nil;
  }
}

/// Responsible of determining what focusGuide's next state should be based on the active properties of the component.
- (void)handleFocusGuide
{
  // `destinations` should always be favored against `autoFocus` feature, if provided.
  if (_focusDestinations != nil) {
    [self addFocusGuide:_focusDestinations];
  } else if (_autoFocus && _previouslyFocusedItem != nil) {
    // We also add `self` as the second option in case `previouslyFocusedItem` becomes unreachable (e.g gets detached).
    // `self` helps redirecting focus to the first focusable element in that case.
    [self addFocusGuide:@[_previouslyFocusedItem, self]];
  } else if (_autoFocus) {
    [self addFocusGuide:@[self]];
  } else {
    // Then there's no need to have `focusGuide`, remove it to prevent potential bugs.
    [self removeFocusGuide];
  }
}

- (void)setFocusDestinations:(NSArray*)destinations
{
  if(destinations.count == 0) {
    _focusDestinations = nil;
  } else {
    _focusDestinations = destinations;
  }

  [self handleFocusGuide];
}

- (void)sendFocusNotification:(__unused UIFocusUpdateContext *)context
{
    [[NSNotificationCenter defaultCenter] postNavigationFocusEventWithTag:@(self.tag) target:@(self.tag)];
}

- (void)sendBlurNotification:(__unused UIFocusUpdateContext *)context
{
    [[NSNotificationCenter defaultCenter] postNavigationBlurEventWithTag:@(self.tag) target:@(self.tag)];
}

- (void)sendSelectNotification
{
  [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventSelect keyAction:RCTTVRemoteEventKeyActionUp tag:@(self.tag) target:@(self.tag)];
}

- (void)sendLongSelectBeganNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventLongSelect keyAction:RCTTVRemoteEventKeyActionDown tag:@(self.tag) target:@(self.tag)];
}

- (void)sendLongSelectEndedNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventLongSelect keyAction:RCTTVRemoteEventKeyActionUp tag:@(self.tag) target:@(self.tag)];
}

- (void)animatePressIn
{
  if (_tvParallaxProperties.enabled == YES) {
    float pressMagnification = _tvParallaxProperties.pressMagnification;

    // Duration of press animation
    float pressDuration = _tvParallaxProperties.pressDuration;

    [UIView animateWithDuration:(pressDuration/2)
                     animations:^{
      self.transform = CGAffineTransformMakeScale(pressMagnification, pressMagnification);
    }
                     completion:^(__unused BOOL finished){}];
  }
}

- (void) animatePressOut
{
  if (_tvParallaxProperties.enabled == YES) {
    float magnification = _tvParallaxProperties.magnification;

    // Duration of press animation
    float pressDuration = _tvParallaxProperties.pressDuration;

    [UIView animateWithDuration:(pressDuration/2)
                     animations:^{
      self.transform = CGAffineTransformMakeScale(magnification, magnification);
    }
                     completion:^(__unused BOOL finished){}];
  }
}

- (void)emitPressInEvent
{
  _eventEmitter->onPressIn();
}

- (void)emitPressOutEvent
{
  _eventEmitter->onPressOut();
}

- (void)addParallaxMotionEffects
{
  if(!_tvParallaxProperties.enabled) {
    return;
  }

  if(_motionEffectsAdded == YES) {
    return;
  }

  // Size of shift movements
  CGFloat const shiftDistanceX = _tvParallaxProperties.shiftDistanceX;
  CGFloat const shiftDistanceY = _tvParallaxProperties.shiftDistanceY;

  // Make horizontal movements shift the centre left and right
  UIInterpolatingMotionEffect *xShift =
  [[UIInterpolatingMotionEffect alloc] initWithKeyPath:@"center.x"
                                                  type:UIInterpolatingMotionEffectTypeTiltAlongHorizontalAxis];
  xShift.minimumRelativeValue = @(shiftDistanceX * -1.0f);
  xShift.maximumRelativeValue = @(shiftDistanceX);

  // Make vertical movements shift the centre up and down
  UIInterpolatingMotionEffect *yShift =
  [[UIInterpolatingMotionEffect alloc] initWithKeyPath:@"center.y"
                                                  type:UIInterpolatingMotionEffectTypeTiltAlongVerticalAxis];
  yShift.minimumRelativeValue = @(shiftDistanceY * -1.0f);
  yShift.maximumRelativeValue = @(shiftDistanceY);

  // Size of tilt movements
  CGFloat const tiltAngle = _tvParallaxProperties.tiltAngle;

  // Now make horizontal movements effect a rotation about the Y axis for side-to-side rotation.
  UIInterpolatingMotionEffect *xTilt =
  [[UIInterpolatingMotionEffect alloc] initWithKeyPath:@"layer.transform"
                                                  type:UIInterpolatingMotionEffectTypeTiltAlongHorizontalAxis];

  // CATransform3D value for minimumRelativeValue
  CATransform3D transMinimumTiltAboutY = CATransform3DIdentity;
  transMinimumTiltAboutY.m34 = 1.0 / 500;
  transMinimumTiltAboutY = CATransform3DRotate(transMinimumTiltAboutY, tiltAngle * -1.0, 0, 1, 0);

  // CATransform3D value for minimumRelativeValue
  CATransform3D transMaximumTiltAboutY = CATransform3DIdentity;
  transMaximumTiltAboutY.m34 = 1.0 / 500;
  transMaximumTiltAboutY = CATransform3DRotate(transMaximumTiltAboutY, tiltAngle, 0, 1, 0);

  // Set the transform property boundaries for the interpolation
  xTilt.minimumRelativeValue = [NSValue valueWithCATransform3D:transMinimumTiltAboutY];
  xTilt.maximumRelativeValue = [NSValue valueWithCATransform3D:transMaximumTiltAboutY];

  // Now make vertical movements effect a rotation about the X axis for up and down rotation.
  UIInterpolatingMotionEffect *yTilt =
  [[UIInterpolatingMotionEffect alloc] initWithKeyPath:@"layer.transform"
                                                  type:UIInterpolatingMotionEffectTypeTiltAlongVerticalAxis];

  // CATransform3D value for minimumRelativeValue
  CATransform3D transMinimumTiltAboutX = CATransform3DIdentity;
  transMinimumTiltAboutX.m34 = 1.0 / 500;
  transMinimumTiltAboutX = CATransform3DRotate(transMinimumTiltAboutX, tiltAngle * -1.0, 1, 0, 0);

  // CATransform3D value for minimumRelativeValue
  CATransform3D transMaximumTiltAboutX = CATransform3DIdentity;
  transMaximumTiltAboutX.m34 = 1.0 / 500;
  transMaximumTiltAboutX = CATransform3DRotate(transMaximumTiltAboutX, tiltAngle, 1, 0, 0);

  // Set the transform property boundaries for the interpolation
  yTilt.minimumRelativeValue = [NSValue valueWithCATransform3D:transMinimumTiltAboutX];
  yTilt.maximumRelativeValue = [NSValue valueWithCATransform3D:transMaximumTiltAboutX];

  // Add all of the motion effects to this group
  //self.motionEffects = @[ xShift, yShift, xTilt, yTilt ];

  // In Fabric, the tilt motion transforms conflict with other CATransform3D transforms
  // being applied elsewhere in the framework. We are disabling them for now until
  // a better solution is found.
  self.motionEffects = @[ xShift, yShift ];

  float magnification = _tvParallaxProperties.magnification;

  if (magnification != 1.0) {
    [UIView animateWithDuration:0.2 animations:^{
      self.transform = CGAffineTransformScale(self.transform, magnification, magnification);
    }];
  }

  _motionEffectsAdded = YES;
}

- (void)removeParallaxMotionEffects
{
  if(_motionEffectsAdded == NO) {
    return;
  }

  [UIView animateWithDuration:0.2 animations:^{
    float magnification = self->_tvParallaxProperties.magnification;
    BOOL enabled = self->_tvParallaxProperties.enabled;
    if (enabled && magnification != 0.0 && magnification != 1.0) {
      self.transform = CGAffineTransformScale(self.transform, 1.0/magnification, 1.0/magnification);
    }
  }];

  for (UIMotionEffect *effect in [self.motionEffects copy]){
    [self removeMotionEffect:effect];
  }

  _motionEffectsAdded = NO;
}


- (BOOL)isTVFocusGuide
{
  #if TARGET_OS_TV
    return self.focusGuide != nil;
  #endif
  
  return NO;
}


- (BOOL)isUserInteractionEnabled
{
  if ([self isTVFocusGuide]) {
    return _props->isTVSelectable;
  }
  return YES;
}

- (BOOL)canBecomeFocused
{
  if ([self isTVFocusGuide]) {
    return NO;
  }
  return _props->isTVSelectable;
}

// In tvOS, to support directional focus APIs, we add a UIFocusGuide for each
// side of the view where a nextFocus has been set. Set layout constraints to
// make the guide 1 px thick, and set the destination to the nextFocus object.
//
// This is only done once the view is focused.
//
- (void)enableDirectionalFocusGuides
{
  if (!self.isFocused) {
    return;
  }
  if (self->_nextFocusUp != nil) {
    if (self.focusGuideUp == nil) {
      self.focusGuideUp = [UIFocusGuide new];
      [[self containingRootView] addLayoutGuide:self.focusGuideUp];

      [self.focusGuideUp.bottomAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
      [self.focusGuideUp.widthAnchor constraintEqualToAnchor:self.widthAnchor].active = YES;
      [self.focusGuideUp.heightAnchor constraintEqualToConstant:1.0].active = YES;
      [self.focusGuideUp.leftAnchor constraintEqualToAnchor:self.leftAnchor].active = YES;
    }

    self.focusGuideUp.preferredFocusEnvironments = @[self->_nextFocusUp];
  }

  if (self->_nextFocusDown != nil) {
    if (self.focusGuideDown == nil) {
      self.focusGuideDown = [UIFocusGuide new];
      [[self containingRootView] addLayoutGuide:self.focusGuideDown];

      [self.focusGuideDown.topAnchor constraintEqualToAnchor:self.bottomAnchor].active = YES;
      [self.focusGuideDown.widthAnchor constraintEqualToAnchor:self.widthAnchor].active = YES;
      [self.focusGuideDown.heightAnchor constraintEqualToConstant:1.0].active = YES;
      [self.focusGuideDown.leftAnchor constraintEqualToAnchor:self.leftAnchor].active = YES;
    }

    self.focusGuideDown.preferredFocusEnvironments = @[self->_nextFocusDown];
  }

  if (self->_nextFocusLeft != nil) {
    if (self.focusGuideLeft == nil) {
      self.focusGuideLeft = [UIFocusGuide new];
      [[self containingRootView] addLayoutGuide:self.focusGuideLeft];

      [self.focusGuideLeft.topAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
      [self.focusGuideLeft.widthAnchor constraintEqualToConstant:1.0].active = YES;
      [self.focusGuideLeft.heightAnchor constraintEqualToAnchor:self.heightAnchor].active = YES;
      [self.focusGuideLeft.rightAnchor constraintEqualToAnchor:self.leftAnchor].active = YES;
    }

    self.focusGuideLeft.preferredFocusEnvironments = @[self->_nextFocusLeft];
  }

  if (self->_nextFocusRight != nil) {
    if (self.focusGuideRight == nil) {
      self.focusGuideRight = [UIFocusGuide new];
      [[self containingRootView] addLayoutGuide:self.focusGuideRight];

      [self.focusGuideRight.topAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
      [self.focusGuideRight.widthAnchor constraintEqualToConstant:1.0].active = YES;
      [self.focusGuideRight.heightAnchor constraintEqualToAnchor:self.heightAnchor].active = YES;
      [self.focusGuideRight.leftAnchor constraintEqualToAnchor:self.rightAnchor].active = YES;
    }

    self.focusGuideRight.preferredFocusEnvironments = @[self->_nextFocusRight];
  }
}
// Called when focus leaves this view -- disable the directional focus guides
// (if they exist) so that they don't interfere with focus navigation from
// other views
//
- (void)disableDirectionalFocusGuides
{
  if (self.focusGuideUp != nil) {
    [[self containingRootView] removeLayoutGuide:self.focusGuideUp];
    self.focusGuideUp = nil;
  }
  if (self.focusGuideDown != nil) {
    [[self containingRootView] removeLayoutGuide:self.focusGuideDown];
    self.focusGuideDown = nil;
  }
  if (self.focusGuideLeft != nil) {
    [[self containingRootView] removeLayoutGuide:self.focusGuideLeft];
    self.focusGuideLeft = nil;
  }
  if (self.focusGuideRight != nil) {
    [[self containingRootView] removeLayoutGuide:self.focusGuideRight];
    self.focusGuideRight = nil;
  }
}

- (BOOL)shouldUpdateFocusInContext:(UIFocusUpdateContext *)context
{
  // This is  the `trapFocus*` logic that prevents the focus updates if
  // focus should be trapped and `nextFocusedItem` is not a child FocusEnv.
  if ((_trapFocusUp && context.focusHeading == UIFocusHeadingUp)
     || (_trapFocusDown && context.focusHeading == UIFocusHeadingDown)
     || (_trapFocusLeft && context.focusHeading == UIFocusHeadingLeft)
     || (_trapFocusRight && context.focusHeading == UIFocusHeadingRight)) {
    
    // Checks if `nextFocusedItem` is a child `FocusEnvironment`.
    // If not, it returns false thus it keeps the focus inside.
    return [UIFocusSystem environment:self containsEnvironment:context.nextFocusedItem];
  }

  return [super shouldUpdateFocusInContext:context];
}

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
    if (context.previouslyFocusedView == context.nextFocusedView) {
      return;
    }
  
    if (_autoFocus && self.focusGuide != nil && context.previouslyFocusedItem != nil) {
      // Whenever focus leaves the container, `nextFocusedView` is the destination, the item outside the container.
      // So, `previouslyFocusedItem` is always the last focused child of `TVFocusGuide`.
      // We should update `preferredFocusEnvironments` in this case to make sure `FocusGuide` remembers
      // the last focused element and redirects the focus to it whenever focus comes back.
      _previouslyFocusedItem = context.previouslyFocusedItem;
      [self handleFocusGuide];
    }

    if (context.nextFocusedView == self && self.isUserInteractionEnabled && ![self isTVFocusGuide]) {
      if(_eventEmitter) _eventEmitter->onFocus();

      [self becomeFirstResponder];
      [self enableDirectionalFocusGuides];
      [coordinator addCoordinatedAnimations:^(void){
          [self addParallaxMotionEffects];
          [self sendFocusNotification:context];
      } completion:^(void){}];
    } else {
      if (_eventEmitter) _eventEmitter->onBlur();

      [self disableDirectionalFocusGuides];
      [coordinator addCoordinatedAnimations:^(void){
          [self removeParallaxMotionEffects];
          [self sendBlurNotification:context];
      } completion:^(void){}];
      [self resignFirstResponder];
    }
}

#endif

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  NSLog(@"RCTViewComponentView handleCommand: %@", commandName);
  if ([commandName isEqualToString:@"setDestinations"]) {
#if TARGET_OS_TV
    if ([args count] != 1) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"View", commandName, (int)[args count], 1);
      return;
    }
    if (!RCTValidateTypeOfViewCommandArgument(args[0], [NSArray class], @"number", @"View", commandName, @"1st")) {
      return;
    }
    NSArray *destinationTags = (NSArray<NSNumber *> *)args[0];
    NSMutableArray *destinations = [NSMutableArray new];
    RCTSurfaceHostingProxyRootView *rootView = [self containingRootView];
    for (NSNumber *tag in destinationTags) {
      UIView *view = [rootView viewWithTag:[tag intValue]];
      if (view != nil) {
        [destinations addObject:view];
      }
    }
    [self setFocusDestinations:destinations];
    return;
#endif
  } else if ([commandName isEqualToString:@"requestTVFocus"]) {
#if TARGET_OS_TV
    if ([args count] != 0) {
      RCTLogError(
          @"%@ command %@ received %d arguments, expected %d.", @"View", commandName, (int)[args count], 0);
      return;
    }

    [self requestFocusSelf];
#endif
    return;
  }
#if RCT_DEBUG
  RCTLogError(@"%@ received command %@, which is not a supported command.", @"View", commandName);
#endif
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  RCTAssert(
      self == [RCTViewComponentView class],
      @"`+[RCTComponentViewProtocol componentDescriptorProvider]` must be implemented for all subclasses (and `%@` particularly).",
      NSStringFromClass([self class]));
  return concreteComponentDescriptorProvider<ViewComponentDescriptor>();
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  RCTAssert(
      childComponentView.superview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  if (_removeClippedSubviews) {
    [_reactSubviews insertObject:childComponentView atIndex:index];
  } else {
    [self.currentContainerView insertSubview:childComponentView atIndex:index];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (_removeClippedSubviews) {
    [_reactSubviews removeObjectAtIndex:index];
  } else {
    RCTAssert(
        childComponentView.superview == self.currentContainerView,
        @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
        self,
        childComponentView,
        @(index));
    RCTAssert(
        (self.currentContainerView.subviews.count > index) &&
            [self.currentContainerView.subviews objectAtIndex:index] == childComponentView,
        @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
        self,
        childComponentView,
        @(index),
        @([self.currentContainerView.subviews indexOfObject:childComponentView]),
        @([[self.currentContainerView.subviews objectAtIndex:index] tag]));
  }

  [childComponentView removeFromSuperview];
}

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  if (!_removeClippedSubviews) {
    // Use default behavior if unmounting is disabled
    return [super updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if (_reactSubviews.count == 0) {
    // Do nothing if we have no subviews
    return;
  }

  if (CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    // Do nothing if layout hasn't happened yet
    return;
  }

  // Convert clipping rect to local coordinates
  clipRect = [clipView convertRect:clipRect toView:self];

  // Mount / unmount views
  for (UIView *view in _reactSubviews) {
    if (CGRectIntersectsRect(clipRect, view.frame)) {
      // View is at least partially visible, so remount it if unmounted
      [self.currentContainerView addSubview:view];
      // View is visible, update clipped subviews
      [view updateClippedSubviewsWithClipRect:clipRect relativeToView:self];
    } else if (view.superview) {
      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }
  }
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  RCTAssert(props, @"`props` must not be `null`.");

#ifndef NS_BLOCK_ASSERTIONS
  auto propsRawPtr = _props.get();
  RCTAssert(
      propsRawPtr &&
          ([self class] == [RCTViewComponentView class] ||
           typeid(*propsRawPtr).hash_code() != typeid(const ViewProps).hash_code()),
      @"`RCTViewComponentView` subclasses (and `%@` particularly) must setup `_props`"
       " instance variable with a default value in the constructor.",
      NSStringFromClass([self class]));
#endif

  const auto &oldViewProps = static_cast<const ViewProps &>(*_props);
  const auto &newViewProps = static_cast<const ViewProps &>(*props);

  BOOL needsInvalidateLayer = NO;

  // `opacity`
  if (oldViewProps.opacity != newViewProps.opacity &&
      ![_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"opacity"]) {
    self.layer.opacity = (float)newViewProps.opacity;
    needsInvalidateLayer = YES;
  }

  if (oldViewProps.removeClippedSubviews != newViewProps.removeClippedSubviews) {
    _removeClippedSubviews = newViewProps.removeClippedSubviews;
    if (_removeClippedSubviews && self.currentContainerView.subviews.count > 0) {
      _reactSubviews = [NSMutableArray arrayWithArray:self.currentContainerView.subviews];
    }
  }

  // `backgroundColor`
  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    self.backgroundColor = RCTUIColorFromSharedColor(newViewProps.backgroundColor);
    needsInvalidateLayer = YES;
  }

  // `shadowColor`
  if (oldViewProps.shadowColor != newViewProps.shadowColor) {
    CGColorRef shadowColor = RCTCreateCGColorRefFromSharedColor(newViewProps.shadowColor);
    self.layer.shadowColor = shadowColor;
    CGColorRelease(shadowColor);
    needsInvalidateLayer = YES;
  }

  // `shadowOffset`
  if (oldViewProps.shadowOffset != newViewProps.shadowOffset) {
    self.layer.shadowOffset = RCTCGSizeFromSize(newViewProps.shadowOffset);
    needsInvalidateLayer = YES;
  }

  // `shadowOpacity`
  if (oldViewProps.shadowOpacity != newViewProps.shadowOpacity) {
    self.layer.shadowOpacity = (float)newViewProps.shadowOpacity;
    needsInvalidateLayer = YES;
  }

  // `shadowRadius`
  if (oldViewProps.shadowRadius != newViewProps.shadowRadius) {
    self.layer.shadowRadius = (CGFloat)newViewProps.shadowRadius;
    needsInvalidateLayer = YES;
  }

  // `backfaceVisibility`
  if (oldViewProps.backfaceVisibility != newViewProps.backfaceVisibility) {
    self.layer.doubleSided = newViewProps.backfaceVisibility == BackfaceVisibility::Visible;
  }

  // `cursor`
  if (oldViewProps.cursor != newViewProps.cursor) {
    needsInvalidateLayer = YES;
  }

  // `shouldRasterize`
  if (oldViewProps.shouldRasterize != newViewProps.shouldRasterize) {
    self.layer.shouldRasterize = newViewProps.shouldRasterize;
    self.layer.rasterizationScale = newViewProps.shouldRasterize ? self.traitCollection.displayScale : 1.0;
  }

  // `pointerEvents`
  if (oldViewProps.pointerEvents != newViewProps.pointerEvents) {
    self.userInteractionEnabled = newViewProps.pointerEvents != PointerEventsMode::None;
  }

  // `transform`
  if ((oldViewProps.transform != newViewProps.transform ||
       oldViewProps.transformOrigin != newViewProps.transformOrigin) &&
      ![_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"transform"]) {
    auto newTransform = newViewProps.resolveTransform(_layoutMetrics);
    CATransform3D caTransform = RCTCATransform3DFromTransformMatrix(newTransform);

    self.layer.transform = caTransform;
    // Enable edge antialiasing in rotation, skew, or perspective transforms
    self.layer.allowsEdgeAntialiasing = caTransform.m12 != 0.0f || caTransform.m21 != 0.0f || caTransform.m34 != 0.0f;
  }

  // `hitSlop`
  if (oldViewProps.hitSlop != newViewProps.hitSlop) {
    self.hitTestEdgeInsets = {
        -newViewProps.hitSlop.top,
        -newViewProps.hitSlop.left,
        -newViewProps.hitSlop.bottom,
        -newViewProps.hitSlop.right};
  }

  // `overflow`
  if (oldViewProps.getClipsContentToBounds() != newViewProps.getClipsContentToBounds()) {
    self.currentContainerView.clipsToBounds = newViewProps.getClipsContentToBounds();
    needsInvalidateLayer = YES;
  }

  // `border`
  if (oldViewProps.borderStyles != newViewProps.borderStyles || oldViewProps.borderRadii != newViewProps.borderRadii ||
      oldViewProps.borderColors != newViewProps.borderColors) {
    needsInvalidateLayer = YES;
  }

  // `nativeId`
  if (oldViewProps.nativeId != newViewProps.nativeId) {
    self.nativeId = RCTNSStringFromStringNilIfEmpty(newViewProps.nativeId);
  }

  // `accessible`
  if (oldViewProps.accessible != newViewProps.accessible) {
    self.accessibilityElement.isAccessibilityElement = newViewProps.accessible;
  }

  // `accessibilityLabel`
  if (oldViewProps.accessibilityLabel != newViewProps.accessibilityLabel) {
    self.accessibilityElement.accessibilityLabel = RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityLabel);
  }

  // `accessibilityLanguage`
  if (oldViewProps.accessibilityLanguage != newViewProps.accessibilityLanguage) {
    self.accessibilityElement.accessibilityLanguage =
        RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityLanguage);
  }

  // `accessibilityHint`
  if (oldViewProps.accessibilityHint != newViewProps.accessibilityHint) {
    self.accessibilityElement.accessibilityHint = RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityHint);
  }

  // `accessibilityViewIsModal`
  if (oldViewProps.accessibilityViewIsModal != newViewProps.accessibilityViewIsModal) {
    self.accessibilityElement.accessibilityViewIsModal = newViewProps.accessibilityViewIsModal;
  }

  // `accessibilityElementsHidden`
  if (oldViewProps.accessibilityElementsHidden != newViewProps.accessibilityElementsHidden) {
    self.accessibilityElement.accessibilityElementsHidden = newViewProps.accessibilityElementsHidden;
  }

#if !TARGET_OS_TV
  // `accessibilityShowsLargeContentViewer`
  if (oldViewProps.accessibilityShowsLargeContentViewer != newViewProps.accessibilityShowsLargeContentViewer) {
    if (@available(iOS 13.0, *)) {
      if (newViewProps.accessibilityShowsLargeContentViewer) {
        self.showsLargeContentViewer = YES;
        UILargeContentViewerInteraction *interaction = [[UILargeContentViewerInteraction alloc] init];
        [self addInteraction:interaction];
      } else {
        self.showsLargeContentViewer = NO;
      }
    }
  }

  // `accessibilityLargeContentTitle`
  if (oldViewProps.accessibilityLargeContentTitle != newViewProps.accessibilityLargeContentTitle) {
    if (@available(iOS 13.0, *)) {
      self.largeContentTitle = RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityLargeContentTitle);
    }
  }
#endif

  // `accessibilityTraits`
  if (oldViewProps.accessibilityTraits != newViewProps.accessibilityTraits) {
    self.accessibilityElement.accessibilityTraits =
        RCTUIAccessibilityTraitsFromAccessibilityTraits(newViewProps.accessibilityTraits);
  }

  // `accessibilityState`
  if (oldViewProps.accessibilityState != newViewProps.accessibilityState) {
    self.accessibilityTraits &= ~(UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected);
    const auto accessibilityState = newViewProps.accessibilityState.value_or(AccessibilityState{});
    if (accessibilityState.selected) {
      self.accessibilityTraits |= UIAccessibilityTraitSelected;
    }
    if (accessibilityState.disabled) {
      self.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    }
  }

  // `accessibilityIgnoresInvertColors`
  if (oldViewProps.accessibilityIgnoresInvertColors != newViewProps.accessibilityIgnoresInvertColors) {
    self.accessibilityIgnoresInvertColors = newViewProps.accessibilityIgnoresInvertColors;
  }

  // `accessibilityValue`
  if (oldViewProps.accessibilityValue != newViewProps.accessibilityValue) {
    if (newViewProps.accessibilityValue.text.has_value()) {
      self.accessibilityElement.accessibilityValue =
          RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityValue.text.value());
    } else if (
        newViewProps.accessibilityValue.now.has_value() && newViewProps.accessibilityValue.min.has_value() &&
        newViewProps.accessibilityValue.max.has_value()) {
      CGFloat val = (CGFloat)(newViewProps.accessibilityValue.now.value()) /
          (newViewProps.accessibilityValue.max.value() - newViewProps.accessibilityValue.min.value());
      self.accessibilityElement.accessibilityValue =
          [NSNumberFormatter localizedStringFromNumber:@(val) numberStyle:NSNumberFormatterPercentStyle];
      ;
    } else {
      self.accessibilityElement.accessibilityValue = nil;
    }
  }

  // `testId`
  if (oldViewProps.testId != newViewProps.testId) {
    SEL setAccessibilityIdentifierSelector = @selector(setAccessibilityIdentifier:);
    NSString *identifier = RCTNSStringFromString(newViewProps.testId);
    if ([self.accessibilityElement respondsToSelector:setAccessibilityIdentifierSelector]) {
      UIView *accessibilityView = (UIView *)self.accessibilityElement;
      accessibilityView.accessibilityIdentifier = identifier;
    } else {
      self.accessibilityIdentifier = identifier;
    }
  }

  // `filter`
  if (oldViewProps.filter != newViewProps.filter) {
    needsInvalidateLayer = YES;
  }

  // `mixBlendMode`
  if (oldViewProps.mixBlendMode != newViewProps.mixBlendMode) {
    switch (newViewProps.mixBlendMode) {
      case BlendMode::Multiply:
        self.layer.compositingFilter = @"multiplyBlendMode";
        break;
      case BlendMode::Screen:
        self.layer.compositingFilter = @"screenBlendMode";
        break;
      case BlendMode::Overlay:
        self.layer.compositingFilter = @"overlayBlendMode";
        break;
      case BlendMode::Darken:
        self.layer.compositingFilter = @"darkenBlendMode";
        break;
      case BlendMode::Lighten:
        self.layer.compositingFilter = @"lightenBlendMode";
        break;
      case BlendMode::ColorDodge:
        self.layer.compositingFilter = @"colorDodgeBlendMode";
        break;
      case BlendMode::ColorBurn:
        self.layer.compositingFilter = @"colorBurnBlendMode";
        break;
      case BlendMode::HardLight:
        self.layer.compositingFilter = @"hardLightBlendMode";
        break;
      case BlendMode::SoftLight:
        self.layer.compositingFilter = @"softLightBlendMode";
        break;
      case BlendMode::Difference:
        self.layer.compositingFilter = @"differenceBlendMode";
        break;
      case BlendMode::Exclusion:
        self.layer.compositingFilter = @"exclusionBlendMode";
        break;
      case BlendMode::Hue:
        self.layer.compositingFilter = @"hueBlendMode";
        break;
      case BlendMode::Saturation:
        self.layer.compositingFilter = @"saturationBlendMode";
        break;
      case BlendMode::Color:
        self.layer.compositingFilter = @"colorBlendMode";
        break;
      case BlendMode::Luminosity:
        self.layer.compositingFilter = @"luminosityBlendMode";
        break;
      case BlendMode::Normal:
        self.layer.compositingFilter = nil;
        break;
    }
  }

  // `linearGradient`
  if (oldViewProps.backgroundImage != newViewProps.backgroundImage) {
    needsInvalidateLayer = YES;
  }

  // `boxShadow`
  if (oldViewProps.boxShadow != newViewProps.boxShadow) {
    needsInvalidateLayer = YES;
  }

#if TARGET_OS_TV
  // `isTVSelectable`
  if (oldViewProps.isTVSelectable != newViewProps.isTVSelectable) {
    if (newViewProps.isTVSelectable && ![self isTVFocusGuide]) {
      self.tvRemoteSelectHandler = [[RCTTVRemoteSelectHandler alloc]initWithView:self];
    } else {
      self.tvRemoteSelectHandler = nil;
    }
  }
  // `tvParallaxProperties
  if (oldViewProps.tvParallaxProperties != newViewProps.tvParallaxProperties) {
    _tvParallaxProperties.enabled = newViewProps.tvParallaxProperties.enabled.has_value() ?
                                      newViewProps.tvParallaxProperties.enabled.value() :
                                      newViewProps.isTVSelectable;
    _tvParallaxProperties.shiftDistanceX = [self getFloat:newViewProps.tvParallaxProperties.shiftDistanceX orDefault:2.0];
    _tvParallaxProperties.shiftDistanceY = [self getFloat:newViewProps.tvParallaxProperties.shiftDistanceY orDefault:2.0];
    _tvParallaxProperties.tiltAngle = [self getFloat:newViewProps.tvParallaxProperties.tiltAngle orDefault:0.05];
    _tvParallaxProperties.magnification = [self getFloat:newViewProps.tvParallaxProperties.magnification orDefault:1.0];
    _tvParallaxProperties.pressMagnification = [self getFloat:newViewProps.tvParallaxProperties.pressMagnification orDefault:1.0];
    _tvParallaxProperties.pressDuration = [self getFloat:newViewProps.tvParallaxProperties.pressDuration orDefault:0.3];
    _tvParallaxProperties.pressDelay = [self getFloat:newViewProps.tvParallaxProperties.pressDelay orDefault:0.0];
  }
  // `hasTVPreferredFocus
  if (oldViewProps.hasTVPreferredFocus != newViewProps.hasTVPreferredFocus) {
    _hasTVPreferredFocus = newViewProps.hasTVPreferredFocus;
    if (_hasTVPreferredFocus) {
      [self requestFocusSelf];
    }
  }
  // `nextFocusUp`
  if (oldViewProps.nextFocusUp != newViewProps.nextFocusUp) {
    if (newViewProps.nextFocusUp.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusUp = [rootView viewWithTag:newViewProps.nextFocusUp.value()];
      [self enableDirectionalFocusGuides];
    } else {
      if (self.focusGuideUp != nil) {
        [[self containingRootView] removeLayoutGuide:self.focusGuideUp];
      }
      _nextFocusUp = nil;
    }
  }
  // `nextFocusDown`
  if (oldViewProps.nextFocusDown != newViewProps.nextFocusDown) {
    if (newViewProps.nextFocusDown.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusDown = [rootView viewWithTag:newViewProps.nextFocusDown.value()];
      [self enableDirectionalFocusGuides];
    } else {
      if (self.focusGuideDown != nil) {
        [[self containingRootView] removeLayoutGuide:self.focusGuideDown];
      }
      _nextFocusDown = nil;
    }
  }
  // `nextFocusLeft`
  if (oldViewProps.nextFocusLeft != newViewProps.nextFocusLeft) {
    if (newViewProps.nextFocusLeft.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusLeft = [rootView viewWithTag:newViewProps.nextFocusLeft.value()];
      [self enableDirectionalFocusGuides];
    } else {
      if (self.focusGuideLeft != nil) {
        [[self containingRootView] removeLayoutGuide:self.focusGuideLeft];
      }
      _nextFocusLeft = nil;
    }
  }
  // `nextFocusRight`
  if (oldViewProps.nextFocusRight != newViewProps.nextFocusRight) {
    if (newViewProps.nextFocusRight.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusRight = [rootView viewWithTag:newViewProps.nextFocusRight.value()];
      [self enableDirectionalFocusGuides];
    } else {
      if (self.focusGuideRight != nil) {
        [[self containingRootView] removeLayoutGuide:self.focusGuideRight];
      }
      _nextFocusRight = nil;
    }
  }
  
  // `autoFocus`
  if (oldViewProps.autoFocus != newViewProps.autoFocus) {
    _autoFocus = newViewProps.autoFocus;
    [self handleFocusGuide];
  }

  _trapFocusUp = newViewProps.trapFocusUp;
  _trapFocusDown = newViewProps.trapFocusDown;
  _trapFocusLeft = newViewProps.trapFocusLeft;
  _trapFocusRight = newViewProps.trapFocusRight;
#endif

  _needsInvalidateLayer = _needsInvalidateLayer || needsInvalidateLayer;

  _props = std::static_pointer_cast<const ViewProps>(props);
}

- (float)getFloat:(std::optional<float>)property orDefault:(float)defaultValue
{
  return property.has_value() ? (float)property.value() : defaultValue;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
  assert(std::dynamic_pointer_cast<const ViewEventEmitter>(eventEmitter));
  _eventEmitter = std::static_pointer_cast<const ViewEventEmitter>(eventEmitter);
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  // Using stored `_layoutMetrics` as `oldLayoutMetrics` here to avoid
  // re-applying individual sub-values which weren't changed.
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];

  _layoutMetrics = layoutMetrics;
  _needsInvalidateLayer = YES;

  _borderLayer.frame = self.layer.bounds;

  if (_contentView) {
    _contentView.frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
  }

  if (_containerView) {
    _containerView.frame = CGRectMake(0, 0, self.layer.bounds.size.width, self.layer.bounds.size.height);
  }

  if (_backgroundColorLayer) {
    _backgroundColorLayer.frame = CGRectMake(0, 0, self.layer.bounds.size.width, self.layer.bounds.size.height);
  }

  if ((_props->transformOrigin.isSet() || _props->transform.operations.size() > 0) &&
      layoutMetrics.frame.size != oldLayoutMetrics.frame.size) {
    auto newTransform = _props->resolveTransform(layoutMetrics);
    self.layer.transform = RCTCATransform3DFromTransformMatrix(newTransform);
  }
  
#if TARGET_OS_TV
  if (_hasTVPreferredFocus) {
    RCTSurfaceHostingProxyRootView *rootview = [self containingRootView];
    if (rootview != nil && rootview.reactPreferredFocusedView != self) {
      [self requestFocusSelf];
    }
  }

#endif

}

- (BOOL)isJSResponder
{
  return _isJSResponder;
}

- (void)setIsJSResponder:(BOOL)isJSResponder
{
  _isJSResponder = isJSResponder;
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  _useCustomContainerView = [self styleWouldClipOverflowInk];
  if (!_needsInvalidateLayer) {
    return;
  }

  _needsInvalidateLayer = NO;
  [self invalidateLayer];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  // If view was managed by animated, its props need to align with UIView's properties.
  const auto &props = static_cast<const ViewProps &>(*_props);
  if ([_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"transform"]) {
    self.layer.transform = RCTCATransform3DFromTransformMatrix(props.transform);
  }
  if ([_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"opacity"]) {
    self.layer.opacity = (float)props.opacity;
  }

#if TARGET_OS_TV
  [self removeFocusGuide];
#endif

  _propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = nil;
  _eventEmitter.reset();
  _isJSResponder = NO;
  _removeClippedSubviews = NO;
  _reactSubviews = [NSMutableArray new];
}

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(NSSet<NSString *> *_Nullable)props
{
  _propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = props;
}

- (NSSet<NSString *> *_Nullable)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN
{
  return _propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;
}

- (UIView *)betterHitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  // This is a classic textbook implementation of `hitTest:` with a couple of improvements:
  //   * It does not stop algorithm if some touch is outside the view
  //     which does not have `clipToBounds` enabled.
  //   * Taking `layer.zIndex` field into an account is not required because
  //     lists of `ShadowView`s are already sorted based on `zIndex` prop.

  if (!self.userInteractionEnabled || self.hidden || self.alpha < 0.01) {
    return nil;
  }

  BOOL isPointInside = [self pointInside:point withEvent:event];

  BOOL clipsToBounds = self.currentContainerView.clipsToBounds;

  clipsToBounds = clipsToBounds || _layoutMetrics.overflowInset == EdgeInsets{};

  if (clipsToBounds && !isPointInside) {
    return nil;
  }

  for (UIView *subview in [self.subviews reverseObjectEnumerator]) {
    UIView *hitView = [subview hitTest:[subview convertPoint:point fromView:self] withEvent:event];
    if (hitView) {
      return hitView;
    }
  }

  return isPointInside ? self : nil;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  switch (_props->pointerEvents) {
    case PointerEventsMode::Auto:
      return [self betterHitTest:point withEvent:event];
    case PointerEventsMode::None:
      return nil;
    case PointerEventsMode::BoxOnly:
      return [self pointInside:point withEvent:event] ? self : nil;
    case PointerEventsMode::BoxNone:
      UIView *view = [self betterHitTest:point withEvent:event];
      return view != self ? view : nil;
  }
}

static RCTCornerRadii RCTCornerRadiiFromBorderRadii(BorderRadii borderRadii)
{
  return RCTCornerRadii{
      .topLeftHorizontal = (CGFloat)borderRadii.topLeft.horizontal,
      .topLeftVertical = (CGFloat)borderRadii.topLeft.vertical,
      .topRightHorizontal = (CGFloat)borderRadii.topRight.horizontal,
      .topRightVertical = (CGFloat)borderRadii.topRight.vertical,
      .bottomLeftHorizontal = (CGFloat)borderRadii.bottomLeft.horizontal,
      .bottomLeftVertical = (CGFloat)borderRadii.bottomLeft.vertical,
      .bottomRightHorizontal = (CGFloat)borderRadii.bottomRight.horizontal,
      .bottomRightVertical = (CGFloat)borderRadii.bottomRight.vertical};
}

static RCTBorderColors RCTCreateRCTBorderColorsFromBorderColors(BorderColors borderColors)
{
  return RCTBorderColors{
      .top = RCTCreateCGColorRefFromSharedColor(borderColors.top),
      .left = RCTCreateCGColorRefFromSharedColor(borderColors.left),
      .bottom = RCTCreateCGColorRefFromSharedColor(borderColors.bottom),
      .right = RCTCreateCGColorRefFromSharedColor(borderColors.right)};
}

static void RCTReleaseRCTBorderColors(RCTBorderColors borderColors)
{
  CGColorRelease(borderColors.top);
  CGColorRelease(borderColors.left);
  CGColorRelease(borderColors.bottom);
  CGColorRelease(borderColors.right);
}

static CALayerCornerCurve CornerCurveFromBorderCurve(BorderCurve borderCurve)
{
  // The constants are available only starting from iOS 13
  // CALayerCornerCurve is a typealias on NSString *
  switch (borderCurve) {
    case BorderCurve::Continuous:
      return @"continuous"; // kCACornerCurveContinuous;
    case BorderCurve::Circular:
      return @"circular"; // kCACornerCurveCircular;
  }
}

static RCTBorderStyle RCTBorderStyleFromBorderStyle(BorderStyle borderStyle)
{
  switch (borderStyle) {
    case BorderStyle::Solid:
      return RCTBorderStyleSolid;
    case BorderStyle::Dotted:
      return RCTBorderStyleDotted;
    case BorderStyle::Dashed:
      return RCTBorderStyleDashed;
  }
}

- (BOOL)styleWouldClipOverflowInk
{
  const auto borderMetrics = _props->resolveBorderMetrics(_layoutMetrics);
  BOOL nonZeroBorderWidth = !(borderMetrics.borderWidths.isUniform() && borderMetrics.borderWidths.left == 0);
  BOOL clipToPaddingBox = ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
  return _props->getClipsContentToBounds() && (!_props->boxShadow.empty() || (clipToPaddingBox && nonZeroBorderWidth));
}

// This UIView is the UIView that holds all subviews. It is sometimes not self
// because we want to render "overflow ink" that extends beyond the bounds of
// the view and is not affected by clipping.
- (UIView *)currentContainerView
{
  if (_useCustomContainerView) {
    if (!_containerView) {
      _containerView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, self.frame.size.width, self.frame.size.height)];
      for (UIView *subview in self.subviews) {
        [_containerView addSubview:subview];
      }
      _containerView.clipsToBounds = self.clipsToBounds;
      self.clipsToBounds = NO;
      _containerView.layer.mask = self.layer.mask;
      self.layer.mask = nil;
      [self addSubview:_containerView];
    }

    return _containerView;
  } else {
    if (_containerView) {
      for (UIView *subview in _containerView.subviews) {
        [self addSubview:subview];
      }
      self.clipsToBounds = _containerView.clipsToBounds;
      self.layer.mask = _containerView.layer.mask;
      [_containerView removeFromSuperview];
      _containerView = nil;
    }

    return self;
  }
}

- (void)invalidateLayer
{
  CALayer *layer = self.layer;

  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  const auto borderMetrics = _props->resolveBorderMetrics(_layoutMetrics);

  // Stage 1. Shadow Path
  BOOL const layerHasShadow = layer.shadowOpacity > 0 && CGColorGetAlpha(layer.shadowColor) > 0;
  if (layerHasShadow) {
    if (CGColorGetAlpha(_backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border.
      const RCTCornerInsets cornerInsets =
          RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero);
      CGPathRef shadowPath = RCTPathCreateWithRoundedRect(self.bounds, cornerInsets, nil);
      layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);
    } else {
      // Can't accurately calculate box shadow, so fall back to pixel-based shadow.
      layer.shadowPath = nil;
    }
  } else {
    layer.shadowPath = nil;
  }

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000 /* __IPHONE_17_0 */ && !TARGET_OS_TV
  // Stage 1.5. Cursor / Hover Effects
  if (@available(iOS 17.0, *)) {
    UIHoverStyle *hoverStyle = nil;
    if (_props->cursor == Cursor::Pointer) {
      const RCTCornerInsets cornerInsets =
          RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero);
#if TARGET_OS_IOS
      // Due to an Apple bug, it seems on iOS, UIShapes made with `[UIShape shapeWithBezierPath:]`
      // evaluate their shape on the superviews' coordinate space. This leads to the hover shape
      // rendering incorrectly on iOS, iOS apps in compatibility mode on visionOS, but not on visionOS.
      // To work around this, for iOS, we can calculate the border path based on `view.frame` (the
      // superview's coordinate space) instead of view.bounds.
      CGPathRef borderPath = RCTPathCreateWithRoundedRect(self.frame, cornerInsets, NULL);
#else // TARGET_OS_VISION
      CGPathRef borderPath = RCTPathCreateWithRoundedRect(self.bounds, cornerInsets, NULL);
#endif
      UIBezierPath *bezierPath = [UIBezierPath bezierPathWithCGPath:borderPath];
      CGPathRelease(borderPath);
      UIShape *shape = [UIShape shapeWithBezierPath:bezierPath];

      hoverStyle = [UIHoverStyle styleWithEffect:[UIHoverAutomaticEffect effect] shape:shape];
    }
    [self setHoverStyle:hoverStyle];
  }
#endif
  const bool useCoreAnimationBorderRendering =
      borderMetrics.borderColors.isUniform() && borderMetrics.borderWidths.isUniform() &&
      borderMetrics.borderStyles.isUniform() && borderMetrics.borderRadii.isUniform() &&
      (
          // iOS draws borders in front of the content whereas CSS draws them behind
          // the content. For this reason, only use iOS border drawing when clipping
          // or when the border is hidden.
          borderMetrics.borderWidths.left == 0 || self.currentContainerView.clipsToBounds ||
          (colorComponentsFromColor(borderMetrics.borderColors.left).alpha == 0 &&
           (*borderMetrics.borderColors.left).getUIColor() != nullptr));

  // background color
  CGColorRef backgroundColor = [_backgroundColor resolvedColorWithTraitCollection:self.traitCollection].CGColor;
  // The reason we sometimes do not set self.layer's backgroundColor is because
  // we want to support non-uniform border radii, which apple does not natively
  // support. To get this behavior we need to create a CGPath in the shape that
  // we want. If we mask self.layer to this path, we would be clipping subviews
  // which we may not want to do. The generalized solution in this case is just
  // create a new layer
  if (useCoreAnimationBorderRendering) {
    [_backgroundColorLayer removeFromSuperlayer];
    _backgroundColorLayer = nil;
    layer.backgroundColor = backgroundColor;
  } else {
    layer.backgroundColor = nil;
    if (!_backgroundColorLayer) {
      _backgroundColorLayer = [CALayer layer];
      _backgroundColorLayer.frame = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
      _backgroundColorLayer.zPosition = BACKGROUND_COLOR_ZPOSITION;
      [self.layer addSublayer:_backgroundColorLayer];
    }

    _backgroundColorLayer.backgroundColor = backgroundColor;
    if (borderMetrics.borderRadii.isUniform()) {
      _backgroundColorLayer.mask = nil;
      _backgroundColorLayer.cornerRadius = borderMetrics.borderRadii.topLeft.horizontal;
      _backgroundColorLayer.cornerCurve = CornerCurveFromBorderCurve(borderMetrics.borderCurves.topLeft);
    } else {
      CAShapeLayer *maskLayer =
          [self createMaskLayer:self.bounds
                   cornerInsets:RCTGetCornerInsets(
                                    RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero)];
      _backgroundColorLayer.mask = maskLayer;
      _backgroundColorLayer.cornerRadius = 0;
    }

    [_backgroundColorLayer removeAllAnimations];
  }

  // borders
  if (useCoreAnimationBorderRendering) {
    [_borderLayer removeFromSuperlayer];
    _borderLayer = nil;

    layer.borderWidth = (CGFloat)borderMetrics.borderWidths.left;
    CGColorRef borderColor = RCTCreateCGColorRefFromSharedColor(borderMetrics.borderColors.left);
    layer.borderColor = borderColor;
    CGColorRelease(borderColor);
    layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft.horizontal;
    layer.cornerCurve = CornerCurveFromBorderCurve(borderMetrics.borderCurves.topLeft);
  } else {
    if (!_borderLayer) {
      CALayer *borderLayer = [CALayer new];
      borderLayer.zPosition = BACKGROUND_COLOR_ZPOSITION + 1;
      borderLayer.frame = layer.bounds;
      borderLayer.magnificationFilter = kCAFilterNearest;
      [layer addSublayer:borderLayer];
      _borderLayer = borderLayer;
    }

    layer.borderWidth = 0;
    layer.borderColor = nil;
    layer.cornerRadius = 0;

    RCTBorderColors borderColors = RCTCreateRCTBorderColorsFromBorderColors(borderMetrics.borderColors);
    UIImage *image = RCTGetBorderImage(
        RCTBorderStyleFromBorderStyle(borderMetrics.borderStyles.left),
        layer.bounds.size,
        RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii),
        RCTUIEdgeInsetsFromEdgeInsets(borderMetrics.borderWidths),
        borderColors,
        [UIColor clearColor].CGColor,
        NO);

    RCTReleaseRCTBorderColors(borderColors);

    if (image == nil) {
      _borderLayer.contents = nil;
    } else {
      CGSize imageSize = image.size;
      UIEdgeInsets imageCapInsets = image.capInsets;
      CGRect contentsCenter = CGRect{
          CGPoint{imageCapInsets.left / imageSize.width, imageCapInsets.top / imageSize.height},
          CGSize{(CGFloat)1.0 / imageSize.width, (CGFloat)1.0 / imageSize.height}};

      _borderLayer.contents = (id)image.CGImage;
      _borderLayer.contentsScale = image.scale;

      BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
      if (isResizable) {
        _borderLayer.contentsCenter = contentsCenter;
      } else {
        _borderLayer.contentsCenter = CGRect{CGPoint{0.0, 0.0}, CGSize{1.0, 1.0}};
      }
    }

    // If mutations are applied inside of Animation block, it may cause _borderLayer to be animated.
    // To stop that, imperatively remove all animations from _borderLayer.
    [_borderLayer removeAllAnimations];
  }

  // filter
  [_filterLayer removeFromSuperlayer];
  _filterLayer = nil;
  self.layer.opacity = (float)_props->opacity;
  if (!_props->filter.empty()) {
    float multiplicativeBrightness = 1;
    for (const auto &primitive : _props->filter) {
      if (std::holds_alternative<Float>(primitive.parameters)) {
        if (primitive.type == FilterType::Brightness) {
          multiplicativeBrightness *= std::get<Float>(primitive.parameters);
        } else if (primitive.type == FilterType::Opacity) {
          self.layer.opacity *= std::get<Float>(primitive.parameters);
        }
      }
    }

    _filterLayer = [CALayer layer];
    _filterLayer.frame = CGRectMake(0, 0, layer.frame.size.width, layer.frame.size.height);
    _filterLayer.compositingFilter = @"multiplyBlendMode";
    _filterLayer.backgroundColor = [UIColor colorWithRed:multiplicativeBrightness
                                                   green:multiplicativeBrightness
                                                    blue:multiplicativeBrightness
                                                   alpha:self.layer.opacity]
                                       .CGColor;
    if (borderMetrics.borderRadii.isUniform()) {
      _filterLayer.cornerRadius = borderMetrics.borderRadii.topLeft.horizontal;
    } else {
      RCTCornerInsets cornerInsets =
          RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero);
      _filterLayer.mask = [self createMaskLayer:self.bounds cornerInsets:cornerInsets];
    }
    // So that this layer is always above any potential sublayers this view may
    // add
    _filterLayer.zPosition = CGFLOAT_MAX;
    [self.layer addSublayer:_filterLayer];
  }

  // background image
  [self clearExistingGradientLayers];
  if (!_props->backgroundImage.empty()) {
    for (const auto &gradient : _props->backgroundImage) {
      CAGradientLayer *gradientLayer = [CAGradientLayer layer];
      NSMutableArray *colors = [NSMutableArray array];
      NSMutableArray *locations = [NSMutableArray array];
      for (const auto &colorStop : gradient.colorStops) {
        if (colorStop.position.has_value()) {
          auto location = @(colorStop.position.value());
          UIColor *color = RCTUIColorFromSharedColor(colorStop.color);
          [colors addObject:(id)color.CGColor];
          [locations addObject:location];
        }
      }
      gradientLayer.startPoint = CGPointMake(gradient.startX, gradient.startY);
      gradientLayer.endPoint = CGPointMake(gradient.endX, gradient.endY);

      if (locations.count > 0) {
        gradientLayer.locations = locations;
      }
      gradientLayer.colors = colors;
      gradientLayer.frame = layer.bounds;

      // border styling to work with gradient layers
      if (useCoreAnimationBorderRendering) {
        gradientLayer.borderWidth = layer.borderWidth;
        gradientLayer.borderColor = layer.borderColor;
        gradientLayer.cornerRadius = layer.cornerRadius;
        gradientLayer.cornerCurve = layer.cornerCurve;
      } else {
        CAShapeLayer *maskLayer = [CAShapeLayer layer];
        CGPathRef path = RCTPathCreateWithRoundedRect(
            self.bounds,
            RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero),
            nil);
        maskLayer.path = path;
        CGPathRelease(path);
        gradientLayer.mask = maskLayer;
      }

      gradientLayer.zPosition = BACKGROUND_COLOR_ZPOSITION;

      [self.layer addSublayer:gradientLayer];
      [_gradientLayers addObject:gradientLayer];
    }
  }

  // box shadow
  [_boxShadowLayer removeFromSuperlayer];
  _boxShadowLayer = nil;
  if (!_props->boxShadow.empty()) {
    _boxShadowLayer = [CALayer layer];
    [self.layer addSublayer:_boxShadowLayer];
    _boxShadowLayer.zPosition = _borderLayer.zPosition;
    _boxShadowLayer.frame = RCTGetBoundingRect(_props->boxShadow, self.layer.frame.size);

    UIImage *boxShadowImage = RCTGetBoxShadowImage(
        _props->boxShadow,
        RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii),
        RCTUIEdgeInsetsFromEdgeInsets(borderMetrics.borderWidths),
        layer);

    _boxShadowLayer.contents = (id)boxShadowImage.CGImage;
  }

  // clipping
  if (self.currentContainerView.clipsToBounds) {
    BOOL clipToPaddingBox = ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
    if (clipToPaddingBox) {
      CALayer *maskLayer = [self createMaskLayer:RCTCGRectFromRect(_layoutMetrics.getPaddingFrame())
                                    cornerInsets:RCTGetCornerInsets(
                                                     RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii),
                                                     RCTUIEdgeInsetsFromEdgeInsets(borderMetrics.borderWidths))];
      self.currentContainerView.layer.mask = maskLayer;
    } else {
      if (borderMetrics.borderRadii.isUniform()) {
        self.currentContainerView.layer.cornerRadius = borderMetrics.borderRadii.topLeft.horizontal;
      } else {
        CALayer *maskLayer =
            [self createMaskLayer:self.bounds
                     cornerInsets:RCTGetCornerInsets(
                                      RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero)];
        self.currentContainerView.layer.mask = maskLayer;
      }

      for (UIView *subview in self.currentContainerView.subviews) {
        if ([subview isKindOfClass:[UIImageView class]]) {
          RCTCornerInsets cornerInsets = RCTGetCornerInsets(
              RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii),
              RCTUIEdgeInsetsFromEdgeInsets(borderMetrics.borderWidths));

          // If the subview is an image view, we have to apply the mask directly to the image view's layer,
          // otherwise the image might overflow with the border radius.
          subview.layer.mask = [self createMaskLayer:subview.bounds cornerInsets:cornerInsets];
        }
      }
    }
  } else {
    self.currentContainerView.layer.mask = nil;
  }
}

- (CAShapeLayer *)createMaskLayer:(CGRect)bounds cornerInsets:(RCTCornerInsets)cornerInsets
{
  CGPathRef path = RCTPathCreateWithRoundedRect(bounds, cornerInsets, nil);
  CAShapeLayer *maskLayer = [CAShapeLayer layer];
  maskLayer.path = path;
  CGPathRelease(path);
  return maskLayer;
}

- (void)clearExistingGradientLayers
{
  if (_gradientLayers == nil) {
    _gradientLayers = [NSMutableArray new];
    return;
  }
  for (CAGradientLayer *gradientLayer in _gradientLayers) {
    [gradientLayer removeFromSuperlayer];
  }
  [_gradientLayers removeAllObjects];
}

#pragma mark - Accessibility

- (NSObject *)accessibilityElement
{
  return self;
}

static NSString *RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *result = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = subview.accessibilityLabel;
    if (!label) {
      label = RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (result.length > 0) {
        [result appendString:@" "];
      }
      [result appendString:label];
    }
  }
  return result;
}

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }

  return RCTRecursiveAccessibilityLabel(self.currentContainerView);
}

- (BOOL)isAccessibilityElement
{
  if (self.contentView != nil) {
    return self.contentView.isAccessibilityElement;
  }

  return [super isAccessibilityElement];
}

- (NSString *)accessibilityValue
{
  const auto &props = static_cast<const ViewProps &>(*_props);
  const auto accessibilityState = props.accessibilityState.value_or(AccessibilityState{});

  // Handle Switch.
  if ((self.accessibilityTraits & AccessibilityTraitSwitch) == AccessibilityTraitSwitch) {
    if (accessibilityState.checked == AccessibilityState::Checked) {
      return @"1";
    } else if (accessibilityState.checked == AccessibilityState::Unchecked) {
      return @"0";
    }
  }

  NSMutableArray *valueComponents = [NSMutableArray new];
  NSString *roleString = (props.role != Role::None) ? [NSString stringWithUTF8String:toString(props.role).c_str()]
                                                    : [NSString stringWithUTF8String:props.accessibilityRole.c_str()];

  // In iOS, checkbox and radio buttons aren't recognized as traits. However,
  // because our apps use checkbox and radio buttons often, we should announce
  // these to screenreader users.  (They should already be familiar with them
  // from using web).
  if ([roleString isEqualToString:@"checkbox"]) {
    [valueComponents addObject:RCTLocalizedString("checkbox", "checkable interactive control")];
  }

  if ([roleString isEqualToString:@"radio"]) {
    [valueComponents
        addObject:
            RCTLocalizedString(
                "radio button",
                "a checkable input that when associated with other radio buttons, only one of which can be checked at a time")];
  }

  // Handle states which haven't already been handled.
  if (accessibilityState.checked == AccessibilityState::Checked) {
    [valueComponents
        addObject:RCTLocalizedString("checked", "a checkbox, radio button, or other widget which is checked")];
  }
  if (accessibilityState.checked == AccessibilityState::Unchecked) {
    [valueComponents
        addObject:RCTLocalizedString("unchecked", "a checkbox, radio button, or other widget which is unchecked")];
  }
  if (accessibilityState.checked == AccessibilityState::Mixed) {
    [valueComponents
        addObject:RCTLocalizedString(
                      "mixed", "a checkbox, radio button, or other widget which is both checked and unchecked")];
  }
  if (accessibilityState.expanded.value_or(false)) {
    [valueComponents
        addObject:RCTLocalizedString("expanded", "a menu, dialog, accordian panel, or other widget which is expanded")];
  }

  if (accessibilityState.busy) {
    [valueComponents addObject:RCTLocalizedString("busy", "an element currently being updated or modified")];
  }

  // Using super.accessibilityValue:
  // 1. to access the value that is set to accessibilityValue in updateProps
  // 2. can't access from self.accessibilityElement because it resolves to self
  if (super.accessibilityValue) {
    [valueComponents addObject:super.accessibilityValue];
  }

  if (valueComponents.count > 0) {
    return [valueComponents componentsJoinedByString:@", "];
  }

  return nil;
}

#pragma mark - Accessibility Events

- (BOOL)shouldGroupAccessibilityChildren
{
  return YES;
}

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  const auto &accessibilityActions = _props->accessibilityActions;

  if (accessibilityActions.empty()) {
    return nil;
  }

  NSMutableArray<UIAccessibilityCustomAction *> *customActions = [NSMutableArray array];
  for (const auto &accessibilityAction : accessibilityActions) {
    [customActions
        addObject:[[UIAccessibilityCustomAction alloc] initWithName:RCTNSStringFromString(accessibilityAction.name)
                                                             target:self
                                                           selector:@selector(didActivateAccessibilityCustomAction:)]];
  }

  return [customActions copy];
}

- (BOOL)accessibilityActivate
{
  if (_eventEmitter && _props->onAccessibilityTap) {
    _eventEmitter->onAccessibilityTap();
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if (_eventEmitter && _props->onAccessibilityMagicTap) {
    _eventEmitter->onAccessibilityMagicTap();
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformEscape
{
  if (_eventEmitter && _props->onAccessibilityEscape) {
    _eventEmitter->onAccessibilityEscape();
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (_eventEmitter && _props->onAccessibilityAction) {
    _eventEmitter->onAccessibilityAction(RCTStringFromNSString(action.name));
    return YES;
  } else {
    return NO;
  }
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  return _eventEmitter;
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  return RCTNSStringFromString([[self class] componentDescriptorProvider].name);
}

@end

#ifdef __cplusplus
extern "C" {
#endif

// Can't the import generated Plugin.h because plugins are not in this BUCK target
Class<RCTComponentViewProtocol> RCTViewCls(void);

#ifdef __cplusplus
}
#endif

Class<RCTComponentViewProtocol> RCTViewCls(void)
{
  return RCTViewComponentView.class;
}
