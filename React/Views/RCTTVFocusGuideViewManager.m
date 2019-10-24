//
//  RCTTVFocusGuideManager.m
//  React
//
//  Created by Alain Hufkens on 12/06/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTTVFocusGuideViewManager.h"
#import "RCTView.h"
#if (TARGET_OS_TV)
#import "RCTTVFocusGuideView.h"
#endif

@implementation RCTTVFocusGuideViewManager

RCT_EXPORT_MODULE()
RCT_EXPORT_VIEW_PROPERTY(destinationTags, NSArray)

#if (TARGET_OS_TV)
- (RCTTVFocusGuideView *)view {
  return [[RCTTVFocusGuideView alloc] initWithBridge:self.bridge];
}
#else
- (RCTView *)view {
  return [RCTView new];
}
#endif

@end
