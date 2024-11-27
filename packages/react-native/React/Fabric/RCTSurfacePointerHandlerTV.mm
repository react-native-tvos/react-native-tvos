/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePointerHandler.h"

#import <React/RCTIdentifierPool.h>
#import <React/RCTReactTaggedView.h>
#import <React/RCTUtils.h>
#import <React/RCTViewComponentView.h>

#import "RCTConversions.h"
#import "RCTTouchableComponentViewProtocol.h"

@interface RCTSurfacePointerHandler () <UIGestureRecognizerDelegate>
@end

// The touch handler should not be active on tvOS, so tvOS uses this
// stub implementation that does nothing.
// Fixes https://github.com/react-native-tvos/react-native-tvos/issues/595
//
@implementation RCTSurfacePointerHandler

- (instancetype)init
{
  return [super initWithTarget:nil action:nil];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(UIView *)view {}
- (void)detachFromView:(UIView *)view {}

@end
