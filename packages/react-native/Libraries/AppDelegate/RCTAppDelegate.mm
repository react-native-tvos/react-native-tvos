/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppDelegate.h"
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTHost.h>
#include <UIKit/UIKit.h>
#import <objc/runtime.h>
#import "RCTAppSetupUtils.h"
#import "RCTDependencyProvider.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <react/nativemodule/defaults/DefaultTurboModules.h>

using namespace facebook::react;

@implementation RCTAppDelegate

- (instancetype)init
{
  if (self = [super init]) {
    _automaticallyLoadReactNativeWindow = YES;
  }
  return self;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];

  if (self.automaticallyLoadReactNativeWindow) {
    [self loadReactNativeWindow:launchOptions];
  }

  return YES;
}

- (void)loadReactNativeWindow:(NSDictionary *)launchOptions
{
  UIView *rootView = [self.rootViewFactory viewWithModuleName:self.moduleName
                                            initialProperties:self.initialProps
                                                launchOptions:launchOptions];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [self createRootViewController];
  [self setRootView:rootView toRootViewController:rootViewController];
  _window.rootViewController = rootViewController;
#if TARGET_OS_TV
  UIUserInterfaceStyle style = rootViewController.traitCollection.userInterfaceStyle;
  if (style == UIUserInterfaceStyleDark) {
    rootView.backgroundColor = [UIColor colorWithRed:0.0 green:0.0 blue:0.0 alpha:1.0];
  } else {
    rootView.backgroundColor = [UIColor colorWithRed:1.0 green:1.0 blue:1.0 alpha:1.0];
  }
#endif
  [_window makeKeyAndVisible];
}

- (RCTRootViewFactory *)rootViewFactory
{
  return self.reactNativeFactory.rootViewFactory;
}

- (RCTBridge *)bridge
{
  return self.rootViewFactory.bridge;
}

- (RCTSurfacePresenterBridgeAdapter *)bridgeAdapter
{
  return self.rootViewFactory.bridgeAdapter;
}

- (void)setBridge:(RCTBridge *)bridge
{
  self.reactNativeFactory.rootViewFactory.bridge = bridge;
}

- (void)setBridgeAdapter:(RCTSurfacePresenterBridgeAdapter *)bridgeAdapter
{
  self.reactNativeFactory.rootViewFactory.bridgeAdapter = bridgeAdapter;
}

@end
