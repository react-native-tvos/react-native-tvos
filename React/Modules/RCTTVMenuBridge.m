//
//  RCTTVMenuBridge.m
//
//  Created by Douglas Lowder on 6/4/19.
//

#import "RCTTVMenuBridge.h"
#import <React/RCTRootView.h>
#import "RCTTVRemoteHandler.h"

@implementation RCTTVMenuBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(enableTVMenuKey)
{
    [RCTTVRemoteHandler instance].useMenuKey = YES;
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVEnableMenuKeyNotification object:nil];
}

RCT_EXPORT_METHOD(disableTVMenuKey)
{
    [RCTTVRemoteHandler instance].useMenuKey = NO;
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTTVDisableMenuKeyNotification object:nil];
}

@end
