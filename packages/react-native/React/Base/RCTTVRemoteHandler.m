/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTVRemoteHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTRootView.h"
#import "RCTTVNavigationEventEmitter.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

NSString *const RCTTVEnableMenuKeyNotification = @"RCTTVEnableMenuKeyNotification";
NSString *const RCTTVDisableMenuKeyNotification = @"RCTTVDisableMenuKeyNotification";

NSString *const RCTTVEnablePanGestureNotification = @"RCTTVEnablePanGestureNotification";
NSString *const RCTTVDisablePanGestureNotification = @"RCTTVDisablePanGestureNotification";

NSString *const RCTTVEnableGestureHandlersCancelTouchesNotification = @"RCTTVEnableGestureHandlersCancelTouchesNotification";
NSString *const RCTTVDisableGestureHandlersCancelTouchesNotification = @"RCTTVDisableGestureHandlersCancelTouchesNotification";

NSString *const RCTTVRemoteEventMenu = @"menu";
NSString *const RCTTVRemoteEventPlayPause = @"playPause";
NSString *const RCTTVRemoteEventSelect = @"select";

NSString *const RCTTVRemoteEventLongPlayPause = @"longPlayPause";
NSString *const RCTTVRemoteEventLongSelect = @"longSelect";
NSString *const RCTTVRemoteEventLongUp = @"longUp";
NSString *const RCTTVRemoteEventLongDown = @"longDown";
NSString *const RCTTVRemoteEventLongLeft = @"longLeft";
NSString *const RCTTVRemoteEventLongRight = @"longRight";

NSString *const RCTTVRemoteEventLeft = @"left";
NSString *const RCTTVRemoteEventRight = @"right";
NSString *const RCTTVRemoteEventUp = @"up";
NSString *const RCTTVRemoteEventDown = @"down";

NSString *const RCTTVRemoteEventPageUp = @"pageUp";
NSString *const RCTTVRemoteEventPageDown = @"pageDown";

NSString *const RCTTVRemoteEventSwipeLeft = @"swipeLeft";
NSString *const RCTTVRemoteEventSwipeRight = @"swipeRight";
NSString *const RCTTVRemoteEventSwipeUp = @"swipeUp";
NSString *const RCTTVRemoteEventSwipeDown = @"swipeDown";

NSString *const RCTTVRemoteEventPan = @"pan";

@interface RCTTVRemoteHandler()

@property (nonatomic, copy, readonly) NSDictionary<NSString *, UIGestureRecognizer *> *tvRemoteGestureRecognizers;
@property (nonatomic, strong) UITapGestureRecognizer *tvMenuKeyRecognizer;
@property (nonatomic, strong) UIPanGestureRecognizer *tvPanGestureRecognizer;
@property (nonatomic, weak) UIView *view;

@end

@implementation RCTTVRemoteHandler {
  NSMutableDictionary<NSString *, UIGestureRecognizer *> *_tvRemoteGestureRecognizers;
}

static NSNumber * _Nonnull RCTTVRemoteEventKeyActionDown;
static NSNumber * _Nonnull RCTTVRemoteEventKeyActionUp;

#pragma mark -
#pragma mark Static settings for menu key and pan gesture

static __volatile BOOL __useMenuKey = NO;
static __volatile BOOL __usePanGesture = NO;
static __volatile BOOL __gestureHandlersCancelTouches = YES;

+ (void)initialize {
    RCTTVRemoteEventKeyActionDown = @0;
    RCTTVRemoteEventKeyActionUp = @1;
}

+ (BOOL)useMenuKey
{
    return __useMenuKey;
}

+ (void)setUseMenuKey:(BOOL)useMenuKey
{
    __useMenuKey = useMenuKey;
}

+ (BOOL)usePanGesture
{
    return __usePanGesture;
}

+ (void)setUsePanGesture:(BOOL)usePanGesture
{
    __usePanGesture = usePanGesture;
}

+ (BOOL)gestureHandlersCancelTouches
{
    return __gestureHandlersCancelTouches;
}

+ (void)setGestureHandlersCancelTouches:(BOOL)cancelTouches
{
    __gestureHandlersCancelTouches = cancelTouches;
}

#pragma mark -
#pragma mark Public methods

- (instancetype)initWithView:(UIView *)view
{
  if ((self = [super init])) {
      _view = view;
      [self setUpGestureRecognizers];
      [self attachToView];
  }
  return self;
}

- (void)dealloc
{
    [self detachFromView];
}

#pragma mark -
#pragma mark Private methods

