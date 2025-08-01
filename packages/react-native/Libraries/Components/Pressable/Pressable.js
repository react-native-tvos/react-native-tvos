/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  MouseEvent,
} from '../../Types/CoreEventTypes';
import type {TVParallaxPropertiesType} from '../TV/TVViewPropTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import usePressability from '../../Pressability/usePressability';
import {type RectOrSize} from '../../StyleSheet/Rect';
import useMergeRefs from '../../Utilities/useMergeRefs';
import tagForComponentOrHandle from '../TV/tagForComponentOrHandle';
import View from '../View/View';
import useAndroidRippleForView, {
  type PressableAndroidRippleConfig,
} from './useAndroidRippleForView';
import * as React from 'react';
import {memo, useMemo, useRef, useState} from 'react';

export type {PressableAndroidRippleConfig};

export type PressableStateCallbackType = $ReadOnly<{
  pressed: boolean,
  focused: boolean,
}>;

type TVProps = $ReadOnly<{
  hasTVPreferredFocus?: boolean,
  isTVSelectable?: ?boolean,
  tvParallaxProperties?: TVParallaxPropertiesType,
  nextFocusDown?: ?number,
  nextFocusForward?: ?number,
  nextFocusLeft?: ?number,
  nextFocusRight?: ?number,
  nextFocusUp?: ?number,
  onFocus?: ?(event: FocusEvent) => mixed,
  onBlur?: ?(event: BlurEvent) => mixed,
  onFocusCapture?: ?(event: FocusEvent) => void,
  onBlurCapture?: ?(event: BlurEvent) => void,
}>;

type PressableBaseProps = $ReadOnly<{
  /**
   * Whether a press gesture can be interrupted by a parent gesture such as a
   * scroll event. Defaults to true.
   */
  cancelable?: ?boolean,

  /**
   * Either children or a render prop that receives a boolean reflecting whether
   * the component is currently pressed.
   */
  children?: React.Node | ((state: PressableStateCallbackType) => React.Node),

  /**
   * Duration to wait after hover in before calling `onHoverIn`.
   */
  delayHoverIn?: ?number,

  /**
   * Duration to wait after hover out before calling `onHoverOut`.
   */
  delayHoverOut?: ?number,

  /**
   * Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.
   */
  delayLongPress?: ?number,

  /**
   * Whether the press behavior is disabled.
   */
  disabled?: ?boolean,

  /**
   * Additional distance outside of this view in which a press is detected.
   */
  hitSlop?: ?RectOrSize,

  /**
   * Additional distance outside of this view in which a touch is considered a
   * press before `onPressOut` is triggered.
   */
  pressRetentionOffset?: ?RectOrSize,

  /**
   * Called when this view's layout changes.
   */
  onLayout?: ?(event: LayoutChangeEvent) => mixed,

  /**
   * Called when the hover is activated to provide visual feedback.
   */
  onHoverIn?: ?(event: MouseEvent) => mixed,

  /**
   * Called when the hover is deactivated to undo visual feedback.
   */
  onHoverOut?: ?(event: MouseEvent) => mixed,

  /**
   * Called when a long-tap gesture is detected.
   */
  onLongPress?: ?(event: GestureResponderEvent) => mixed,

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: ?(event: GestureResponderEvent) => mixed,

  /**
   * Called when a touch is engaged before `onPress`.
   */
  onPressIn?: ?(event: GestureResponderEvent) => mixed,
  /**
   * Called when the press location moves.
   */
  onPressMove?: ?(event: GestureResponderEvent) => mixed,

  /**
   * Called when a touch is released before `onPress`.
   */
  onPressOut?: ?(event: GestureResponderEvent) => mixed,

  /**
   * Whether to prevent any other native components from becoming responder
   * while this pressable is responder.
   */
  blockNativeResponder?: ?boolean,

  /**
   * Either view styles or a function that receives a boolean reflecting whether
   * the component is currently pressed and returns view styles.
   */
  style?:
    | ViewStyleProp
    | ((state: PressableStateCallbackType) => ViewStyleProp),

  /**
   * Identifier used to find this view in tests.
   */
  testID?: ?string,

  /**
   * If true, doesn't play system sound on touch.
   */
  android_disableSound?: ?boolean,

  /**
   * Enables the Android ripple effect and configures its color.
   */
  android_ripple?: ?PressableAndroidRippleConfig,

  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: ?boolean,

  /**
   * Duration to wait after press down before calling `onPressIn`.
   */
  unstable_pressDelay?: ?number,
}>;

export type PressableProps = $ReadOnly<{
  // Pressability may override `onMouseEnter` and `onMouseLeave` to
  // implement `onHoverIn` and `onHoverOut` in a platform-agnostic way.
  // Hover events should be used instead of mouse events.
  ...Omit<ViewProps, 'onMouseEnter' | 'onMouseLeave'>,
  ...PressableBaseProps,
  /**
   * Props needed for Apple TV and Android TV
   */
  ...TVProps,
}>;

type Instance = React.ElementRef<typeof View>;

/**
 * Component used to build display components that should respond to whether the
 * component is currently pressed or not.
 */
