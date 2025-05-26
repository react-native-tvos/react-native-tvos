/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>

@protocol NativeTVNavigationEventEmitterSpec <RCTBridgeModule, RCTTurboModule>

- (void)addListener:(NSString *)eventName;
- (void)removeListeners:(double)count;

@end

@interface RCTTVNavigationEventEmitter : RCTEventEmitter

@end
