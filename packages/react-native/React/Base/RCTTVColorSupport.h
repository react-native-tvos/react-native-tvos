/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

/**
 * Category on UIColor providing systemBackgroundColor for all platforms.
 * On tvOS, provides a custom implementation since systemBackgroundColor is not available.
 * On other platforms, returns the system's systemBackgroundColor.
 */
@interface UIColor (RNTVSystemColors)

+ (UIColor *)rntv_systemBackgroundColor;

@end