- (void)setUpGestureRecognizers
{
    _tvRemoteGestureRecognizers = [NSMutableDictionary dictionary];
  // Recognizers for Apple TV remote buttons

  // Menu recognizer
  self.tvMenuKeyRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(menuPressed:)];
  self.tvMenuKeyRecognizer.allowedPressTypes = @[@(UIPressTypeMenu)];

  // Pan gesture recognizer
  self.tvPanGestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(panned:)];
  self.tvPanGestureRecognizer.cancelsTouchesInView = __gestureHandlersCancelTouches;

  // Play/Pause
  [self addTapGestureRecognizerWithSelector:@selector(playPausePressed:)
                                  pressType:UIPressTypePlayPause
                                       name:RCTTVRemoteEventPlayPause];

  // Select
  [self addTapGestureRecognizerWithSelector:@selector(selectPressed:)
                                  pressType:UIPressTypeSelect
                                       name:RCTTVRemoteEventSelect];
    
  // Page Up/Down
  if (@available(tvOS 14.3, *)) {
      [self addTapGestureRecognizerWithSelector:@selector(tappedPageUp:)
                                      pressType:UIPressTypePageUp
                                           name:RCTTVRemoteEventPageUp];
        
      [self addTapGestureRecognizerWithSelector:@selector(tappedPageDown:)
                                      pressType:UIPressTypePageDown
                                           name:RCTTVRemoteEventPageDown];
  }

  // Up
  [self addTapGestureRecognizerWithSelector:@selector(tappedUp:)
                                  pressType:UIPressTypeUpArrow
                                       name:RCTTVRemoteEventUp];

  // Down
  [self addTapGestureRecognizerWithSelector:@selector(tappedDown:)
                                  pressType:UIPressTypeDownArrow
                                       name:RCTTVRemoteEventDown];

  // Left
  [self addTapGestureRecognizerWithSelector:@selector(tappedLeft:)
                                  pressType:UIPressTypeLeftArrow
                                       name:RCTTVRemoteEventLeft];

  // Right
  [self addTapGestureRecognizerWithSelector:@selector(tappedRight:)
                                  pressType:UIPressTypeRightArrow
                                       name:RCTTVRemoteEventRight];

  // Recognizers for long button presses
  // We don't intercept long menu press -- that's used by the system to go to the home screen

  [self addLongPressGestureRecognizerWithSelector:@selector(longPlayPausePressed:)
                                        pressType:UIPressTypePlayPause
                                             name:RCTTVRemoteEventLongPlayPause];

  [self addLongPressGestureRecognizerWithSelector:@selector(longSelectPressed:)
                                        pressType:UIPressTypeSelect
                                             name:RCTTVRemoteEventLongSelect];

  [self addLongPressGestureRecognizerWithSelector:@selector(longUpPressed:)
                                        pressType:UIPressTypeUpArrow
                                             name:RCTTVRemoteEventLongUp];

  [self addLongPressGestureRecognizerWithSelector:@selector(longDownPressed:)
                                        pressType:UIPressTypeDownArrow
                                             name:RCTTVRemoteEventLongDown];

  [self addLongPressGestureRecognizerWithSelector:@selector(longLeftPressed:)
                                        pressType:UIPressTypeLeftArrow
                                             name:RCTTVRemoteEventLongLeft];

  [self addLongPressGestureRecognizerWithSelector:@selector(longRightPressed:)
                                        pressType:UIPressTypeRightArrow
                                             name:RCTTVRemoteEventLongRight];

  // Recognizers for Apple TV remote trackpad swipes

  // Up
  [self addSwipeGestureRecognizerWithSelector:@selector(swipedUp:)
                                    direction:UISwipeGestureRecognizerDirectionUp
                                         name:RCTTVRemoteEventSwipeUp];

  // Down
  [self addSwipeGestureRecognizerWithSelector:@selector(swipedDown:)
                                    direction:UISwipeGestureRecognizerDirectionDown
                                         name:RCTTVRemoteEventSwipeDown];

  // Left
  [self addSwipeGestureRecognizerWithSelector:@selector(swipedLeft:)
                                    direction:UISwipeGestureRecognizerDirectionLeft
                                         name:RCTTVRemoteEventSwipeLeft];

  // Right
  [self addSwipeGestureRecognizerWithSelector:@selector(swipedRight:)
                                    direction:UISwipeGestureRecognizerDirectionRight
                                         name:RCTTVRemoteEventSwipeRight];
}

