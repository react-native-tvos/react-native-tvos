#import "RCTTVRemoteSelectHandler.h"

@interface RCTTVRemoteSelectHandler()

@property (nonatomic, strong) UILongPressGestureRecognizer * pressRecognizer;
@property (nonatomic, strong) UILongPressGestureRecognizer * longPressRecognizer;

@property (nonatomic, weak) UIView<RCTTVRemoteSelectHandlerDelegate> *view;

@end

@implementation RCTTVRemoteSelectHandler {
  NSMutableDictionary<NSString *, UIGestureRecognizer *> *_tvRemoteGestureRecognizers;
}

#pragma mark -
#pragma mark Public methods

- (instancetype)initWithView:(UIView <RCTTVRemoteSelectHandlerDelegate> *)view
{
  if ((self = [super init])) {
      _view = view;
      [self attachToView];
  }
  return self;
}

- (void)dealloc
{
  [self detachFromView];
  _view = nil;
}

#pragma mark -
#pragma UIGestureRecognizerDelegate method

// Press recognizer should allow long press recognizer to work (but not the reverse)
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
  return gestureRecognizer == _pressRecognizer;
}

#pragma mark -
#pragma mark Private methods

- (void)attachToView {
  UILongPressGestureRecognizer *pressRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handlePress:)];
  pressRecognizer.allowedPressTypes = @[ @(UIPressTypeSelect) ];
  pressRecognizer.minimumPressDuration = 0.0;
  pressRecognizer.delegate = self; // Press recognizer allows other recognizers to run

  [self.view addGestureRecognizer:pressRecognizer];
  self.pressRecognizer = pressRecognizer;

  UILongPressGestureRecognizer *longPressRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handleLongPress:)];
  longPressRecognizer.allowedPressTypes = @[ @(UIPressTypeSelect) ];
  longPressRecognizer.minimumPressDuration = 0.5;

  [self.view addGestureRecognizer:longPressRecognizer];
  self.longPressRecognizer = longPressRecognizer;
}

- (void)detachFromView {
  if (_pressRecognizer) {
    [self.view removeGestureRecognizer:_pressRecognizer];
    self.pressRecognizer = nil;
  }
  if (_longPressRecognizer) {
    [self.view removeGestureRecognizer:_longPressRecognizer];
    self.longPressRecognizer = nil;
  }
}

- (void)handlePress:(UIGestureRecognizer *)r
{
  switch (r.state) {
    case UIGestureRecognizerStateBegan:
      [self.view emitPressInEvent];
      [self.view animatePressIn];
      break;
    case UIGestureRecognizerStateCancelled:
    case UIGestureRecognizerStateEnded:
      if (r.enabled) {
        [self.view animatePressOut];
        [self.view emitPressOutEvent];
        [self.view sendSelectNotification];
      }
      break;
    default:
      break;
  }
}

/*
 When a long press starts, the press recognizer has already started
 and called selectGestureBegan(). We disable the press recognizer
 when the long press starts. At the end of the gesture, we execute the
 code for pressOut (since the press recognizer cannot), and then reenable
 the press recgonizer. This guarantees
 only one pressIn and one pressOut, and only longSelect notifications.
 */
- (void)handleLongPress:(UIGestureRecognizer *)r
{
  switch (r.state) {
    case UIGestureRecognizerStateBegan:
      self.pressRecognizer.enabled = NO;
      [self.view sendLongSelectBeganNotification];
      break;
    case UIGestureRecognizerStateEnded:
    case UIGestureRecognizerStateCancelled:
      [self.view animatePressOut];
      [self.view emitPressOutEvent];
      [self.view sendLongSelectEndedNotification];
      self.pressRecognizer.enabled = YES;
      break;
    default:
      break;
  }
}

@end
