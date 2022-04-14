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

NSString *const RCTTVRemoteEventMenu = @"menu";
NSString *const RCTTVRemoteEventPlayPause = @"playPause";
NSString *const RCTTVRemoteEventSelect = @"select";

NSString *const RCTTVRemoteEventLongPlayPause = @"longPlayPause";
NSString *const RCTTVRemoteEventLongSelect = @"longSelect";

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

@property (nonatomic, copy, readonly) NSDictionary *tvRemoteGestureRecognizers;
@property (nonatomic, strong) UITapGestureRecognizer *tvMenuKeyRecognizer;
@property (nonatomic, strong) UIPanGestureRecognizer *tvPanGestureRecognizer;
@property (nonatomic, weak) UIView *view;

@end

@implementation RCTTVRemoteHandler {
  NSMutableDictionary<NSString *, UIGestureRecognizer *> *_tvRemoteGestureRecognizers;
}

#pragma mark -
#pragma mark Static settings for menu key and pan gesture

static __volatile BOOL __useMenuKey = NO;
static __volatile BOOL __usePanGesture = NO;

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

# pragma mark -
# pragma mark Gesture handlers

- (void)playPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventPlayPause];
}

- (void)menuPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventMenu];
}

- (void)selectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSelect];
}

- (void)longPlayPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventLongPlayPause];

#if RCT_DEV
  // If shake to show is enabled on device, use long play/pause event to show dev menu
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTShowDevMenuNotification" object:nil];
#endif
}

- (void)longSelectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventLongSelect];
}

- (void)swipedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeUp];
}

- (void)swipedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeDown];
}

- (void)swipedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeLeft];
}

- (void)swipedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeRight];
}

- (void)tappedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventUp];
}

- (void)tappedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventDown];
}

- (void)tappedPageUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventPageUp];
}

- (void)tappedPageDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventPageDown];
}

- (void)tappedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventLeft];
}

- (void)tappedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventRight];
}

- (void)panned:(UIPanGestureRecognizer *)gesture {
    UIView *rootView = [self view];
    NSString *gestureState = [self recognizerStateToString:gesture.state];
    CGPoint translation = [gesture translationInView:rootView];
    CGPoint velocity = [gesture velocityInView:rootView];

    if (gestureState) {
        [self sendAppleTVEvent:RCTTVRemoteEventPan withBody:@{@"state": gestureState,
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

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addTapGestureRecognizerWithSelector:(nonnull SEL)selector pressType:(UIPressType)pressType name:(NSString *)name
{
  UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[ @(pressType) ];

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addSwipeGestureRecognizerWithSelector:(nonnull SEL)selector
                                    direction:(UISwipeGestureRecognizerDirection)direction
                                         name:(NSString *)name
{
  UISwipeGestureRecognizer *recognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.direction = direction;

  _tvRemoteGestureRecognizers[name] = recognizer;
}

#pragma mark -
#pragma mark Helper methods

- (void)sendAppleTVEvent:(NSString *)eventType
{
    [self sendAppleTVEvent:eventType withBody: nil];
}

- (void)sendAppleTVEvent:(NSString *)eventType
                withBody:(NSDictionary * __nullable)body
{
    NSDictionary *payload = (body != nil) ?
                                @{@"eventType" : eventType, @"body": body} :
                                @{@"eventType" : eventType};

  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTTVNavigationEventNotification"
                                                      object:payload];
}

- (NSString *)recognizerStateToString:(UIGestureRecognizerState)state {
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

@end
