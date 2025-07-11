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
#endif
  BOOL _preferredStatusBarHidden;
}

- (instancetype)init
{
  if (!(self = [super init])) {
    return nil;
  }


#if !TARGET_OS_TV
  _preferredStatusBarStyle = [RCTUIStatusBarManager() statusBarStyle];
  _preferredStatusBarHidden = [RCTUIStatusBarManager() isStatusBarHidden];
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

#if RCT_DEV && TARGET_OS_IOS
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:RCTKeyWindow()];
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
#endif // TARGET_OS_TV

@end
