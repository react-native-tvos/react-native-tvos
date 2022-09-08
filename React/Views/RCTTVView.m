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

@implementation RCTTVView {
  __weak RCTBridge *_bridge;
  UITapGestureRecognizer *_selectRecognizer;
  BOOL motionEffectsAdded;
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
  if (isTVSelectable) {
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

- (void)handleSelect:(__unused UIGestureRecognizer *)r
{
  if ([self.tvParallaxProperties[@"enabled"] boolValue] == YES) {
    float magnification = [self.tvParallaxProperties[@"magnification"] floatValue];
    float pressMagnification = [self.tvParallaxProperties[@"pressMagnification"] floatValue];
    
    // Duration of press animation
    float pressDuration = [self.tvParallaxProperties[@"pressDuration"] floatValue];
    
    // Delay of press animation
    float pressDelay = [self.tvParallaxProperties[@"pressDelay"] floatValue];
    
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

- (BOOL)isUserInteractionEnabled
{
  return YES;
}

- (BOOL)canBecomeFocused
{
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

- (RCTRootView * _Nullable)waitForNonNullRootView
{
  // Spin for 480 ms and check at 16 ms intervals
  // When root view available, set this view as focused
  RCTRootView *rootview = [self rootView];
  int counter = 30;
  while (rootview == nil && counter > 0) {
    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.016]];
    counter = counter - 1;
    rootview = [self rootView];
  }
  return rootview;
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

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context
       withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
  if (context.previouslyFocusedView == context.nextFocusedView) {
    return;
  }
  if (context.nextFocusedView == self && self.isTVSelectable ) {
    [self becomeFirstResponder];
    [self enableDirectionalFocusGuides];
    [coordinator addCoordinatedAnimations:^(void){
      [self addParallaxMotionEffects];
      [self sendFocusNotification:context];
    } completion:^(void){}];
  } else {
    [self disableDirectionalFocusGuides];
    [coordinator addCoordinatedAnimations:^(void){
      [self sendBlurNotification:context];
      [self removeParallaxMotionEffects];
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
                                                          @"tag":self.reactTag,
                                                          @"target":self.reactTag
                                                      }];
}

- (RCTTVView *)getViewById:(NSNumber *)viewId {
  if (viewId == nil) return nil;
  NSDictionary<NSNumber *, UIView *> *views = [_bridge.uiManager valueForKey:@"viewRegistry"];
  return (RCTTVView*)views[viewId];
}

- (void)setNextFocusUp:(NSNumber *)nextFocusUp {
  self->_nextFocusUp = [self getViewById: nextFocusUp];
}

- (void)setNextFocusDown:(NSNumber *)nextFocusDown {
  self->_nextFocusDown = [self getViewById: nextFocusDown];
}

- (void)setNextFocusLeft:(NSNumber *)nextFocusLeft {
  self->_nextFocusLeft = [self getViewById: nextFocusLeft];
}

- (void)setNextFocusRight:(NSNumber *)nextFocusRight {
  self->_nextFocusRight = [self getViewById: nextFocusRight];
}

- (void)setPreferredFocus:(BOOL)hasTVPreferredFocus
{
  _hasTVPreferredFocus = hasTVPreferredFocus;
  if (hasTVPreferredFocus) {
    dispatch_async(dispatch_get_main_queue(), ^{
      RCTRootView *rootview = [self waitForNonNullRootView];
      if (rootview == nil) return;
      [rootview setReactPreferredFocusedView:self];
      [rootview setNeedsFocusUpdate];
    });
  }
}

- (void)setHasTVPreferredFocus:(BOOL)hasTVPreferredFocus
{
  [self setPreferredFocus:hasTVPreferredFocus];
}

- (void)addFocusGuide:(NSArray*)destinations {
  
  UIView *origin = [self reactSuperview];
  if (self.focusGuide == nil && origin != nil) {
    self.focusGuide = [UIFocusGuide new];
    [self addLayoutGuide:self.focusGuide];
    
    [self.focusGuide.widthAnchor constraintEqualToAnchor:origin.widthAnchor].active = YES;
    [self.focusGuide.heightAnchor constraintEqualToAnchor:origin.heightAnchor].active = YES;
    [self.focusGuide.topAnchor constraintEqualToAnchor:origin.topAnchor].active = YES;
    [self.focusGuide.leftAnchor constraintEqualToAnchor:origin.leftAnchor].active = YES;
  }
  
  self.focusGuide.preferredFocusEnvironments = destinations;
}

@end