- (void)attachToView
{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(enableTVMenuKey)
                                                 name:RCTTVEnableMenuKeyNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(disableTVMenuKey)
                                                 name:RCTTVDisableMenuKeyNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(enableTVPanGesture)
                                                 name:RCTTVEnablePanGestureNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(disableTVPanGesture)
                                                 name:RCTTVDisablePanGestureNotification
                                               object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(enableGestureHandlersCancelTouches)
                                               name:RCTTVEnableGestureHandlersCancelTouchesNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(disableGestureHandlersCancelTouches)
                                               name:RCTTVDisableGestureHandlersCancelTouchesNotification
                                             object:nil];


    for (NSString *key in [self.tvRemoteGestureRecognizers allKeys]) {
      [_view addGestureRecognizer:self.tvRemoteGestureRecognizers[key]];
    }
    if ([RCTTVRemoteHandler useMenuKey]) {
        [self enableTVMenuKey];
    } else {
        [self disableTVMenuKey];
    }
    if ([RCTTVRemoteHandler usePanGesture]) {
        [self enableTVPanGesture];
    } else {
        [self disableTVPanGesture];
    }
}

- (void)detachFromView
{
    if ([[self.view gestureRecognizers] containsObject:self.tvMenuKeyRecognizer]) {
        [self.view removeGestureRecognizer:self.tvMenuKeyRecognizer];
    }
    if ([[self.view gestureRecognizers] containsObject:self.tvPanGestureRecognizer]) {
        [self.view removeGestureRecognizer:self.tvPanGestureRecognizer];
    }
    for (NSString *key in [self.tvRemoteGestureRecognizers allKeys]) {
      [_view removeGestureRecognizer:self.tvRemoteGestureRecognizers[key]];
    }
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:RCTTVEnableMenuKeyNotification
                                                  object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:RCTTVDisableMenuKeyNotification
                                                  object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:RCTTVEnablePanGestureNotification
                                                  object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:RCTTVDisablePanGestureNotification
                                                  object:nil];

}

# pragma mark -
# pragma mark Notification handlers

- (void)enableTVMenuKey
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (![[self.view gestureRecognizers] containsObject:self.tvMenuKeyRecognizer]) {
            [self.view addGestureRecognizer:self.tvMenuKeyRecognizer];
        }
    });
}

- (void)disableTVMenuKey
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([[self.view gestureRecognizers] containsObject:self.tvMenuKeyRecognizer]) {
            [self.view removeGestureRecognizer:self.tvMenuKeyRecognizer];
        }
    });
}

- (void)enableTVPanGesture
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (![[self.view gestureRecognizers] containsObject:self.tvPanGestureRecognizer]) {
            [self.view addGestureRecognizer:self.tvPanGestureRecognizer];
        }
    });
}

- (void)disableTVPanGesture
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([[self.view gestureRecognizers] containsObject:self.tvPanGestureRecognizer]) {
            [self.view removeGestureRecognizer:self.tvPanGestureRecognizer];
        }
    });
}

- (void)enableGestureHandlersCancelTouches
{
  dispatch_async(dispatch_get_main_queue(), ^{
    for (NSString *name in [self.tvRemoteGestureRecognizers allKeys]) {
      self.tvRemoteGestureRecognizers[name].cancelsTouchesInView = YES;
    }
    [self.tvMenuKeyRecognizer setCancelsTouchesInView:YES];
    [self.tvPanGestureRecognizer setCancelsTouchesInView:YES];
  });
}

- (void)disableGestureHandlersCancelTouches
{
  dispatch_async(dispatch_get_main_queue(), ^{
    for (NSString *name in [self.tvRemoteGestureRecognizers allKeys]) {
      self.tvRemoteGestureRecognizers[name].cancelsTouchesInView = NO;
    }
    [self.tvMenuKeyRecognizer setCancelsTouchesInView:NO];
    [self.tvPanGestureRecognizer setCancelsTouchesInView:NO];
  });
}

# pragma mark -
# pragma mark Gesture handlers

- (void)playPausePressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventPlayPause eventKeyAction:eventKeyAction];
}

- (void)menuPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventMenu eventKeyAction:eventKeyAction];
}

- (void)selectPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventSelect eventKeyAction:eventKeyAction];
}

- (void)longPlayPausePressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLongPlayPause eventKeyAction:eventKeyAction];

#if RCT_DEV
  // If shake to show is enabled on device, use long play/pause event to show dev menu
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTShowDevMenuNotification" object:nil];
#endif
}

- (void)longSelectPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLongSelect eventKeyAction:eventKeyAction];
}

- (void)longUpPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLongUp eventKeyAction:eventKeyAction];
}

- (void)longDownPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLongDown eventKeyAction:eventKeyAction];
}

- (void)longLeftPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLongLeft eventKeyAction:eventKeyAction];
}

- (void)longRightPressed:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLongRight eventKeyAction:eventKeyAction];
}

