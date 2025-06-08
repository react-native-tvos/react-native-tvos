/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootComponentView.h"

#import <React/RCTRootView.h>
#import <react/renderer/components/root/RootComponentDescriptor.h>
#import <react/renderer/components/root/RootProps.h>
#import "RCTConversions.h"

using namespace facebook::react;

@implementation RCTRootComponentView {
  BOOL _contentHasAppeared;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = RootShadowNode::defaultSharedProps();
    _contentHasAppeared = NO;
  }

  return self;
}

#if TARGET_OS_TV
- (NSArray<id<UIFocusEnvironment>> *)preferredFocusEnvironments {
  if (self.reactPreferredFocusEnvironments != nil) {
    NSArray<id<UIFocusEnvironment>> *tempReactPreferredFocusEnvironments = self.reactPreferredFocusEnvironments;
    self.reactPreferredFocusEnvironments = nil;
    return tempReactPreferredFocusEnvironments;
  }

  if (self.reactPreferredFocusedView && self.reactPreferredFocusedView.window != nil) {
    return @[self.reactPreferredFocusedView];
  }
  return [super preferredFocusEnvironments];
}
#endif


#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _contentHasAppeared = NO;
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  if (!self->_contentHasAppeared) {
    self->_contentHasAppeared = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTContentDidAppearNotification object:self];
    });
  }
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RootComponentDescriptor>();
}

@end
