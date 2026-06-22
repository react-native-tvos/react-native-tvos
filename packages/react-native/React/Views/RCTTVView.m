#if TARGET_OS_TV
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVView.h"

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderDrawing.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTRootViewInternal.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"
#import <React/RCTUIManager.h>
#import <React/RCTTVNavigationEventNotification.h>

@implementation RCTTVView {
  __weak RCTBridge *_bridge;
  BOOL motionEffectsAdded;
  NSArray* focusDestinations;
  id<UIFocusItem> previouslyFocusedItem;
  
}

- (instancetype)initWithBridge:(RCTBridge *)bridge {
  if (self = [super init]) {
    _bridge = bridge;
    dispatch_once(&onceToken, ^{
      defaultTVParallaxProperties = @{
        @"enabled" : @YES,
        @"shiftDistanceX" : @2.0f,
        @"shiftDistanceY" : @2.0f,
        @"tiltAngle" : @0.05f,
        @"magnification" : @1.0f,
        @"pressMagnification" : @1.0f,
        @"pressDuration" : @0.3f,
        @"pressDelay" : @0.0f
      };
    });
    self.tvParallaxProperties = defaultTVParallaxProperties;
    motionEffectsAdded = NO;
  }
  
  return self;
}

static NSDictionary *defaultTVParallaxProperties = nil;
static dispatch_once_t onceToken;

- (void)setTvParallaxProperties:(NSDictionary *)tvParallaxProperties
{
  if (_tvParallaxProperties == nil) {
    _tvParallaxProperties = [defaultTVParallaxProperties copy];
    return;
  }
  
  NSMutableDictionary *newParallaxProperties = [NSMutableDictionary dictionaryWithDictionary:_tvParallaxProperties];
  for (NSString *k in [defaultTVParallaxProperties allKeys]) {
    if (tvParallaxProperties[k]) {
      newParallaxProperties[k] = tvParallaxProperties[k];
    }
  }
  _tvParallaxProperties = [newParallaxProperties copy];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : unused)

- (void)setIsTVSelectable:(BOOL)isTVSelectable
{
  self->_isTVSelectable = isTVSelectable;
  if (isTVSelectable && ![self isTVFocusGuide]) {
    self.tvRemoteSelectHandler = [[RCTTVRemoteSelectHandler alloc] initWithView:self];
  } else {
    self.tvRemoteSelectHandler = nil;
  }
}

- (void)animatePressIn
{
  if ([self.tvParallaxProperties[@"enabled"] boolValue] == YES) {
    float pressMagnification = [self.tvParallaxProperties[@"pressMagnification"] floatValue];
    float pressDuration = [self.tvParallaxProperties[@"pressDuration"] floatValue];
    [UIView animateWithDuration:(pressDuration/2)
                     animations:^{
      self.transform = CGAffineTransformMakeScale(pressMagnification, pressMagnification);
    }
                     completion:^(__unused BOOL finished){}];
  }
}

- (void) animatePressOut
{
  if ([self.tvParallaxProperties[@"enabled"] boolValue] == YES) {
    float magnification = [self.tvParallaxProperties[@"magnification"] floatValue];
    float pressDuration = [self.tvParallaxProperties[@"pressDuration"] floatValue];

    [UIView animateWithDuration:(pressDuration/2)
                     animations:^{
      self.transform = CGAffineTransformMakeScale(magnification, magnification);
    }
                     completion:^(__unused BOOL finished){}];
  }
}

- (void)emitPressInEvent
{
  if (self.onPressIn) self.onPressIn(nil);
}

- (void)emitPressOutEvent
{
  if (self.onPressOut) self.onPressOut(nil);
}

- (BOOL)isTVFocusGuide
{
  return self.focusGuide != nil;
}

- (BOOL)isUserInteractionEnabled
{
  if ([self isTVFocusGuide]) {
    return (self.isTVSelectable);
  }
  return YES;
}

- (BOOL)canBecomeFocused
{
  if ([self isTVFocusGuide]) {
    return NO;
  }

  return (self.isTVSelectable);
}

- (RCTRootView * _Nullable)rootView
{
  UIView *rootview = self;
  while (![rootview isReactRootView] && rootview != nil) {
    rootview = [rootview superview];
  }
  if (rootview == nil) return nil;

  rootview = [rootview superview];
  return (RCTRootView *)rootview;
}

