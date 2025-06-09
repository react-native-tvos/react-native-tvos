/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBorderCurve.h>
#import <React/RCTBorderStyle.h>
#import <React/RCTComponent.h>
#import <React/RCTCursor.h>
#import <React/RCTPointerEvents.h>

extern const UIAccessibilityTraits SwitchAccessibilityTrait;

@protocol RCTAutoInsetsProtocol;

@interface RCTView : UIView

/**
 * Accessibility event handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityAction;
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityTap;
@property (nonatomic, copy) RCTDirectEventBlock onMagicTap;
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityEscape;

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) RCTPointerEvents pointerEvents;

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset;

/**
 * Layout direction of the view.
 * This is inherited from UIView+React, but we override it here
 * to improve performance and make subclassing/overriding possible/easier.
 */
@property (nonatomic, assign) UIUserInterfaceLayoutDirection reactLayoutDirection;

/**
 * This is an optimization used to improve performance
 * for large scrolling views with many subviews, such as a
 * list or table. If set to YES, any clipped subviews will
 * be removed from the view hierarchy whenever -updateClippedSubviews
 * is called. This would typically be triggered by a scroll event
 */
@property (nonatomic, assign) BOOL removeClippedSubviews;

/**
 * Hide subviews if they are outside the view bounds.
 * This is an optimisation used predominantly with RKScrollViews
 * but it is applied recursively to all subviews that have
 * removeClippedSubviews set to YES
 */
- (void)updateClippedSubviews;

/**
 * Border radii.
 */
@property (nonatomic, assign) CGFloat borderRadius;
@property (nonatomic, assign) CGFloat borderTopLeftRadius;
@property (nonatomic, assign) CGFloat borderTopRightRadius;
@property (nonatomic, assign) CGFloat borderTopStartRadius;
@property (nonatomic, assign) CGFloat borderTopEndRadius;
@property (nonatomic, assign) CGFloat borderBottomLeftRadius;
@property (nonatomic, assign) CGFloat borderBottomRightRadius;
@property (nonatomic, assign) CGFloat borderBottomStartRadius;
@property (nonatomic, assign) CGFloat borderBottomEndRadius;
@property (nonatomic, assign) CGFloat borderEndEndRadius;
@property (nonatomic, assign) CGFloat borderEndStartRadius;
@property (nonatomic, assign) CGFloat borderStartEndRadius;
@property (nonatomic, assign) CGFloat borderStartStartRadius;

/**
 * Border colors (actually retained).
 */
@property (nonatomic, strong) UIColor *borderTopColor;
@property (nonatomic, strong) UIColor *borderRightColor;
@property (nonatomic, strong) UIColor *borderBottomColor;
@property (nonatomic, strong) UIColor *borderLeftColor;
@property (nonatomic, strong) UIColor *borderStartColor;
@property (nonatomic, strong) UIColor *borderEndColor;
@property (nonatomic, strong) UIColor *borderColor;
@property (nonatomic, strong) UIColor *borderBlockColor;
@property (nonatomic, strong) UIColor *borderBlockEndColor;
@property (nonatomic, strong) UIColor *borderBlockStartColor;

/**
 * Border widths.
 */
@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderStartWidth;
@property (nonatomic, assign) CGFloat borderEndWidth;
@property (nonatomic, assign) CGFloat borderWidth;
// TODO: Implement logical border width logic
@property (nonatomic, assign) CGFloat borderBlockWidth;
@property (nonatomic, assign) CGFloat borderBlockEndWidth;
@property (nonatomic, assign) CGFloat borderBlockStartWidth;

/**
 * Border curve.
 */
@property (nonatomic, assign) RCTBorderCurve borderCurve;

/**
 * Border styles.
 */
@property (nonatomic, assign) RCTBorderStyle borderStyle;

/**
 *  Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;

@property (nonatomic, assign) RCTCursor cursor;

#if TARGET_OS_TV
// For Paper, all views on TV might have focus, blur, pressIn, pressOut handlers,
// so we need to add these properties here and not in RCTTVView,
// since some views do not inherit from RCTTVView.

/**
 * Focus
 */
@property (nonatomic, copy) RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onBlur;

/**
 * TV Press Handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onPressIn;
@property (nonatomic, copy) RCTDirectEventBlock onPressOut;

#endif // TARGET_OS_TV

/**
 * (Experimental and unused for Paper) Pointer event handlers.
 */
@property (nonatomic, assign) RCTBubblingEventBlock onClick;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerCancel;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerDown;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerMove;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerUp;
@property (nonatomic, assign) RCTCapturingEventBlock onPointerEnter;
@property (nonatomic, assign) RCTCapturingEventBlock onPointerLeave;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerOver;
@property (nonatomic, assign) RCTBubblingEventBlock onPointerOut;
@property (nonatomic, assign) RCTBubblingEventBlock onGotPointerCapture;
@property (nonatomic, assign) RCTBubblingEventBlock onLostPointerCapture;

@end
