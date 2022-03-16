/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"

#import <CoreGraphics/CoreGraphics.h>
#import <objc/runtime.h>

#import <React/RCTAssert.h>
#import <React/RCTBorderDrawing.h>
#import <React/RCTConversions.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>

#import <React/RCTRootComponentView.h>

#import <react/renderer/components/view/ViewComponentDescriptor.h>
#import <react/renderer/components/view/ViewEventEmitter.h>
#import <react/renderer/components/view/ViewProps.h>

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

@implementation RCTViewComponentView {
  UIColor *_backgroundColor;
  CALayer *_borderLayer;
  BOOL _needsInvalidateLayer;
  BOOL _isJSResponder;
  BOOL _removeClippedSubviews;
  NSMutableArray<UIView *> *_reactSubviews;
  BOOL _motionEffectsAdded;
    UITapGestureRecognizer *_selectRecognizer;
  NSSet<NSString *> *_Nullable _propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;
  ParallaxProperties _tvParallaxProperties;
  BOOL _hasTVPreferredFocus;
  UIView *_nextFocusUp;
  UIView *_nextFocusDown;
  UIView *_nextFocusLeft;
  UIView *_nextFocusRight;
  UIView *_nextFocusActiveTarget;
}

@synthesize removeClippedSubviews = _removeClippedSubviews;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<ViewProps const>();
    _props = defaultProps;
    _reactSubviews = [NSMutableArray new];
#if TARGET_OS_TV
    _tvParallaxProperties.enabled = NO;
    _tvParallaxProperties.shiftDistanceX = 0.0f;
    _tvParallaxProperties.shiftDistanceY = 0.0f;
    _tvParallaxProperties.tiltAngle = 0.0f;
    _tvParallaxProperties.magnification = 0.0f;
    _tvParallaxProperties.pressMagnification = 0.0f;
    _tvParallaxProperties.pressDuration = 0.0f;
    _tvParallaxProperties.pressDelay = 0.0f;
    self.focusGuide = [UIFocusGuide new];
    [self addLayoutGuide:self.focusGuide];
#else
    self.multipleTouchEnabled = YES;
#endif
  }
  return self;
}

- (facebook::react::SharedProps)props
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
    [self addSubview:_contentView];
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

#if TARGET_OS_TV

#pragma mark - Apple TV methods

- (RCTRootComponentView *)containingRootView
{
  UIView *rootview = self;
  if ([rootview class] == [RCTRootComponentView class]) {
    return (RCTRootComponentView *)rootview;
  }
  do {
    rootview = [rootview superview];
  } while (([rootview class] != [RCTRootComponentView class]) && rootview != nil);
  return (RCTRootComponentView *)rootview;
}

- (void)addFocusDestinations:(NSArray*)destinations {
  
  self.focusGuide.preferredFocusEnvironments = destinations;
}

- (void)sendFocusNotification:(__unused UIFocusUpdateContext *)context
{
    [self sendNotificationWithEventType:@"focus"];
}

- (void)sendBlurNotification:(__unused UIFocusUpdateContext *)context
{
    [self sendNotificationWithEventType:@"blur"];
}

- (void)sendSelectNotification:(UIGestureRecognizer *)recognizer
{
    [self sendNotificationWithEventType:@"select"];
}

- (void)sendNotificationWithEventType:(NSString * __nonnull)eventType
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTTVNavigationEventNotification"
                                                      object:@{
                                                          @"eventType":eventType,
                                                          @"tag":@([self tag]),
                                                          @"target":@([self tag])
                                                      }];
}

