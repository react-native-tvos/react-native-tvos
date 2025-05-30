/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTKeyWindowValuesProxy : NSObject

+ (instancetype)sharedInstance;

@property (assign, readonly) CGSize windowSize;
#if !TARGET_OS_TV
@property (assign, readonly) UIInterfaceOrientation currentInterfaceOrientation;
#endif

- (void)startObservingWindowSizeIfNecessary;

@end

NS_ASSUME_NONNULL_END
