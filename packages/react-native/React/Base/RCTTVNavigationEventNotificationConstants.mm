/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVNavigationEventNotificationConstants.h"

NSString *const RCTTVNavigationEventNotificationName = @"RCTTVNavigationEventNotification";

RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyEventType = @"eventType";
RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyEventKeyAction = @"eventKeyAction";
RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyTag = @"tag";
RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyTarget = @"target";
RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyBody = @"body";

RCTTVRemoteEventKeyAction _Nonnull const RCTTVRemoteEventKeyActionUnknown = @(-1);
RCTTVRemoteEventKeyAction _Nonnull const RCTTVRemoteEventKeyActionDown = @(0);
RCTTVRemoteEventKeyAction _Nonnull const RCTTVRemoteEventKeyActionUp = @(1);
