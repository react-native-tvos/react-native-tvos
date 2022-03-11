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

@interface RCTTVRemoteHandler()

@property (nonatomic, copy, readonly) NSDictionary *tvRemoteGestureRecognizers;
@property (nonatomic, strong) UITapGestureRecognizer *tvMenuKeyRecognizer;
@property (nonatomic, weak) UIView *view;

@end

@implementation RCTTVRemoteHandler {
  NSMutableDictionary<NSString *, UIGestureRecognizer *> *_tvRemoteGestureRecognizers;
}

#pragma mark -
#pragma mark Static setting for using menu key

static __volatile BOOL __useMenuKey = NO;

+ (BOOL)useMenuKey
{
    return __useMenuKey;
}

+ (void)setUseMenuKey:(BOOL)useMenuKey
{
    __useMenuKey = useMenuKey;
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
    for (NSString *key in [self.tvRemoteGestureRecognizers allKeys]) {
      [_view addGestureRecognizer:self.tvRemoteGestureRecognizers[key]];
    }
    if ([RCTTVRemoteHandler useMenuKey]) {
        [self enableTVMenuKey];
    } else {
        [self disableTVMenuKey];
    }
}

- (void)detachFromView
{
    if ([[self.view gestureRecognizers] containsObject:self.tvMenuKeyRecognizer]) {
        [self.view removeGestureRecognizer:self.tvMenuKeyRecognizer];
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

# pragma mark -
# pragma mark Gesture handlers

- (void)playPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventPlayPause toView:r.view];
}

- (void)menuPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventMenu toView:r.view];
}

- (void)selectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSelect toView:r.view];
}

- (void)longPlayPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventLongPlayPause toView:r.view];

#if RCT_DEV
  // If shake to show is enabled on device, use long play/pause event to show dev menu
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTShowDevMenuNotification" object:nil];
#endif
}

- (void)longSelectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventLongSelect toView:r.view];
}

- (void)swipedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeUp toView:r.view];
}

- (void)swipedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeDown toView:r.view];
}

- (void)swipedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeLeft toView:r.view];
}

- (void)swipedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventSwipeRight toView:r.view];
}

- (void)tappedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventUp toView:r.view];
}

- (void)tappedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventDown toView:r.view];
}

- (void)tappedPageUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventPageUp toView:r.view];
}

- (void)tappedPageDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventPageDown toView:r.view];
}

- (void)tappedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventLeft toView:r.view];
}

- (void)tappedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:RCTTVRemoteEventRight toView:r.view];
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

- (void)sendAppleTVEvent:(NSString *)eventType toView:(__unused UIView *)v
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTTVNavigationEventNotification"
                                                      object:@{@"eventType" : eventType}];
}

@end
