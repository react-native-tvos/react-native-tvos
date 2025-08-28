/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import "RCTModalHostView.h"

#ifndef RCT_FIT_RM_OLD_COMPONENT

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTModalHostViewController : UIViewController

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

@property (nonatomic, weak) RCTModalHostView *modalHostView;

#if !TARGET_OS_TV
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;
#endif

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
