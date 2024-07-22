/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol RCTFabricModalHostViewControllerDelegate <NSObject>
- (void)boundsDidChange:(CGRect)newBounds;
#if TARGET_OS_TV
- (void)enableEventHandlers;
- (void)disableEventHandlers;
#endif
@end

@interface RCTFabricModalHostViewController : UIViewController

@property (nonatomic, weak) id<RCTFabricModalHostViewControllerDelegate> delegate;

#if !TARGET_OS_TV
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;
#endif

@end
