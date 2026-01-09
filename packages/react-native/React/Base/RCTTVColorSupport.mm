/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@implementation UIColor (RNTVSystemColors)

+ (UIColor *)rntv_systemBackgroundColor {
 #if TARGET_OS_TV
   UIColor *lightColor = [UIColor whiteColor];
   UIColor *darkColor = [UIColor blackColor];

   return [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *traitCollection) {
     return (traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark) ? darkColor : lightColor;
   }];
 #else
   return [UIColor systemBackgroundColor];
 #endif
}

@end
