//
//  RCTTVFocusGuideView.h
//  React
//
//  Created by Alain Hufkens on 12/06/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTTVView.h"
#import <React/RCTView.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <yoga/Yoga.h>

@interface RCTTVFocusGuideView : RCTTVView <RCTUIManagerObserver>

@property (nonatomic, strong) NSArray * destinationTags;
@property (nonatomic, strong) UIFocusGuide * focusGuide;

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end