- (void)handleSelect:(__unused UIGestureRecognizer *)r
{
  if (_tvParallaxProperties.enabled == YES) {
    float magnification = _tvParallaxProperties.magnification;
    float pressMagnification = _tvParallaxProperties.pressMagnification;

    // Duration of press animation
    float pressDuration = _tvParallaxProperties.pressDuration;

    // Delay of press animation
    float pressDelay = _tvParallaxProperties.pressDelay;

    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:pressDelay]];

    [UIView animateWithDuration:(pressDuration/2)
                     animations:^{
      self.transform = CGAffineTransformMakeScale(pressMagnification, pressMagnification);
    }
                     completion:^(__unused BOOL finished1){
      [UIView animateWithDuration:(pressDuration/2)
                       animations:^{
        self.transform = CGAffineTransformMakeScale(magnification, magnification);
      }
                       completion:^(__unused BOOL finished2) {
        [self sendSelectNotification:r];
      }];
    }];

  } else {
    [self sendSelectNotification:r];
  }
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
  self.motionEffects = @[ xShift, yShift, xTilt, yTilt ];

  float magnification = _tvParallaxProperties.magnification;

  [UIView animateWithDuration:0.2 animations:^{
    self.transform = CGAffineTransformScale(self.transform, magnification, magnification);
  }];

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
    if (enabled && magnification) {
      self.transform = CGAffineTransformScale(self.transform, 1.0/magnification, 1.0/magnification);
    }
  }];

  for (UIMotionEffect *effect in [self.motionEffects copy]){
    [self removeMotionEffect:effect];
  }

  _motionEffectsAdded = NO;
}


- (BOOL)isUserInteractionEnabled
{
    return YES;
}

- (BOOL)canBecomeFocused
{
  return _props->isTVSelectable;
}

- (NSArray<id<UIFocusEnvironment>> *)preferredFocusEnvironments {
  if (_nextFocusActiveTarget == nil) return [super preferredFocusEnvironments];
  UIView * nextFocusActiveTarget = _nextFocusActiveTarget;
  _nextFocusActiveTarget = nil;
  NSArray<id<UIFocusEnvironment>> * focusEnvironment = @[nextFocusActiveTarget];
  return focusEnvironment;
}

