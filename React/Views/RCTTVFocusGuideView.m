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
    _needsUpdateView = YES;
    _bridge = bridge;
    [_bridge.uiManager.observerCoordinator addObserver:self];
  }
  return self;
}

- (void)invalidate {
  [_bridge.uiManager.observerCoordinator removeObserver:self];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps {
  _needsUpdateView = YES;
  [super didSetProps:changedProps];
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused RCTUIManager *)uiManager {
  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;
  
  [_bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    NSMutableArray* destinations = [NSMutableArray array];
    for (NSNumber *  tag in self.destinationTags) {
      RCTTVView *destination = (RCTTVView*)viewRegistry[tag];
      if (destination != nil) {
        [destinations addObject:destination];
      }
    }
    [self addFocusGuide:destinations];
  }];
}

- (void)addFocusGuide:(NSArray*)destinations {
  
  UIView *origin = self;
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
