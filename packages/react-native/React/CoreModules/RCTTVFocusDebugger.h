/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>

#if TARGET_OS_TV

@interface TVFocusDebugManager : NSObject

@property (atomic) BOOL enabled;

+ (instancetype)shared;

- (void)emitPreEvent:(UIFocusUpdateContext *)context fromRootView:(UIView *)rootView;
- (void)emitPostEvent:(UIFocusUpdateContext *)context fromRootView:(UIView *)rootView;

@end

#endif

@protocol NativeTVFocusDebugSpec <RCTBridgeModule, RCTTurboModule>

- (void)addListener:(NSString *)eventName;
- (void)removeListeners:(double)count;

@end

@interface RCTTVFocusDebugger : RCTEventEmitter

@end