function Pressable({
  ref: forwardedRef,
  ...props
}: {
  ref?: React.RefSetter<Instance>,
  ...PressableProps,
}): React.Node {
  const {
    accessible,
    accessibilityState,
    'aria-live': ariaLive,
    android_disableSound,
    android_ripple,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
    blockNativeResponder,
    cancelable,
    children,
    delayHoverIn,
    delayHoverOut,
    delayLongPress,
    disabled,
    focusable,
    hitSlop,
    isTVSelectable,
    nextFocusDown,
    nextFocusForward,
    nextFocusLeft,
    nextFocusRight,
    nextFocusUp,
    onBlur,
    onFocus,
    onHoverIn,
    onHoverOut,
    onLongPress,
    onPress,
    onPressIn,
    onPressMove,
    onPressOut,
    pressRetentionOffset,
    style,
    testOnly_pressed,
    tvParallaxProperties,
    unstable_pressDelay,
    ...restProps
  } = props;

  const viewRef = useRef<Instance | null>(null);
  const mergedRef = useMergeRefs(forwardedRef, viewRef);

  const android_rippleConfig = useAndroidRippleForView(android_ripple, viewRef);

  const [pressed, setPressed] = usePressState(testOnly_pressed === true);
  const [focused, setFocused] = usePressState(false);

  const shouldUpdatePressed =
    typeof children === 'function' || typeof style === 'function';

  let _accessibilityState = {
    busy: ariaBusy ?? accessibilityState?.busy,
    checked: ariaChecked ?? accessibilityState?.checked,
    disabled: ariaDisabled ?? accessibilityState?.disabled,
    expanded: ariaExpanded ?? accessibilityState?.expanded,
    selected: ariaSelected ?? accessibilityState?.selected,
  };

  _accessibilityState =
    disabled != null ? {..._accessibilityState, disabled} : _accessibilityState;

  const accessibilityValue = {
    max: props['aria-valuemax'] ?? props.accessibilityValue?.max,
    min: props['aria-valuemin'] ?? props.accessibilityValue?.min,
    now: props['aria-valuenow'] ?? props.accessibilityValue?.now,
    text: props['aria-valuetext'] ?? props.accessibilityValue?.text,
  };

  const accessibilityLiveRegion =
    ariaLive === 'off' ? 'none' : ariaLive ?? props.accessibilityLiveRegion;

  const accessibilityLabel = ariaLabel ?? props.accessibilityLabel;
  const restPropsWithDefaults: React.ElementConfig<typeof View> = {
    ...restProps,
    ...android_rippleConfig?.viewProps,
    accessible: accessible !== false,
    accessibilityViewIsModal:
      restProps['aria-modal'] ?? restProps.accessibilityViewIsModal,
    accessibilityLiveRegion,
    accessibilityLabel,
    accessibilityState: _accessibilityState,
    focusable:
      focusable !== false && disabled !== true && ariaDisabled !== true,
    isTVSelectable: isTVSelectable !== false && accessible !== false,
    accessibilityValue,
    hitSlop,
  };

  const config = useMemo(
    () => ({
      cancelable,
      disabled,
      hitSlop,
      pressRectOffset: pressRetentionOffset,
      android_disableSound,
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      delayPressIn: unstable_pressDelay,
      onBlur(event: BlurEvent): void {
        shouldUpdatePressed && setFocused(false);
        if (onBlur != null) {
          onBlur(event);
        }
      },
      onFocus(event: FocusEvent): void {
        shouldUpdatePressed && setFocused(true);
        if (onFocus != null) {
          onFocus(event);
        }
      },
      onHoverIn,
      onHoverOut,
      onLongPress,
      onPress,
      onPressIn(event: GestureResponderEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressIn(event);
        }
        shouldUpdatePressed && setPressed(true);
        if (onPressIn != null) {
          onPressIn(event);
        }
      },
      onPressMove(event: GestureResponderEvent): void {
        android_rippleConfig?.onPressMove(event);
        if (onPressMove != null) {
          onPressMove(event);
        }
      },
      onPressOut(event: GestureResponderEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressOut(event);
        }
        shouldUpdatePressed && setPressed(false);
        if (onPressOut != null) {
          onPressOut(event);
        }
      },
      blockNativeResponder,
    }),
    [
      android_disableSound,
      android_rippleConfig,
      blockNativeResponder,
      cancelable,
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      disabled,
      hitSlop,
      onBlur,
      onFocus,
      onHoverIn,
      onHoverOut,
      onLongPress,
      onPress,
      onPressIn,
      onPressMove,
      onPressOut,
      pressRetentionOffset,
      setPressed,
      setFocused,
      shouldUpdatePressed,
      unstable_pressDelay,
    ],
  );

  const eventHandlers = usePressability(config);

  return (
    <View
      {...restPropsWithDefaults}
      {...eventHandlers}
      ref={mergedRef}
      nextFocusDown={tagForComponentOrHandle(props.nextFocusDown)}
      nextFocusForward={tagForComponentOrHandle(props.nextFocusForward)}
      nextFocusLeft={tagForComponentOrHandle(props.nextFocusLeft)}
      nextFocusRight={tagForComponentOrHandle(props.nextFocusRight)}
      nextFocusUp={tagForComponentOrHandle(props.nextFocusUp)}
      isTVSelectable={
        isTVSelectable !== false &&
        accessible !== false &&
        disabled !== true &&
        ariaDisabled !== true
      }
      style={typeof style === 'function' ? style({pressed, focused}) : style}
      tvParallaxProperties={tvParallaxProperties}
      collapsable={false}>
      {typeof children === 'function' ? children({pressed, focused}) : children}
      {__DEV__ ? <PressabilityDebugView color="red" hitSlop={hitSlop} /> : null}
    </View>
  );
}

function usePressState(forcePressed: boolean): [boolean, (boolean) => void] {
  const [pressed, setPressed] = useState(false);
  return [pressed || forcePressed, setPressed];
}

const MemoedPressable = memo(Pressable);
MemoedPressable.displayName = 'Pressable';

export default (MemoedPressable: component(
  ref?: React.RefSetter<React.ElementRef<typeof View>>,
  ...props: PressableProps
));
