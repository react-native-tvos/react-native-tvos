/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

extern NSString * _Nonnull const RCTTVEnableMenuKeyNotification;
extern NSString * _Nonnull const RCTTVDisableMenuKeyNotification;

extern NSString * _Nonnull const RCTTVEnablePanGestureNotification;
extern NSString * _Nonnull const RCTTVDisablePanGestureNotification;

extern NSString * _Nonnull const RCTTVRemoteEventMenu;
extern NSString * _Nonnull const RCTTVRemoteEventPlayPause;
extern NSString * _Nonnull const RCTTVRemoteEventSelect;

extern NSString * _Nonnull const RCTTVRemoteEventLongPlayPause;
extern NSString * _Nonnull const RCTTVRemoteEventLongSelect;

extern NSString * _Nonnull const RCTTVRemoteEventLeft;
extern NSString * _Nonnull const RCTTVRemoteEventRight;
extern NSString * _Nonnull const RCTTVRemoteEventUp;
extern NSString * _Nonnull const RCTTVRemoteEventDown;

extern NSString * _Nonnull const RCTTVRemoteEventPageUp;
extern NSString * _Nonnull const RCTTVRemoteEventPageDown;

extern NSString * _Nonnull const RCTTVRemoteEventSwipeLeft;
extern NSString * _Nonnull const RCTTVRemoteEventSwipeRight;
extern NSString * _Nonnull const RCTTVRemoteEventSwipeUp;
extern NSString * _Nonnull const RCTTVRemoteEventSwipeDown;

extern NSString * _Nonnull const RCTTVRemoteEventPan;

@interface RCTTVRemoteHandler : NSObject

- (instancetype _Nonnull )initWithView:(UIView * _Nonnull)view;
- (instancetype _Nonnull )init __attribute__((unavailable("init not available, use initWithView:")));

+ (BOOL)useMenuKey;
+ (void)setUseMenuKey:(BOOL)useMenuKey;

+ (BOOL)usePanGesture;
+ (void)setUsePanGesture:(BOOL)usePanGesture;

- (void)enableTVMenuKey;
- (void)disableTVMenuKey;

@end
