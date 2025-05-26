/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCTTVNavigationEventNotification_h
#define RCTTVNavigationEventNotification_h

#import <Foundation/Foundation.h>
#import "RCTTVNavigationEventNotificationConstants.h"
#import "RCTTVRemoteHandlerConstants.h"

@interface NSNotificationCenter (RCTTVNavigationEventNotification)

- (void)postNavigationFocusEventWithTag:(NSNumber * _Nullable)eventTag
                                 target:(NSNumber * _Nullable)eventTarget;

- (void)postNavigationBlurEventWithTag:(NSNumber * _Nullable)eventTag
                                target:(NSNumber * _Nullable)eventTarget;

- (void)postNavigationPressEventWithType:(RCTTVRemoteEvent _Nonnull)eventType
                               keyAction:(RCTTVRemoteEventKeyAction _Nullable)eventKeyAction
                                     tag:(NSNumber * _Nullable)eventTag
                                  target:(NSNumber * _Nullable)eventTarget;

- (void)postNavigationTouchEventWithType:(RCTTVRemoteEvent _Nonnull)eventType
                                    body:(NSDictionary * _Nullable)eventBody;
@end

@interface UIGestureRecognizer (RCTTVNavigationEventNotification)

@property (readonly, nullable) RCTTVRemoteEventKeyAction eventKeyAction;
@property (readonly, nonnull) NSDictionary *eventState;

@end

#endif /* RCTTVNavigationEventNotification_h */
