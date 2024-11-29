/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVNavigationEventEmitter.h"
#if TARGET_OS_TV
#import "RCTTVNavigationEventNotificationConstants.h"
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

@end

Class RCTTVNavigationEventEmitterCls(void)
{
  return RCTTVNavigationEventEmitter.class;
}
