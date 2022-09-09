/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostViewController.h"

#import "RCTLog.h"
#import "RCTModalHostView.h"

@implementation RCTModalHostViewController {
  CGRect _lastViewFrame;
#if !TARGET_OS_TV
  UIStatusBarStyle _preferredStatusBarStyle;
  BOOL _preferredStatusBarHidden;
#endif
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13.0, tvOS 13.0, *)) {
    self.modalInPresentation = YES;
  }
#endif

#if !TARGET_OS_TV
  _preferredStatusBarStyle = [RCTSharedApplication() statusBarStyle];
  _preferredStatusBarHidden = [RCTSharedApplication() isStatusBarHidden];
#endif

  return self;
}

- (void)viewDidAppear:(BOOL)animated
{
#if TARGET_OS_TV
  [self.modalHostView enableEventHandlers];
#endif
}

- (void)viewWillDisappear:(BOOL)animated
{
#if TARGET_OS_TV
  [self.modalHostView disableEventHandlers];
  if (self.modalHostView.onRequestClose) {
    self.modalHostView.onRequestClose(nil);
  }
#endif
}

- (void)viewDidDisappear:(BOOL)animated
{
#if TARGET_OS_TV
  if (self.modalHostView.onDismiss) {
    self.modalHostView.onDismiss(nil);
  }
#endif
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (self.boundsDidChangeBlock && !CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    self.boundsDidChangeBlock(self.view.bounds);
    _lastViewFrame = self.view.frame;
  }
}

#if !TARGET_OS_TV
- (UIStatusBarStyle)preferredStatusBarStyle
{
  return _preferredStatusBarStyle;
}

- (BOOL)prefersStatusBarHidden
{
  return _preferredStatusBarHidden;
}

#if RCT_DEV
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:[RCTSharedApplication() keyWindow]];
  if (!(_supportedInterfaceOrientations & appSupportedOrientationsMask)) {
    RCTLogError(
        @"Modal was presented with 0x%x orientations mask but the application only supports 0x%x."
        @"Add more interface orientations to your app's Info.plist to fix this."
        @"NOTE: This will crash in non-dev mode.",
        (unsigned)_supportedInterfaceOrientations,
        (unsigned)appSupportedOrientationsMask);
    return UIInterfaceOrientationMaskAll;
  }

  return _supportedInterfaceOrientations;
}
#endif // RCT_DEV
#endif // !TARGET_OS_TV

@end
