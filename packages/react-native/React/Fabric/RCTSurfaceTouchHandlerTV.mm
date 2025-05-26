#import "RCTSurfaceTouchHandler.h"

#import <React/RCTIdentifierPool.h>
#import <React/RCTUtils.h>
#import <React/RCTViewComponentView.h>

#import "RCTConversions.h"
#import "RCTSurfacePointerHandler.h"
#import "RCTTouchableComponentViewProtocol.h"

// The touch handler should not be active on tvOS, so tvOS uses this
// stub implementation that does nothing.
// Fixes https://github.com/react-native-tvos/react-native-tvos/issues/595
//
@interface RCTSurfaceTouchHandler () <UIGestureRecognizerDelegate>
@end

@implementation RCTSurfaceTouchHandler

- (instancetype)init
{
  return [super initWithTarget:nil action:nil];
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(UIView *)view {}
- (void)detachFromView:(UIView *)view {}

@end
