/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

extern NSString *const RCTTVRemoteEventMenu;
extern NSString *const RCTTVRemoteEventPlayPause;
extern NSString *const RCTTVRemoteEventSelect;

extern NSString *const RCTTVRemoteEventLongPlayPause;
extern NSString *const RCTTVRemoteEventLongSelect;

extern NSString *const RCTTVRemoteEventLeft;
extern NSString *const RCTTVRemoteEventRight;
extern NSString *const RCTTVRemoteEventUp;
extern NSString *const RCTTVRemoteEventDown;

extern NSString *const RCTTVRemoteEventPageUp;
extern NSString *const RCTTVRemoteEventPageDown;

extern NSString *const RCTTVRemoteEventSwipeLeft;
extern NSString *const RCTTVRemoteEventSwipeRight;
extern NSString *const RCTTVRemoteEventSwipeUp;
extern NSString *const RCTTVRemoteEventSwipeDown;

extern NSString *const RCTTVRemoteEventPan;

@interface RCTTVRemoteHandler : NSObject

- (instancetype _Nonnull )initWithView:(UIView * _Nonnull)view;
- (instancetype _Nonnull )init __attribute__((unavailable("init not available, use initWithView:")));

+ (BOOL)useMenuKey;
+ (void)setUseMenuKey:(BOOL)useMenuKey;

@end
