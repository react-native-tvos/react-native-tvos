#import <Foundation/Foundation.h>

#import "RCTTouchHandler.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcherProtocol.h"
#import "RCTLog.h"
#import "RCTSurfaceView.h"
#import "RCTTouchEvent.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@interface RCTTouchHandler () <UIGestureRecognizerDelegate>
@end

// The touch handler should not be active on tvOS, so tvOS uses this
// stub implementation that does nothing.
// Fixes https://github.com/react-native-tvos/react-native-tvos/issues/595
//
@implementation RCTTouchHandler

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  return [super initWithTarget:nil action:NULL];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(UIView *)view {}
- (void)detachFromView:(UIView *)view {}
- (void)cancel {}

@end
