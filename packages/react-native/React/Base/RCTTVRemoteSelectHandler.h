#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTTVRemoteSelectHandlerDelegate <NSObject>

- (void)animatePressIn;
- (void)animatePressOut;

- (void)emitPressInEvent;
- (void)emitPressOutEvent;

- (void)sendSelectNotification;
- (void)sendLongSelectBeganNotification;
- (void)sendLongSelectEndedNotification;

@end

@interface RCTTVRemoteSelectHandler : NSObject <UIGestureRecognizerDelegate>

- (instancetype _Nonnull )initWithView:(UIView<RCTTVRemoteSelectHandlerDelegate> * _Nonnull)view;
- (instancetype _Nonnull )init __attribute__((unavailable("init not available, use initWithView:")));

@end

NS_ASSUME_NONNULL_END
