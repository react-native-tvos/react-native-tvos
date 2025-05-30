/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTLog.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTRootContentView.h"
#import "RCTRootViewDelegate.h"
#import "RCTSurface.h"
#import "UIView+React.h"

#if TARGET_OS_TV
#import <React/RCTTVNavigationEventNotification.h>
#endif

static RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(RCTRootViewSizeFlexibility sizeFlexibility)
{
  switch (sizeFlexibility) {
    case RCTRootViewSizeFlexibilityWidthAndHeight:
      return RCTSurfaceSizeMeasureModeWidthUndefined | RCTSurfaceSizeMeasureModeHeightUndefined;
    case RCTRootViewSizeFlexibilityWidth:
      return RCTSurfaceSizeMeasureModeWidthUndefined | RCTSurfaceSizeMeasureModeHeightExact;
    case RCTRootViewSizeFlexibilityHeight:
      return RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightUndefined;
    case RCTRootViewSizeFlexibilityNone:
      return RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(RCTSurfaceSizeMeasureMode sizeMeasureMode)
{
  switch (sizeMeasureMode) {
    case RCTSurfaceSizeMeasureModeWidthUndefined | RCTSurfaceSizeMeasureModeHeightUndefined:
      return RCTRootViewSizeFlexibilityWidthAndHeight;
    case RCTSurfaceSizeMeasureModeWidthUndefined | RCTSurfaceSizeMeasureModeHeightExact:
      return RCTRootViewSizeFlexibilityWidth;
    case RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightUndefined:
      return RCTRootViewSizeFlexibilityHeight;
    case RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return RCTRootViewSizeFlexibilityNone;
  }
}

@implementation RCTSurfaceHostingProxyRootView

- (instancetype)initWithSurface:(id<RCTSurfaceProtocol>)surface
{
  return [super initWithSurface:surface
                sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

#if TARGET_OS_TV

- (void)dealloc
{
  self.tvRemoteHandler = nil;
  self.tvRemoteSelectHandler = nil;
}

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

#pragma mark -
#pragma mark RCTTVRemoteSelectHandlerDelegate methods

- (void)animatePressIn {
}

- (void)animatePressOut {
}

- (void)emitPressInEvent {
}

- (void)emitPressOutEvent {
}

- (void)sendSelectNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventSelect keyAction:RCTTVRemoteEventKeyActionUp tag:self.reactTag target:self.reactTag];
}

- (void)sendLongSelectBeganNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventLongSelect keyAction:RCTTVRemoteEventKeyActionDown tag:self.reactTag target:self.reactTag];
}

- (void)sendLongSelectEndedNotification
{
    [[NSNotificationCenter defaultCenter] postNavigationPressEventWithType:RCTTVRemoteEventLongSelect keyAction:RCTTVRemoteEventKeyActionUp tag:self.reactTag target:self.reactTag];
}
#endif


#pragma mark proxy methods to RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)view
{
  return (UIView *)super.surface.view;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)reactTag
{
  return super.surface.rootViewTag;
}

- (RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(RCTRootViewSizeFlexibility)sizeFlexibility
{
  super.sizeMeasureMode = convertToSurfaceSizeMeasureMode(sizeFlexibility);
}

- (NSDictionary *)appProperties
{
  return super.surface.properties;
}

- (void)setAppProperties:(NSDictionary *)appProperties
{
  [super.surface setProperties:appProperties];
}

- (UIView *)loadingView
{
  return super.activityIndicatorViewFactory ? super.activityIndicatorViewFactory() : nil;
}

- (void)setLoadingView:(UIView *)loadingView
{
  super.activityIndicatorViewFactory = ^UIView *(void) {
    return loadingView;
  };
}

#pragma mark RCTSurfaceDelegate proxying

- (void)surface:(RCTSurface *)surface didChangeStage:(RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
#if TARGET_OS_TV
     self.tvRemoteHandler = [[RCTTVRemoteHandler alloc] initWithView:[self contentView]];
     self.tvRemoteSelectHandler = [[RCTTVRemoteSelectHandler alloc] initWithView:self];
#endif
    });
  }
}

- (void)surface:(RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)reactViewController
{
  return _reactViewController ?: [super reactViewController];
}

- (void)setMinimumSize:(CGSize)minimumSize
{
  if (!CGSizeEqualToSize(minimumSize, CGSizeZero)) {
    // TODO (T93859532): Investigate implementation for this.
    RCTLogError(@"RCTSurfaceHostingProxyRootView does not support changing the deprecated minimumSize");
  }
  _minimumSize = CGSizeZero;
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end
