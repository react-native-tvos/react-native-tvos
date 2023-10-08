/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  LayoutEvent,
  MouseEvent,
  PressEvent,
} from '../../Types/CoreEventTypes';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
} from '../View/ViewAccessibility';

import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import usePressability from '../../Pressability/usePressability';
import {type RectOrSize} from '../../StyleSheet/Rect';
import useMergeRefs from '../../Utilities/useMergeRefs';
import View from '../View/View';
import type {TVParallaxPropertiesType} from '../TV/TVViewPropTypes';
import Platform from '../../Utilities/Platform';
import {tvFocusEventHandler} from '../TV/TVFocusEventHandler';
import tagForComponentOrHandle from '../TV/tagForComponentOrHandle';
import useAndroidRippleForView, {
  type RippleConfig,
} from './useAndroidRippleForView';
import * as React from 'react';
import {useImperativeHandle, useMemo, useRef, useState} from 'react';

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
  accessibilityLanguage?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityLabel?: ?Stringish,
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),
  accessibilityRole?: ?AccessibilityRole,
  accessibilityState?: ?AccessibilityState,
  accessibilityValue?: ?AccessibilityValue,
  'aria-valuemax'?: AccessibilityValue['max'],
  'aria-valuemin'?: AccessibilityValue['min'],
  'aria-valuenow'?: AccessibilityValue['now'],
  'aria-valuetext'?: AccessibilityValue['text'],
  accessibilityViewIsModal?: ?boolean,
  'aria-modal'?: ?boolean,
  accessible?: ?boolean,

  /**
   * alias for accessibilityState
   *
   * see https://reactnative.dev/docs/accessibility#accessibilitystate
   */
  'aria-busy'?: ?boolean,
  'aria-checked'?: ?boolean | 'mixed',
  'aria-disabled'?: ?boolean,
  'aria-expanded'?: ?boolean,
  'aria-selected'?: ?boolean,
  /**
   * A value indicating whether the accessibility elements contained within
   * this accessibility element are hidden.
   */
  'aria-hidden'?: ?boolean,
  'aria-live'?: ?('polite' | 'assertive' | 'off'),
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
  onLayout?: ?(event: LayoutEvent) => mixed,

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
  /**
   * Web to Native Accessibility props
   * https://github.com/facebook/react-native/issues/34424
   */
  'aria-label'?: ?string,
|}>;

/**
 * Component used to build display components that should respond to whether the
 * component is currently pressed or not.
 */
/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function Pressable(props: Props, forwardedRef): React.Node {
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
    cancelable,
    children,
    delayHoverIn,
    delayHoverOut,
    delayLongPress,
    disabled,
    focusable,
    hitSlop,
    onHoverIn,
    onHoverOut,
    isTVSelectable,
    nextFocusDown,
    nextFocusForward,
    nextFocusLeft,
    nextFocusRight,
    nextFocusUp,
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
  const mergedRef = useMergeRefs(forwardedRef, viewRef);

  const android_rippleConfig = useAndroidRippleForView(android_ripple, viewRef);

  const [pressed, setPressed] = usePressState(testOnly_pressed === true);

  const [focused, setFocused] = useState(false);

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
      onHoverIn,
      onHoverOut,
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
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      disabled,
      hitSlop,
      onHoverIn,
      onHoverOut,
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
  // $FlowFixMe[incompatible-call]
  const eventHandlers = usePressability(config);

  const pressableTVFocusEventHandler = React.useCallback(
    (evt: FocusEvent) => {
      if (isTVSelectable !== false || focusable !== false) {
        // $FlowFixMe[prop-missing]
        if (evt?.eventType === 'focus') {
          setFocused(true);
          onFocus && onFocus(evt);
          // $FlowFixMe[prop-missing]
        } else if (evt.eventType === 'blur') {
          onBlur && onBlur(evt);
          setFocused(false);
        }
      }
      // Use these on tvOS only. Android press events go to onClick() so we don't
      // need to call onPress() again here
      if (Platform.isTVOS) {
        // $FlowFixMe[prop-missing]
        if (focused && evt.eventType === 'select') {
          // $FlowFixMe[incompatible-exact]
          onPress && onPress(evt);
        }
        // $FlowFixMe[prop-missing]
        if (focused && evt.eventType === 'longSelect') {
          // $FlowFixMe[incompatible-exact]
          onLongPress && onLongPress(evt);
        }
      }
    },
    [focused, onBlur, onFocus, onLongPress, onPress, focusable, isTVSelectable],
  );

  React.useEffect(() => {
    if (!tvFocusEventHandler) {
      return;
    }
    // $FlowFixMe[prop-missing]
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

const MemoedPressable = React.memo(React.forwardRef(Pressable));
MemoedPressable.displayName = 'Pressable';

export default (MemoedPressable: React.AbstractComponent<
  Props,
  React.ElementRef<typeof View>,
>);
