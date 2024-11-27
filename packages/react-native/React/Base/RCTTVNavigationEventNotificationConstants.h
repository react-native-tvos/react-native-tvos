/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCTTVNavigationEventNotificationConstants_h
#define RCTTVNavigationEventNotificationConstants_h

#import <Foundation/Foundation.h>

extern NSString * _Nonnull const RCTTVNavigationEventNotificationName;

typedef NSString *RCTTVNavigationEventNotificationKey NS_TYPED_ENUM;
extern RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyEventType;
extern RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyEventKeyAction;
extern RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyTag;
extern RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyTarget;
extern RCTTVNavigationEventNotificationKey _Nonnull const RCTTVNavigationEventNotificationKeyBody;

typedef NSNumber *RCTTVRemoteEventKeyAction NS_TYPED_ENUM;
extern RCTTVRemoteEventKeyAction _Nonnull const RCTTVRemoteEventKeyActionUnknown;
extern RCTTVRemoteEventKeyAction _Nonnull const RCTTVRemoteEventKeyActionDown;
extern RCTTVRemoteEventKeyAction _Nonnull const RCTTVRemoteEventKeyActionUp;

#endif /* RCTTVNavigationEventNotificationConstants_h */
