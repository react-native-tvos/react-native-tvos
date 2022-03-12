/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {
  useMemo,
  useState,
  useRef,
  useImperativeHandle,
  useCallback,
  useEffect,
} from 'react';
import useAndroidRippleForView, {
  type RippleConfig,
} from './useAndroidRippleForView';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
} from '../View/ViewAccessibility';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import usePressability from '../../Pressability/usePressability';
import {normalizeRect, type RectOrSize} from '../../StyleSheet/Rect';
import type {LayoutEvent, PressEvent} from '../../Types/CoreEventTypes';
import View from '../View/View';
import typeof TVParallaxPropertiesType from '../AppleTV/TVViewPropTypes';
import Platform from '../../Utilities/Platform';
import {tvFocusEventHandler} from '../AppleTV/TVFocusEventHandler';

type ViewStyleProp = $ElementType<React.ElementConfig<typeof View>, 'style'>;

export type StateCallbackType = $ReadOnly<{|
  pressed: boolean,
  focused: boolean,
|}>;

type TVProps = $ReadOnly<{|
  hasTVPreferredFocus?: boolean,
  isTVSelectable?: ?boolean,
  tvParallaxProperties?: TVParallaxPropertiesType,
  nextFocusDown?: ?number,
  nextFocusForward?: ?number,
  nextFocusLeft?: ?number,
  nextFocusRight?: ?number,
  nextFocusUp?: ?number,
  onFocus?: ?(event: FocusEvent) => mixed,
  onBlur?: ?(event: FocusEvent) => mixed,
|}>;

type Props = $ReadOnly<{|
  /**
   * Accessibility.
   */
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
  accessibilityElementsHidden?: ?boolean,
  accessibilityHint?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityLabel?: ?Stringish,
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),
  accessibilityRole?: ?AccessibilityRole,
  accessibilityState?: ?AccessibilityState,
  accessibilityValue?: ?AccessibilityValue,
  accessibilityViewIsModal?: ?boolean,
  accessible?: ?boolean,
  focusable?: ?boolean,
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,

  /**
   * Whether a press gesture can be interrupted by a parent gesture such as a
   * scroll event. Defaults to true.
   */
  cancelable?: ?boolean,

  /**
   * Either children or a render prop that receives a boolean reflecting whether
   * the component is currently pressed.
   */
  children: React.Node | ((state: StateCallbackType) => React.Node),

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
  onLayout?: ?(event: LayoutEvent) => mixed,

  /**
   * Called when a long-tap gesture is detected.
   */
  onLongPress?: ?(event: PressEvent) => mixed,

  /**
   * Called when a single tap gesture is detected.
   */
  onPress?: ?(event: PressEvent) => mixed,

  /**
   * Called when a touch is engaged before `onPress`.
   */
  onPressIn?: ?(event: PressEvent) => mixed,

  /**
   * Called when a touch is released before `onPress`.
   */
  onPressOut?: ?(event: PressEvent) => mixed,

  /**
   * Either view styles or a function that receives a boolean reflecting whether
   * the component is currently pressed and returns view styles.
   */
  style?: ViewStyleProp | ((state: StateCallbackType) => ViewStyleProp),

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
  android_ripple?: ?RippleConfig,

  /**
   * Used only for documentation or testing (e.g. snapshot testing).
   */
  testOnly_pressed?: ?boolean,

  /**
   * Duration to wait after press down before calling `onPressIn`.
   */
  unstable_pressDelay?: ?number,
  /**
   * Props needed for Apple TV and Android TV
   */
  ...TVProps,
|}>;

/**
 * Component used to build display components that should respond to whether the
 * component is currently pressed or not.
 */
function Pressable(props: Props, forwardedRef): React.Node {
  const {
    accessible,
    android_disableSound,
    android_ripple,
    cancelable,
    children,
    delayLongPress,
    disabled,
    focusable,
    isTVSelectable,
    onBlur,
    onFocus,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
    pressRetentionOffset,
    style,
    testOnly_pressed,
    tvParallaxProperties,
    unstable_pressDelay,
    ...restProps
  } = props;

  const viewRef = useRef<React.ElementRef<typeof View> | null>(null);
  useImperativeHandle(forwardedRef, () => viewRef.current);

  const android_rippleConfig = useAndroidRippleForView(android_ripple, viewRef);

  const [pressed, setPressed] = usePressState(testOnly_pressed === true);

  const [focused, setFocused] = useState(false);

  const hitSlop = normalizeRect(props.hitSlop);

  const accessibilityState =
    disabled != null
      ? {...props.accessibilityState, disabled}
      : props.accessibilityState;

  const restPropsWithDefaults: React.ElementConfig<typeof View> = {
    ...restProps,
    ...android_rippleConfig?.viewProps,
    accessible: accessible !== false,
    accessibilityState,
    focusable: focusable !== false,
    isTVSelectable: isTVSelectable !== false && accessible !== false,
    hitSlop,
  };

  const config = useMemo(
    () => ({
      cancelable,
      disabled,
      hitSlop,
      pressRectOffset: pressRetentionOffset,
      android_disableSound,
      delayLongPress,
      delayPressIn: unstable_pressDelay,
      onBlur,
      onFocus,
      onLongPress,
      onPress,
      onPressIn(event: PressEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressIn(event);
        }
        setPressed(true);
        if (onPressIn != null) {
          onPressIn(event);
        }
      },
      onPressMove: android_rippleConfig?.onPressMove,
      onPressOut(event: PressEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressOut(event);
        }
        setPressed(false);
        if (onPressOut != null) {
          onPressOut(event);
        }
      },
    }),
    [
      android_disableSound,
      android_rippleConfig,
      cancelable,
      delayLongPress,
      disabled,
      hitSlop,
      onBlur,
      onFocus,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
      pressRetentionOffset,
      setPressed,
      unstable_pressDelay,
    ],
  );
  const eventHandlers = usePressability(config);

  const pressableTVFocusEventHandler = useCallback(
    (evt: Event) => {
      if (isTVSelectable !== false || focusable !== false) {
        if (evt?.eventType === 'focus') {
          setFocused(true);
          onFocus && onFocus(evt);
        } else if (evt.eventType === 'blur') {
          onBlur && onBlur(evt);
          setFocused(false);
        }
      }
      // Use these on tvOS only. Android press events go to onClick() so we don't
      // need to call onPress() again here
      if (Platform.isTVOS) {
        if (focused && evt.eventType === 'select') {
          onPress && onPress(evt);
        }
        if (focused && evt.eventType === 'longSelect') {
          onLongPress && onLongPress(evt);
        }
      }
    },
    [focused, onBlur, onFocus, onLongPress, onPress, focusable, isTVSelectable],
  );

  useEffect(() => {
    if (!tvFocusEventHandler) {
      return;
    }
    const viewTag = viewRef?.current?._nativeTag;
    tvFocusEventHandler.register(viewTag, pressableTVFocusEventHandler);
    return () => {
      tvFocusEventHandler.unregister(viewTag);
    };
  }, [pressableTVFocusEventHandler]);

  return (
    <View
      {...restPropsWithDefaults}
      {...eventHandlers}
      ref={viewRef}
      isTVSelectable={isTVSelectable !== false && accessible !== false}
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

const MemoedPressable = React.memo(React.forwardRef(Pressable));
MemoedPressable.displayName = 'Pressable';

export default (MemoedPressable: React.AbstractComponent<
  Props,
  React.ElementRef<typeof View>,
>);
