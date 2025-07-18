/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVNavigationEventEmitter.h"
#if TARGET_OS_TV
#import "RCTTVNavigationEventNotificationConstants.h"
#import <React/RCTTVRemoteHandler.h>
#endif

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import "CoreModulesPlugins.h"

static NSString *const TVNavigationEventName = @"onHWKeyEvent";

@interface RCTTVNavigationEventEmitter () <NativeTVNavigationEventEmitterSpec>
@end

@implementation RCTTVNavigationEventEmitter

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
#if TARGET_OS_TV
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:RCTTVNavigationEventNotificationName
                                               object:nil];
#endif
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ TVNavigationEventName ];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
    [self sendEventWithName:TVNavigationEventName body:notif.object];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTVNavigationEventEmitterSpecJSI>(params);
}

#if TARGET_OS_TV

#pragma mark -
#pragma mark Methods moved from old RCTTVMenuBridge

RCT_EXPORT_METHOD(enableTVMenuKey)
{
    [RCTTVRemoteHandler setUseMenuKey:YES];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVEnableMenuKeyNotification object:nil];
}

RCT_EXPORT_METHOD(disableTVMenuKey)
{
    [RCTTVRemoteHandler setUseMenuKey:NO];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVDisableMenuKeyNotification object:nil];
}

RCT_EXPORT_METHOD(enableTVPanGesture)
{
    [RCTTVRemoteHandler setUsePanGesture:YES];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVEnablePanGestureNotification object:nil];
}

RCT_EXPORT_METHOD(disableTVPanGesture)
{
    [RCTTVRemoteHandler setUsePanGesture:NO];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVDisablePanGestureNotification object:nil];
}

RCT_EXPORT_METHOD(enableGestureHandlersCancelTouches) {
  [RCTTVRemoteHandler setGestureHandlersCancelTouches:YES];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVEnableGestureHandlersCancelTouchesNotification object:nil];
}

RCT_EXPORT_METHOD(disableGestureHandlersCancelTouches) {
  [RCTTVRemoteHandler setGestureHandlersCancelTouches:NO];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVDisableGestureHandlersCancelTouchesNotification object:nil];
}
#endif
@end

Class RCTTVNavigationEventEmitterCls(void)
{
  return RCTTVNavigationEventEmitter.class;
}