- (void)addParallaxMotionEffects
{
  if(![self.tvParallaxProperties[@"enabled"] boolValue]) {
    return;
  }
  
  if(motionEffectsAdded == YES) {
    return;
  }
  
  // Size of shift movements
  CGFloat const shiftDistanceX = [self.tvParallaxProperties[@"shiftDistanceX"] floatValue];
  CGFloat const shiftDistanceY = [self.tvParallaxProperties[@"shiftDistanceY"] floatValue];
  
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
  CGFloat const tiltAngle = [self.tvParallaxProperties[@"tiltAngle"] floatValue];
  
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
  transMinimumTiltAboutX = CATransform3DRotate(transMinimumTiltAboutX, tiltAngle, 1, 0, 0);
  
  // CATransform3D value for minimumRelativeValue
  CATransform3D transMaximumTiltAboutX = CATransform3DIdentity;
  transMaximumTiltAboutX.m34 = 1.0 / 500;
  transMaximumTiltAboutX = CATransform3DRotate(transMaximumTiltAboutX, tiltAngle * -1.0, 1, 0, 0);
  
  // Set the transform property boundaries for the interpolation
  yTilt.minimumRelativeValue = [NSValue valueWithCATransform3D:transMinimumTiltAboutX];
  yTilt.maximumRelativeValue = [NSValue valueWithCATransform3D:transMaximumTiltAboutX];
  
  // Add all of the motion effects to this group
  self.motionEffects = @[ xShift, yShift, xTilt, yTilt ];
  
  float magnification = [self.tvParallaxProperties[@"magnification"] floatValue];
  
  [UIView animateWithDuration:0.2 animations:^{
    self.transform = CGAffineTransformScale(self.transform, magnification, magnification);
  }];
  
  motionEffectsAdded = YES;
}

- (void)removeParallaxMotionEffects
{
  if(motionEffectsAdded == NO) {
    return;
  }
  
  [UIView animateWithDuration:0.2 animations:^{
    float magnification = [self.tvParallaxProperties[@"magnification"] floatValue];
    BOOL enabled = [self.tvParallaxProperties[@"enabled"] boolValue];
    if (enabled && magnification) {
      self.transform = CGAffineTransformScale(self.transform, 1.0/magnification, 1.0/magnification);
    }
  }];
  
  for (UIMotionEffect *effect in [self.motionEffects copy]){
    [self removeMotionEffect:effect];
  }
  
  motionEffectsAdded = NO;
}

- (void)didMoveToSuperview {
    [super didMoveToSuperview];

    // There's no way for us to understand if the view is actually getting removed or getting detached.
    // We play safe here and set the focusGuide's preferredFocusEnvs to an empty array
    // to break a potential retain cycle (see `handleFocusGuide`).
    if (self.superview == nil && self.focusGuide != nil) {
        self.focusGuide.preferredFocusEnvironments = @[];
    }
    
    // We should restore focusGuide's state if the item was only detached and now getting attached again.
    if (self.superview != nil && self.focusGuide != nil) {
        [self handleFocusGuide];
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

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context
       withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
  if (context.previouslyFocusedView == context.nextFocusedView) {
    return;
  }
    
  if (_autoFocus && self.focusGuide != nil && context.previouslyFocusedItem != nil) {
    // Whenever focus leaves the container, `nextFocusedView` is the destination, the item outside the container.
    // So, `previouslyFocusedItem` is always the last focused child of `TVFocusGuide`.
    // We should update `preferredFocusEnvironments` in this case to make sure `FocusGuide` remembers
    // the last focused element and redirects the focus to it whenever focus comes back.
    previouslyFocusedItem = context.previouslyFocusedItem;
    [self handleFocusGuide];
  }
    
  if (context.nextFocusedView == self) {
    [self becomeFirstResponder];
    [self enableDirectionalFocusGuides];
    [coordinator addCoordinatedAnimations:^(void){
      if (self.onFocus) self.onFocus(nil);
      [self sendFocusNotification:context];
      [self addParallaxMotionEffects];
    } completion:^(void){}];
    // Without this check, onBlur would also trigger when `TVFocusGuideView` transfers focus to its children.
    // [self isTVFocusGuide] is false when autofocus and destinations are not used, so we cannot use that.
    // Generally speaking, it would happen for any non-collapsable `View`.
  } else if (context.previouslyFocusedView == self ) {
    [self disableDirectionalFocusGuides];
    [coordinator addCoordinatedAnimations:^(void){
      [self removeParallaxMotionEffects];
      if (self.onBlur) self.onBlur(nil);
      [self sendBlurNotification:context];
    } completion:^(void){}];
    [self resignFirstResponder];
  }
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
      [[self rootView]  addLayoutGuide:self.focusGuideUp];

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
      [[self rootView]  addLayoutGuide:self.focusGuideDown];

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
      [[self rootView]  addLayoutGuide:self.focusGuideLeft];

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
      [[self rootView] addLayoutGuide:self.focusGuideRight];

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
    [[self rootView] removeLayoutGuide:self.focusGuideUp];
    self.focusGuideUp = nil;
  }
  if (self.focusGuideDown != nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideDown];
    self.focusGuideDown = nil;
  }
  if (self.focusGuideLeft != nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideLeft];
    self.focusGuideLeft = nil;
  }
  if (self.focusGuideRight != nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideRight];
    self.focusGuideRight = nil;
  }
}

- (void)sendFocusNotification:(__unused UIFocusUpdateContext *)context
{
    [[NSNotificationCenter defaultCenter] postNavigationFocusEventWithTag:self.reactTag target:self.reactTag];
}

- (void)sendBlurNotification:(__unused UIFocusUpdateContext *)context
{
    [[NSNotificationCenter defaultCenter] postNavigationBlurEventWithTag:self.reactTag target:self.reactTag];
}