- (BOOL) shouldUpdateFocusInContext:(UIFocusUpdateContext *)context {
  if (self.isFocused) {
    if (_nextFocusUp != nil && context.focusHeading == UIFocusHeadingUp) {
      self->_nextFocusActiveTarget = _nextFocusUp;
      [self setNeedsFocusUpdate];
      return false;
    }
    if (_nextFocusDown != nil && context.focusHeading == UIFocusHeadingDown) {
      self->_nextFocusActiveTarget = _nextFocusDown;
      [self setNeedsFocusUpdate];
      return false;
    }
    if (_nextFocusLeft != nil && context.focusHeading == UIFocusHeadingLeft) {
      self->_nextFocusActiveTarget = _nextFocusLeft;
      [self setNeedsFocusUpdate];
      return false;
    }
    if (_nextFocusRight != nil && context.focusHeading == UIFocusHeadingRight) {
      self->_nextFocusActiveTarget = _nextFocusRight;
      [self setNeedsFocusUpdate];
      return false;
    }
    self->_nextFocusActiveTarget = nil;
    return true;
  }
  self->_nextFocusActiveTarget = nil;
  return true;
}

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
    if (context.previouslyFocusedView == context.nextFocusedView) {
      return;
    }
    if (context.nextFocusedView == self && self.isUserInteractionEnabled ) {
      [self becomeFirstResponder];
      [coordinator addCoordinatedAnimations:^(void){
          [self addParallaxMotionEffects];
          [self sendFocusNotification:context];
      } completion:^(void){}];
    } else {
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
    RCTRootComponentView *rootView = [self containingRootView];
    for (NSNumber *tag in destinationTags) {
      UIView *view = [rootView viewWithTag:[tag intValue]];
      if (view != nil) {
        [destinations addObject:view];
      }
    }
    [self addFocusDestinations:destinations];
    return;
#endif
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
    [self insertSubview:childComponentView atIndex:index];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (_removeClippedSubviews) {
    [_reactSubviews removeObjectAtIndex:index];
  } else {
    RCTAssert(
        childComponentView.superview == self,
        @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
        self,
        childComponentView,
        @(index));
    RCTAssert(
        (self.subviews.count > index) && [self.subviews objectAtIndex:index] == childComponentView,
        @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
        self,
        childComponentView,
        @(index),
        @([self.subviews indexOfObject:childComponentView]),
        @([[self.subviews objectAtIndex:index] tag]));
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
      [self addSubview:view];
      // View is visible, update clipped subviews
      [view updateClippedSubviewsWithClipRect:clipRect relativeToView:self];
    } else if (view.superview) {
      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  RCTAssert(props, @"`props` must not be `null`.");

#ifndef NS_BLOCK_ASSERTIONS
  auto propsRawPtr = _props.get();
  RCTAssert(
      propsRawPtr &&
          ([self class] == [RCTViewComponentView class] ||
           typeid(*propsRawPtr).hash_code() != typeid(ViewProps const).hash_code()),
      @"`RCTViewComponentView` subclasses (and `%@` particularly) must setup `_props`"
       " instance variable with a default value in the constructor.",
      NSStringFromClass([self class]));
#endif

  auto const &oldViewProps = *std::static_pointer_cast<ViewProps const>(_props);
  auto const &newViewProps = *std::static_pointer_cast<ViewProps const>(props);

  BOOL needsInvalidateLayer = NO;

  // `opacity`
  if (oldViewProps.opacity != newViewProps.opacity &&
      ![_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"opacity"]) {
    self.layer.opacity = (float)newViewProps.opacity;
    needsInvalidateLayer = YES;
  }

  if (oldViewProps.removeClippedSubviews != newViewProps.removeClippedSubviews) {
    _removeClippedSubviews = newViewProps.removeClippedSubviews;
    if (_removeClippedSubviews && self.subviews.count > 0) {
      _reactSubviews = [NSMutableArray arrayWithArray:self.subviews];
    }
  }

  // `backgroundColor`
  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    self.backgroundColor = RCTUIColorFromSharedColor(newViewProps.backgroundColor);
    needsInvalidateLayer = YES;
  }

  // `foregroundColor`
  if (oldViewProps.foregroundColor != newViewProps.foregroundColor) {
    self.foregroundColor = RCTUIColorFromSharedColor(newViewProps.foregroundColor);
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

  // `shouldRasterize`
  if (oldViewProps.shouldRasterize != newViewProps.shouldRasterize) {
    self.layer.shouldRasterize = newViewProps.shouldRasterize;
    self.layer.rasterizationScale = newViewProps.shouldRasterize ? [UIScreen mainScreen].scale : 1.0;
  }

  // `pointerEvents`
  if (oldViewProps.pointerEvents != newViewProps.pointerEvents) {
    self.userInteractionEnabled = newViewProps.pointerEvents != PointerEventsMode::None;
  }

  // `transform`
  if (oldViewProps.transform != newViewProps.transform &&
      ![_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"transform"]) {
    self.layer.transform = RCTCATransform3DFromTransformMatrix(newViewProps.transform);
    self.layer.allowsEdgeAntialiasing = newViewProps.transform != Transform::Identity();
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
    self.clipsToBounds = newViewProps.getClipsContentToBounds();
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

  // `accessibilityTraits`
  if (oldViewProps.accessibilityTraits != newViewProps.accessibilityTraits) {
    self.accessibilityElement.accessibilityTraits =
        RCTUIAccessibilityTraitsFromAccessibilityTraits(newViewProps.accessibilityTraits);
  }

  // `accessibilityState`
  if (oldViewProps.accessibilityState != newViewProps.accessibilityState) {
    self.accessibilityTraits &= ~(UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected);
    if (newViewProps.accessibilityState.selected) {
      self.accessibilityTraits |= UIAccessibilityTraitSelected;
    }
    if (newViewProps.accessibilityState.disabled) {
      self.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    }
  }

  // `accessibilityIgnoresInvertColors`
  if (oldViewProps.accessibilityIgnoresInvertColors != newViewProps.accessibilityIgnoresInvertColors) {
    self.accessibilityIgnoresInvertColors = newViewProps.accessibilityIgnoresInvertColors;
  }

  // `accessibilityValue`
  if (oldViewProps.accessibilityValue != newViewProps.accessibilityValue) {
    if (newViewProps.accessibilityValue.text.hasValue()) {
      self.accessibilityElement.accessibilityValue =
          RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityValue.text.value());
    } else if (
        newViewProps.accessibilityValue.now.hasValue() && newViewProps.accessibilityValue.min.hasValue() &&
        newViewProps.accessibilityValue.max.hasValue()) {
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
    self.accessibilityIdentifier = RCTNSStringFromString(newViewProps.testId);
  }

#if TARGET_OS_TV
  // `isTVSelectable`
  if (oldViewProps.isTVSelectable != newViewProps.isTVSelectable) {
    if (newViewProps.isTVSelectable) {
      UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self
                                                                                   action:@selector(handleSelect:)];
      recognizer.allowedPressTypes = @[ @(UIPressTypeSelect) ];
      _selectRecognizer = recognizer;
      [self addGestureRecognizer:_selectRecognizer];
    } else {
      if (_selectRecognizer) {
        [self removeGestureRecognizer:_selectRecognizer];
      }
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
  }
  // `nextFocusUp`
  if (oldViewProps.nextFocusUp != newViewProps.nextFocusUp) {
    if (newViewProps.nextFocusUp.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusUp = [rootView viewWithTag:newViewProps.nextFocusUp.value()];
    } else {
      _nextFocusUp = nil;
    }
  }
  // `nextFocusDown`
  if (oldViewProps.nextFocusDown != newViewProps.nextFocusDown) {
    if (newViewProps.nextFocusDown.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusDown = [rootView viewWithTag:newViewProps.nextFocusDown.value()];
    } else {
      _nextFocusDown = nil;
    }
  }
  // `nextFocusLeft`
  if (oldViewProps.nextFocusLeft != newViewProps.nextFocusLeft) {
    if (newViewProps.nextFocusLeft.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusLeft = [rootView viewWithTag:newViewProps.nextFocusLeft.value()];
    } else {
      _nextFocusLeft = nil;
    }
  }
  // `nextFocusRight`
  if (oldViewProps.nextFocusRight != newViewProps.nextFocusRight) {
    if (newViewProps.nextFocusRight.has_value()) {
      UIView *rootView = [self containingRootView];
      _nextFocusRight = [rootView viewWithTag:newViewProps.nextFocusRight.value()];
    } else {
      _nextFocusRight = nil;
    }
  }
#endif


  _needsInvalidateLayer = _needsInvalidateLayer || needsInvalidateLayer;

  _props = std::static_pointer_cast<ViewProps const>(props);
}

- (float)getFloat:(butter::optional<float>)property orDefault:(float)defaultValue
{
  return property.has_value() ? (float)property.value() : defaultValue;
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter
{
  assert(std::dynamic_pointer_cast<ViewEventEmitter const>(eventEmitter));
  _eventEmitter = std::static_pointer_cast<ViewEventEmitter const>(eventEmitter);
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  // Using stored `_layoutMetrics` as `oldLayoutMetrics` here to avoid
  // re-applying individual sub-values which weren't changed.
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];

  _layoutMetrics = layoutMetrics;
  _needsInvalidateLayer = YES;

  if (_borderLayer) {
    _borderLayer.frame = self.layer.bounds;
  }

  if (_contentView) {
    _contentView.frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
  }
  
#if TARGET_OS_TV
  [self.focusGuide.topAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
  [self.focusGuide.bottomAnchor constraintEqualToAnchor:self.bottomAnchor].active = YES;
  [self.focusGuide.widthAnchor constraintEqualToAnchor:self.widthAnchor].active = YES;
  [self.focusGuide.heightAnchor constraintEqualToAnchor:self.heightAnchor].active = YES;
  
  if (_hasTVPreferredFocus) {
    RCTRootComponentView *rootview = [self containingRootView];
    if (rootview != nil && rootview.reactPreferredFocusedView != self) {
      rootview.reactPreferredFocusedView = self;
      [rootview setNeedsFocusUpdate];
      [rootview updateFocusIfNeeded];
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
  auto const &props = *std::static_pointer_cast<ViewProps const>(_props);
  if ([_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"transform"]) {
    self.layer.transform = RCTCATransform3DFromTransformMatrix(props.transform);
  }
  if ([_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN containsObject:@"opacity"]) {
    self.layer.opacity = (float)props.opacity;
  }

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

  BOOL clipsToBounds = self.clipsToBounds;

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
      .topLeft = (CGFloat)borderRadii.topLeft,
      .topRight = (CGFloat)borderRadii.topRight,
      .bottomLeft = (CGFloat)borderRadii.bottomLeft,
      .bottomRight = (CGFloat)borderRadii.bottomRight};
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

- (void)invalidateLayer
{
  CALayer *layer = self.layer;

  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  auto const borderMetrics = _props->resolveBorderMetrics(_layoutMetrics);

  // Stage 1. Shadow Path
  BOOL const layerHasShadow = layer.shadowOpacity > 0 && CGColorGetAlpha(layer.shadowColor) > 0;
  if (layerHasShadow) {
    if (CGColorGetAlpha(_backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border.
      RCTCornerInsets const cornerInsets =
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

  // Stage 2. Border Rendering
  bool const useCoreAnimationBorderRendering =
      borderMetrics.borderColors.isUniform() && borderMetrics.borderWidths.isUniform() &&
      borderMetrics.borderStyles.isUniform() && borderMetrics.borderRadii.isUniform() &&
      borderMetrics.borderStyles.left == BorderStyle::Solid &&
      (
          // iOS draws borders in front of the content whereas CSS draws them behind
          // the content. For this reason, only use iOS border drawing when clipping
          // or when the border is hidden.
          borderMetrics.borderWidths.left == 0 ||
          colorComponentsFromColor(borderMetrics.borderColors.left).alpha == 0 || self.clipsToBounds);

  if (useCoreAnimationBorderRendering) {
    layer.mask = nil;
    if (_borderLayer) {
      [_borderLayer removeFromSuperlayer];
      _borderLayer = nil;
    }

    layer.borderWidth = (CGFloat)borderMetrics.borderWidths.left;
    CGColorRef borderColor = RCTCreateCGColorRefFromSharedColor(borderMetrics.borderColors.left);
    layer.borderColor = borderColor;
    CGColorRelease(borderColor);
    layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft;
    layer.backgroundColor = _backgroundColor.CGColor;
  } else {
    if (!_borderLayer) {
      _borderLayer = [CALayer new];
      _borderLayer.zPosition = -1024.0f;
      _borderLayer.frame = layer.bounds;
      _borderLayer.magnificationFilter = kCAFilterNearest;
      [layer addSublayer:_borderLayer];
    }

    layer.backgroundColor = nil;
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
        _backgroundColor.CGColor,
        self.clipsToBounds);

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

    // Stage 2.5. Custom Clipping Mask
    CAShapeLayer *maskLayer = nil;
    CGFloat cornerRadius = 0;
    if (self.clipsToBounds) {
      if (borderMetrics.borderRadii.isUniform()) {
        // In this case we can simply use `cornerRadius` exclusively.
        cornerRadius = borderMetrics.borderRadii.topLeft;
      } else {
        // In this case we have to generate masking layer manually.
        CGPathRef path = RCTPathCreateWithRoundedRect(
            self.bounds,
            RCTGetCornerInsets(RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero),
            nil);

        maskLayer = [CAShapeLayer layer];
        maskLayer.path = path;
        CGPathRelease(path);
      }
    }

    layer.cornerRadius = cornerRadius;
    layer.mask = maskLayer;
  }
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

  return RCTRecursiveAccessibilityLabel(self);
}

- (NSString *)accessibilityValue
{
  auto const &props = *std::static_pointer_cast<ViewProps const>(_props);

  // Handle Switch.
  if ((self.accessibilityTraits & AccessibilityTraitSwitch) == AccessibilityTraitSwitch) {
    if (props.accessibilityState.checked == AccessibilityState::Checked) {
      return @"1";
    } else if (props.accessibilityState.checked == AccessibilityState::Unchecked) {
      return @"0";
    }
  }

  // Handle states which haven't already been handled.
  if (props.accessibilityState.checked == AccessibilityState::Checked) {
    return @"checked";
  }
  if (props.accessibilityState.checked == AccessibilityState::Unchecked) {
    return @"unchecked";
  }
  if (props.accessibilityState.checked == AccessibilityState::Mixed) {
    return @"mixed";
  }
  if (props.accessibilityState.expanded) {
    return @"expanded";
  }
  if (props.accessibilityState.busy) {
    return @"busy";
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
  auto const &accessibilityActions = _props->accessibilityActions;

  if (accessibilityActions.empty()) {
    return nil;
  }

  NSMutableArray<UIAccessibilityCustomAction *> *customActions = [NSMutableArray array];
  for (auto const &accessibilityAction : accessibilityActions) {
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
