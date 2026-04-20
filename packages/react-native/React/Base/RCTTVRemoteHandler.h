#if TARGET_OS_TV
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

extern NSString * _Nonnull const RCTTVEnablePanGestureNotification;
extern NSString * _Nonnull const RCTTVDisablePanGestureNotification;

extern NSString * _Nonnull const RCTTVEnableGestureHandlersCancelTouchesNotification;
extern NSString * _Nonnull const RCTTVDisableGestureHandlersCancelTouchesNotification;

@interface RCTTVRemoteHandler : NSObject

- (instancetype _Nonnull )initWithView:(UIView * _Nonnull)view;
- (instancetype _Nonnull )init __attribute__((unavailable("init not available, use initWithView:")));

// Back handler counter: pressesBegan on RCTRootView claims the menu press
// only when this counter is greater than zero. Managed by useBackHandler / BackHandler.
+ (void)incrementBackHandlerCount;
+ (void)decrementBackHandlerCount;
+ (int32_t)backHandlerCount;

+ (BOOL)usePanGesture;
+ (void)setUsePanGesture:(BOOL)usePanGesture;

+ (BOOL)gestureHandlersCancelTouches;
+ (void)setGestureHandlersCancelTouches:(BOOL)cancelTouches;

@end
#endif