- (void)sendSelectNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventSelect keyAction:RCTTVRemoteEventKeyActionUp tag:self.reactTag target:self.reactTag];
}

- (void)sendLongSelectBeganNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventLongSelect keyAction:RCTTVRemoteEventKeyActionDown tag:self.reactTag target:self.reactTag];
}

- (void)sendLongSelectEndedNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventLongSelect keyAction:RCTTVRemoteEventKeyActionUp tag:self.reactTag target:self.reactTag];
}

- (RCTTVView *)getViewById:(NSNumber *)viewId {
  if (viewId == nil) return nil;
  NSDictionary<NSNumber *, UIView *> *views = [_bridge.uiManager valueForKey:@"viewRegistry"];
  return (RCTTVView*)views[viewId];
}

- (void)setNextFocusUp:(NSNumber *)nextFocusUp {
  if (self.focusGuideUp != nil && nextFocusUp == nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideUp];
    self.focusGuideUp = nil;
  } else {
    self->_nextFocusUp = [self getViewById: nextFocusUp];
    [self enableDirectionalFocusGuides];
  }
}

- (void)setNextFocusDown:(NSNumber *)nextFocusDown {
  if (self.focusGuideDown != nil && nextFocusDown == nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideDown];
    self.focusGuideDown = nil;
  } else {
    self->_nextFocusDown = [self getViewById: nextFocusDown];
    [self enableDirectionalFocusGuides];
  }
}

- (void)setNextFocusLeft:(NSNumber *)nextFocusLeft {
  if (self.focusGuideLeft != nil && nextFocusLeft == nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideLeft];
    self.focusGuideLeft = nil;
  } else {
    self->_nextFocusLeft = [self getViewById: nextFocusLeft];
    [self enableDirectionalFocusGuides];
  }
}

- (void)setNextFocusRight:(NSNumber *)nextFocusRight {
  if (self.focusGuideRight != nil && nextFocusRight == nil) {
    [[self rootView] removeLayoutGuide:self.focusGuideRight];
    self.focusGuideRight = nil;
  } else {
    self->_nextFocusRight = [self getViewById: nextFocusRight];
    [self enableDirectionalFocusGuides];
  }
}

- (void)setPreferredFocus:(BOOL)hasTVPreferredFocus
{
  _hasTVPreferredFocus = hasTVPreferredFocus;
  if (hasTVPreferredFocus) {
    [self requestFocusSelf];
  }
}

- (void)setHasTVPreferredFocus:(BOOL)hasTVPreferredFocus
{
  [self setPreferredFocus:hasTVPreferredFocus];
}

- (void)setAutoFocus:(BOOL)autoFocus
{
  if (_autoFocus != autoFocus) {
    _autoFocus = autoFocus;
    [self handleFocusGuide];
  }
}

- (void)addFocusGuide:(NSArray*)destinations {
  if (self.focusGuide == nil) {
    self.focusGuide = [UIFocusGuide new];
    [self addLayoutGuide:self.focusGuide];
    
    [self.focusGuide.widthAnchor constraintEqualToAnchor:self.widthAnchor].active = YES;
    [self.focusGuide.heightAnchor constraintEqualToAnchor:self.heightAnchor].active = YES;
    [self.focusGuide.topAnchor constraintEqualToAnchor:self.topAnchor].active = YES;
    [self.focusGuide.leftAnchor constraintEqualToAnchor:self.leftAnchor].active = YES;
  }
  
  self.focusGuide.preferredFocusEnvironments = destinations;
}

- (void)removeFocusGuide {
	if (self.focusGuide != nil) {
    focusDestinations = nil;
    previouslyFocusedItem = nil;

    [self removeLayoutGuide:self.focusGuide];
    self.focusGuide = nil;
	}
}

/// Responsible of determining what focusGuide's next state should be based on the active properties of the component.
- (void)handleFocusGuide
{
  // `destinations` should always be favored against `autoFocus` feature, if provided.
  if (focusDestinations != nil) {
    [self addFocusGuide:focusDestinations];
  } else if (_autoFocus && previouslyFocusedItem != nil) {
    // We also add `self` as the second option in case `previouslyFocusedItem` becomes unreachable (e.g gets detached).
    // `self` helps redirecting focus to the first focusable element in that case.
    [self addFocusGuide:@[previouslyFocusedItem, self]];
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
    focusDestinations = nil;
  } else {
    focusDestinations = destinations;
  }

  [self handleFocusGuide];
}

-(bool)focusSelf {
#ifndef RCT_REMOVE_LEGACY_ARCH
  RCTRootView *rootview = [self rootView];
  if (rootview == nil) return false;
  
  if (self.focusGuide != nil) {
    rootview.reactPreferredFocusEnvironments = self.focusGuide.preferredFocusEnvironments;
  } else {
    rootview.reactPreferredFocusedView = self;
  }

  [rootview setNeedsFocusUpdate];
  [rootview updateFocusIfNeeded];
#endif
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

- (void)requestTVFocus
{
  [self requestFocusSelf];
}
@end
#endif
