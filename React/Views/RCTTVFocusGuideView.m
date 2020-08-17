//
//  RCTTVFocusGuideView.m
//  React
//
//  Created by Alain Hufkens on 12/06/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTTVFocusGuideView.h"
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>

@implementation RCTTVFocusGuideView {
  __weak RCTBridge *_bridge;
  BOOL _needsUpdateView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge {
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

- (void)invalidate {
}

- (void)setDestinationTags:(NSArray *)destinationTags {
    NSArray *destinationTagsValue = destinationTags ? destinationTags : @[];
    NSDictionary<NSNumber *, UIView *> *views = [_bridge.uiManager valueForKey:@"viewRegistry"];
    NSMutableArray* destinations = [NSMutableArray array];
    for (NSNumber *  tag in destinationTagsValue) {
      RCTTVView *destination = (RCTTVView*)views[tag];
      if (destination != nil) {
        [destinations addObject:destination];
      }
    }
    [self addFocusGuide:destinations];
    self->_destinationTags = destinationTagsValue;

}


- (void)addFocusGuide:(NSArray*)destinations {
  
  UIView *origin = [self reactSuperview];
  if (self.focusGuide == nil) {
    self.focusGuide = [UIFocusGuide new];
    [self addLayoutGuide:self.focusGuide];
    
    [self.focusGuide.widthAnchor constraintEqualToAnchor:origin.widthAnchor].active = YES;
    [self.focusGuide.heightAnchor constraintEqualToAnchor:origin.heightAnchor].active = YES;
    [self.focusGuide.topAnchor constraintEqualToAnchor:origin.topAnchor].active = YES;
    [self.focusGuide.leftAnchor constraintEqualToAnchor:origin.leftAnchor].active = YES;
  }
  
  self.focusGuide.preferredFocusEnvironments = destinations;
}

@end
