#if TARGET_OS_TV
/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTView.h>
#import <React/RCTBridge.h>
#import <React/RCTTVRemoteSelectHandler.h>

//  A RCTView with additional properties and methods for user interaction using the Apple TV focus engine.
@interface RCTTVView : RCTView <RCTTVRemoteSelectHandlerDelegate>

/**
 * TV event handlers
 */
@property (nonatomic, assign) BOOL isTVSelectable; // True if this view is TV-focusable

/**
 *  Properties for Apple TV focus parallax effects
 */
@property (nonatomic, copy) NSDictionary *tvParallaxProperties;

/**
 * TV preferred focus
 */
@property (nonatomic, assign) BOOL hasTVPreferredFocus;

/**
  * Select and longSelect event handler
 */
@property (nonatomic, strong) RCTTVRemoteSelectHandler *tvRemoteSelectHandler;
/**
 * Focus direction tags
 */
@property (nonatomic, weak) RCTTVView * nextFocusUp;
@property (nonatomic, weak) RCTTVView * nextFocusDown;
@property (nonatomic, weak) RCTTVView * nextFocusLeft;
@property (nonatomic, weak) RCTTVView * nextFocusRight;

@property (nonatomic, strong) UIFocusGuide * focusGuideUp;
@property (nonatomic, strong) UIFocusGuide * focusGuideDown;
@property (nonatomic, strong) UIFocusGuide * focusGuideLeft;
@property (nonatomic, strong) UIFocusGuide * focusGuideRight;

/**
 * Auto focus
 */
@property (nonatomic, assign) BOOL autoFocus;

@property (nonatomic, assign) BOOL trapFocusUp;
@property (nonatomic, assign) BOOL trapFocusDown;
@property (nonatomic, assign) BOOL trapFocusLeft;
@property (nonatomic, assign) BOOL trapFocusRight;

// These handlers are defined in RCTView
/*
@property (nonatomic, copy) RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onBlur;
@property (nonatomic, copy) RCTDirectEventBlock onPressIn;
@property (nonatomic, copy) RCTDirectEventBlock onPressOut;
 */

- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * Send Focus Notifications to listeners
 * @deprecated This method emits focus events to TVEventHandler, which is deprecated.
 * Use onFocus/onBlur component props instead. Will be removed when old arch is removed.
 * See: https://github.com/react-native-tvos/react-native-tvos/issues/1037
 */
- (void)sendFocusNotification:(UIFocusUpdateContext *)context;

/**
 * Send Blur Notifications to listeners
 * @deprecated This method emits blur events to TVEventHandler, which is deprecated.
 * Use onFocus/onBlur component props instead. Will be removed when old arch is removed.
 * See: https://github.com/react-native-tvos/react-native-tvos/issues/1037
 */
- (void)sendBlurNotification:(UIFocusUpdateContext *)context;

/**
 * Adds Parallax Motion Effects if tvParallaxProperty is enabled
 */
- (void)addParallaxMotionEffects;

/**
 * Removes Parallax Motion Effects if tvParallaxProperty is enabled
 */
- (void)removeParallaxMotionEffects;


- (void)setFocusDestinations:(NSArray*)destinations;

- (void)requestTVFocus;

@property (nonatomic, strong) UIFocusGuide * focusGuide;

@end
#endif
