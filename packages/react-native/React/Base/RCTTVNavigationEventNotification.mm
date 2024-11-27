/*
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVNavigationEventNotification.h"
#import "RCTTVNavigationEventNotificationConstants.h"

@implementation NSNotificationCenter (RCTTVNavigationEventNotification)
- (void)postNavigationFocusEventWithTag:(NSNumber * _Nullable)eventTag
                                 target:(NSNumber * _Nullable)eventTarget {
    [self postNavigationEventWithtEventType:@"focus" keyAction:RCTTVRemoteEventKeyActionUnknown tag:eventTag target:eventTarget body:nil];
}

- (void)postNavigationBlurEventWithTag:(NSNumber * _Nullable)eventTag
                                target:(NSNumber * _Nullable)eventTarget {
    [self postNavigationEventWithtEventType:@"blur" keyAction:RCTTVRemoteEventKeyActionUnknown tag:eventTag target:eventTarget body:nil];
}

- (void)postNavigationPressEventWithType:(RCTTVRemoteEvent _Nonnull)eventType
                               keyAction:(RCTTVRemoteEventKeyAction _Nullable)eventKeyAction
                                     tag:(NSNumber * _Nullable)eventTag
                                  target:(NSNumber * _Nullable)eventTarget {

    [self postNavigationEventWithtEventType:eventType keyAction:eventKeyAction tag:eventTag target:eventTarget body:nil];

}

- (void)postNavigationTouchEventWithType:(RCTTVRemoteEvent _Nonnull)eventType
                                    body:(NSDictionary * _Nullable)eventBody {
    [self postNavigationEventWithtEventType:eventType keyAction:nil tag:nil target:nil body:eventBody];

}

#pragma mark - Private

- (void)postNavigationEventWithtEventType:(NSString *)eventType
                                keyAction:(RCTTVRemoteEventKeyAction _Nullable)eventKeyAction
                                      tag:(NSNumber * _Nullable)eventTag
                                   target:(NSNumber * _Nullable)eventTarget
                                     body:(NSDictionary * _Nullable)eventBody

{
    NSMutableDictionary *payload = [@{RCTTVNavigationEventNotificationKeyEventType : eventType} mutableCopy];

    if (eventKeyAction != nil) {
        payload[RCTTVNavigationEventNotificationKeyEventKeyAction] = eventKeyAction;
    }

    if (eventTag != nil) {
        payload[RCTTVNavigationEventNotificationKeyTag] = eventTag;
    }

    if (eventTarget != nil) {
        payload[RCTTVNavigationEventNotificationKeyTarget] = eventTarget;
    }

    if (eventBody != nil && eventBody.count > 0) {
        payload[RCTTVNavigationEventNotificationKeyBody] = eventBody;
    }

    [self postNotificationName:RCTTVNavigationEventNotificationName object:[payload copy]];
}

@end

@implementation UIGestureRecognizer (RCTTVNavigationEventNotification)

- (RCTTVRemoteEventKeyAction _Nullable)eventKeyAction
{
    switch (self.state) {
        case UIGestureRecognizerStateBegan:
            return RCTTVRemoteEventKeyActionDown;
        case UIGestureRecognizerStateEnded:
            return RCTTVRemoteEventKeyActionUp;
        default:
            return nil;
    }
}

- (NSDictionary * _Nonnull)eventState {
    NSString *eventBodyState = self.eventBodyState;
    if (eventBodyState) {
        return @{@"state": eventBodyState};
    }
    else {
        return @{};
    }
}

#pragma mark - Private

- (NSString * _Nullable)eventBodyState {
    switch (self.state) {
        case UIGestureRecognizerStateBegan:
            return @"Began";
        case UIGestureRecognizerStateChanged:
            return @"Changed";
        case UIGestureRecognizerStateEnded:
            return @"Ended";
        default:
            return nil;
    }
}

@end
