//
//  RCTTVMenuBridge.m
//
//  Created by Douglas Lowder on 6/4/19.
//

#import "RCTTVMenuBridge.h"
#import <React/RCTRootView.h>
#import <React/RCTTVRemoteHandler.h>

@implementation RCTTVMenuBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(enableTVMenuKey)
{
    [RCTTVRemoteHandler setUseMenuKey:YES];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVEnableMenuKeyNotification object:nil];
}

RCT_EXPORT_METHOD(disableTVMenuKey)
{
    [RCTTVRemoteHandler setUseMenuKey:NO];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVDisableMenuKeyNotification object:nil];
}

@end
