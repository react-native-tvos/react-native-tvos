/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTViewComponentView.h>

#if TARGET_OS_TV
#import "RCTTVRemoteHandler.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for root <View> component.
 */
@interface RCTRootComponentView : RCTViewComponentView

#if TARGET_OS_TV
@property (nonatomic, strong, nullable) RCTTVRemoteHandler *tvRemoteHandler;
@property (nonatomic, weak, nullable) UIView *reactPreferredFocusedView;
#endif

@end

NS_ASSUME_NONNULL_END