- (void)swipedUp:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeUp eventKeyAction:eventKeyAction];
}

- (void)swipedDown:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeDown eventKeyAction:eventKeyAction];
}

- (void)swipedLeft:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeLeft eventKeyAction:eventKeyAction];
}

- (void)swipedRight:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeRight eventKeyAction:eventKeyAction];
}

- (void)tappedUp:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventUp eventKeyAction:eventKeyAction];
}

- (void)tappedDown:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventDown eventKeyAction:eventKeyAction];
}

- (void)tappedPageUp:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventPageUp eventKeyAction:eventKeyAction];
}

- (void)tappedPageDown:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventPageDown eventKeyAction:eventKeyAction];
}

- (void)tappedLeft:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventLeft eventKeyAction:eventKeyAction];
}

- (void)tappedRight:(UIGestureRecognizer *)r
{
  NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:r];
  [self sendAppleTVEvent:RCTTVRemoteEventRight eventKeyAction:eventKeyAction];
}

- (void)panned:(UIPanGestureRecognizer *)gesture {
    UIView *rootView = [self view];
    NSString *gestureState = [self recognizerStateToString:gesture.state];
    CGPoint translation = [gesture translationInView:rootView];
    CGPoint velocity = [gesture velocityInView:rootView];

    if (gestureState) {
        NSNumber *eventKeyAction = [self eventKeyActionForGestureRecognizer:gesture];
        [self sendAppleTVEvent:RCTTVRemoteEventPan
                eventKeyAction:eventKeyAction
                          body:@{@"state": gestureState,
                                 @"x": [NSNumber numberWithInt:translation.x],
                                 @"y": [NSNumber numberWithInt:translation.y],
                                 @"velocityX": [NSNumber numberWithFloat:velocity.x],
                                 @"velocityY": [NSNumber numberWithFloat:velocity.y],
                               }];
    }
}

#pragma mark -
#pragma mark Convenience methods for adding gesture recognizers

- (void)addLongPressGestureRecognizerWithSelector:(nonnull SEL)selector
                                        pressType:(UIPressType)pressType
                                             name:(NSString *)name
{
  UILongPressGestureRecognizer *recognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[ @(pressType) ];
  recognizer.cancelsTouchesInView = __gestureHandlersCancelTouches;

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addTapGestureRecognizerWithSelector:(nonnull SEL)selector pressType:(UIPressType)pressType name:(NSString *)name
{
  UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[ @(pressType) ];
  recognizer.cancelsTouchesInView = __gestureHandlersCancelTouches;

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addSwipeGestureRecognizerWithSelector:(nonnull SEL)selector
                                    direction:(UISwipeGestureRecognizerDirection)direction
                                         name:(NSString *)name
{
  UISwipeGestureRecognizer *recognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.direction = direction;
  recognizer.cancelsTouchesInView = __gestureHandlersCancelTouches;

  _tvRemoteGestureRecognizers[name] = recognizer;
}

#pragma mark -
#pragma mark Helper methods

- (void)sendAppleTVEvent:(NSString *)eventType eventKeyAction:(NSNumber * __nullable)eventKeyAction
{
    [self sendAppleTVEvent:eventType eventKeyAction:eventKeyAction body: nil];
}

- (void)sendAppleTVEvent:(NSString *)eventType
          eventKeyAction:(NSNumber * __nullable)eventKeyAction
                    body:(NSDictionary * __nullable)body
{
    NSMutableDictionary *payload = [@{@"eventType" : eventType} mutableCopy];

    if (eventKeyAction != nil) {
        payload[@"eventKeyAction"] = eventKeyAction;
    }

    if (body != nil) {
        payload[@"body"] = body;
    }

    [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTTVNavigationEventNotification"
                                                        object:[payload copy]];
}

- (NSString * __nullable)recognizerStateToString:(UIGestureRecognizerState)state {
    switch (state) {
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

- (NSNumber * __nullable)eventKeyActionForGestureRecognizer:(UIGestureRecognizer * _Nonnull)gestureRecognizer
{
    UIGestureRecognizerState state = gestureRecognizer.state;
    switch (state) {
        case UIGestureRecognizerStateBegan:
            return RCTTVRemoteEventKeyActionDown;
        case UIGestureRecognizerStateEnded:
            return RCTTVRemoteEventKeyActionUp;
        case UIGestureRecognizerStatePossible:
            return nil;
        case UIGestureRecognizerStateChanged:
            return nil;
        case UIGestureRecognizerStateCancelled:
            return nil;
        case UIGestureRecognizerStateFailed:
            return nil;
    }
}
@end
