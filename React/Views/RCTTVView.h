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

//  A RCTView with additional properties and methods for user interaction using the Apple TV focus engine.
@interface RCTTVView : RCTView

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

- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * Send Focus Notifications to listeners
 */
- (void)sendFocusNotification:(UIFocusUpdateContext *)context;

/**
 * Send Blur Notifications to listeners
 */
- (void)sendBlurNotification:(UIFocusUpdateContext *)context;

/**
 * Send Select Notification to listeners
 */
- (void)sendSelectNotification:(UIGestureRecognizer *)recognizer;

/**
 * Adds Parallax Motion Effects if tvParallaxProperty is enabled
 */
- (void)addParallaxMotionEffects;

/**
 * Removes Parallax Motion Effects if tvParallaxProperty is enabled
 */
- (void)removeParallaxMotionEffects;


- (void)addFocusGuide:(NSArray*)destinations;

@property (nonatomic, strong) UIFocusGuide * focusGuide;

@end
