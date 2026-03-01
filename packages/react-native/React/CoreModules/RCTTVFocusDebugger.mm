/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVFocusDebugger.h"

#if TARGET_OS_TV

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import "CoreModulesPlugins.h"
#import <React/RCTViewComponentView.h>

static NSString *const TVFocusDebugEventName = @"onFocusDebugEvent";

#pragma mark - TVFocusDebugManager

@implementation TVFocusDebugManager

+ (instancetype)shared
{
  static TVFocusDebugManager *instance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[TVFocusDebugManager alloc] init];
  });
  return instance;
}

- (instancetype)init
{
  if (self = [super init]) {
    _enabled = NO;
  }
  return self;
}

#pragma mark - Event Emission

- (void)emitPreEvent:(UIFocusUpdateContext *)context fromRootView:(UIView *)rootView
{
  [self emitEvent:@"focusSearch" context:context fromRootView:rootView];
}

- (void)emitPostEvent:(UIFocusUpdateContext *)context fromRootView:(UIView *)rootView
{
  [self emitEvent:@"post" context:context fromRootView:rootView];
}

- (void)emitEvent:(NSString *)eventType context:(UIFocusUpdateContext *)context fromRootView:(UIView *)rootView
{
  NSMutableDictionary *body = [NSMutableDictionary dictionary];
  body[@"eventType"] = eventType;
  body[@"timestamp"] = @(CACurrentMediaTime() * 1000.0);
  body[@"direction"] = [self directionFromHeading:context.focusHeading];

  UIView *previousView = context.previouslyFocusedView;
  UIView *nextView = context.nextFocusedView;

  body[@"currentlyFocused"] = previousView ? [self viewInfoFromView:previousView] : [NSNull null];
  body[@"nextFocused"] = nextView ? [self viewInfoFromView:nextView] : [NSNull null];
  body[@"allFocusables"] = rootView ? [self collectFocusableViews:rootView] : @[];

  [[NSNotificationCenter defaultCenter] postNotificationName:TVFocusDebugEventName object:body];
}

#pragma mark - View Info

- (NSDictionary *)viewInfoFromView:(UIView *)view
{
  NSMutableDictionary *info = [NSMutableDictionary dictionary];
  info[@"tag"] = @(view.tag);
  info[@"viewName"] = NSStringFromClass([view class]);

  CGRect screenFrame = [view convertRect:view.bounds toView:nil];
  info[@"frame"] = @{
    @"x": @(screenFrame.origin.x),
    @"y": @(screenFrame.origin.y),
    @"width": @(screenFrame.size.width),
    @"height": @(screenFrame.size.height),
  };

  NSMutableDictionary *focusProps = [NSMutableDictionary dictionary];
  focusProps[@"focusable"] = @(view.canBecomeFocused);

  if ([view isKindOfClass:[RCTViewComponentView class]]) {
    // Access @protected ivars via KVC (accessInstanceVariablesDirectly = YES by default)
    focusProps[@"hasTVPreferredFocus"] = [view valueForKey:@"hasTVPreferredFocus"] ?: @NO;
    focusProps[@"trapFocusUp"] = [view valueForKey:@"trapFocusUp"] ?: @NO;
    focusProps[@"trapFocusDown"] = [view valueForKey:@"trapFocusDown"] ?: @NO;
    focusProps[@"trapFocusLeft"] = [view valueForKey:@"trapFocusLeft"] ?: @NO;
    focusProps[@"trapFocusRight"] = [view valueForKey:@"trapFocusRight"] ?: @NO;
    focusProps[@"autoFocus"] = [view valueForKey:@"autoFocus"] ?: @NO;

    NSString *testID = view.accessibilityIdentifier;
    if (testID.length > 0) {
      info[@"testID"] = testID;
    }
  } else {
    focusProps[@"hasTVPreferredFocus"] = @NO;
    focusProps[@"trapFocusUp"] = @NO;
    focusProps[@"trapFocusDown"] = @NO;
    focusProps[@"trapFocusLeft"] = @NO;
    focusProps[@"trapFocusRight"] = @NO;
    focusProps[@"autoFocus"] = @NO;
  }

  info[@"focusProps"] = focusProps;
  return info;
}

#pragma mark - Focusable Collection

- (NSArray *)collectFocusableViews:(UIView *)root
{
  NSMutableArray *result = [NSMutableArray array];
  [self collectFocusableViewsRecursive:root into:result];
  return result;
}

- (void)collectFocusableViewsRecursive:(UIView *)view into:(NSMutableArray *)result
{
  if (view.isHidden || view.alpha <= 0) {
    return;
  }

  if (view.canBecomeFocused) {
    [result addObject:[self viewInfoFromView:view]];
  }

  for (UIView *subview in view.subviews) {
    [self collectFocusableViewsRecursive:subview into:result];
  }
}

#pragma mark - Direction Mapping

- (NSString *)directionFromHeading:(UIFocusHeading)heading
{
  if (heading & UIFocusHeadingUp) return @"up";
  if (heading & UIFocusHeadingDown) return @"down";
  if (heading & UIFocusHeadingLeft) return @"left";
  if (heading & UIFocusHeadingRight) return @"right";
  if (heading & UIFocusHeadingNext) return @"forward";
  if (heading & UIFocusHeadingPrevious) return @"backward";
  return @"unknown";
}

@end

#pragma mark - RCTTVFocusDebugger TurboModule

@interface RCTTVFocusDebugger () <NativeTVFocusDebugSpec>
@end

@implementation RCTTVFocusDebugger

RCT_EXPORT_MODULE(TVFocusDebug)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleFocusDebugEvent:)
                                                 name:TVFocusDebugEventName
                                               object:nil];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ TVFocusDebugEventName ];
}

- (void)handleFocusDebugEvent:(NSNotification *)notif
{
  [self sendEventWithName:TVFocusDebugEventName body:notif.object];
}

RCT_EXPORT_METHOD(enable)
{
  [TVFocusDebugManager shared].enabled = YES;
}

RCT_EXPORT_METHOD(disable)
{
  [TVFocusDebugManager shared].enabled = NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTVFocusDebugSpecJSI>(params);
}

@end

Class RCTTVFocusDebuggerCls(void)
{
  return RCTTVFocusDebugger.class;
}

#else // !TARGET_OS_TV

@interface RCTTVFocusDebugger () <NativeTVFocusDebugSpec>
@end

@implementation RCTTVFocusDebugger

RCT_EXPORT_MODULE(TVFocusDebug)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onFocusDebugEvent" ];
}

RCT_EXPORT_METHOD(enable) {}
RCT_EXPORT_METHOD(disable) {}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTVFocusDebugSpecJSI>(params);
}

@end

Class RCTTVFocusDebuggerCls(void)
{
  return RCTTVFocusDebugger.class;
}

#endif // TARGET_OS_TV
