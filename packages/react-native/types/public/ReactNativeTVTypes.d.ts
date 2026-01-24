import * as React from 'react';
import type { View, ScrollViewProps, HostComponent, EventSubscription, TVParallaxProperties } from 'react-native';

declare module 'react-native' {
  export type FocusDestination = null | number | React.Component<any, any> | React.ComponentClass<any>;

  interface ViewProps {
  /**
   * Android TV only prop
   */
  tvFocusable?: boolean | undefined,
  /**
   * TV next focus down (see documentation for the View component).
   */
  nextFocusDown?: FocusDestination | undefined,

  /**
   * TV next focus forward (see documentation for the View component).
   *
   * @platform android
   */
  nextFocusForward?: FocusDestination | undefined,

  /**
   * TV next focus left (see documentation for the View component).
   */
  nextFocusLeft?: FocusDestination | undefined,

  /**
   * TV next focus right (see documentation for the View component).
   */
  nextFocusRight?: FocusDestination | undefined,

  /**
   * TV next focus up (see documentation for the View component).
   */
  nextFocusUp?: FocusDestination | undefined,
  }

  export interface NativeMethods {
    requestTVFocus(): void;
  }

  export const useTVEventHandler: (handleEvent: (event: HWEvent) => void) => void;

  export const TVEventControl: {
    enableTVMenuKey(): void;
    disableTVMenuKey(): void;
    enableTVPanGesture(): void;
    disableTVPanGesture(): void;
    enableGestureHandlersCancelTouches(): void;
    disableGestureHandlersCancelTouches(): void;
  };

  /**
   * Hardware event received from TVEventHandler
   * 
   * Note: The 'blur' and 'focus' event types are deprecated and will no longer be 
   * emitted on new architecture (Fabric). Use onFocus/onBlur component props instead.
   * See: https://github.com/react-native-tvos/react-native-tvos/issues/1037
   */
  export type HWEvent = {
    eventType: 'up' | 'down' | 'right' | 'left' | 'longUp' | 'longDown' | 'longRight' | 'longLeft' | 'blur' | 'focus' | 'pan' | string;
    eventKeyAction?: -1 | 1 | 0 | number | undefined;
    tag?: number | undefined;
    body?: {
      state: 'Began' | 'Changed' | 'Ended',
      x: number,
      y: number,
      velocityX: number,
      velocityY: number
    } | undefined
  };

  export const TVEventHandler: {
    addListener: (listener: (event: HWEvent) => void) => EventSubscription | undefined
  };

  export interface FocusGuideProps extends ViewProps {
     /**
     * If the view should be "visible". display "flex" if visible, otherwise "none".
     * Defaults to true
     */
    enabled?: boolean | undefined;
    /**
     * Array of `Component`s to register as destinations with `UIFocusGuide`
     */
    destinations?: FocusDestination[] | undefined;
    /**
     * If true, `TVFocusGuide` will automatically manage focus for you.
     * It will redirect the focus to the first focusable child on the first visit.
     * It also remembers the last focused child and redirects the focus
     * to it on the subsequent visits.
     *
     * `destinations` prop takes precedence over this prop when used together.
     *
     * @default false
     */
    autoFocus?: boolean | undefined;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusUp?: boolean | undefined;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusDown?: boolean | undefined;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusLeft?: boolean | undefined;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusRight?: boolean | undefined;
    /**
     * @deprecated Don't use it, no longer necessary.
     */
    safePadding?: 'both' | 'vertical' | 'horizontal' | null | undefined;
  }

  export type FocusGuideMethods = {
    setDestinations: (
      destinations: FocusDestination[],
    ) => void;
  }

  /**
   * This component provides support for Apple's `UIFocusGuide` API,
   * to help ensure that focusable controls can be navigated to,
   * even if they are not directly in line with other controls on both tvOS and Android.
   * An example is provided in `RNTester` that shows different ways of using this component.
   * https://github.com/react-native-tvos/react-native-tvos/blob/tvos-v0.69.8/packages/rn-tester/js/examples/TVFocusGuide/TVFocusGuideAutoFocusExample.js
   */
  export const TVFocusGuideView: React.ForwardRefExoticComponent<FocusGuideProps & React.RefAttributes<View & FocusGuideMethods>>;
  export interface TVTextScrollViewProps extends Omit<ScrollViewProps, 'onFocus' | 'onBlur'> {
    /**
     * The duration of the scroll animation when a swipe is detected.
     * Default value is 0.3 s
     */
    scrollDuration?: number | undefined;
    /**
     * Scrolling distance when a swipe is detected
     * Default value is half the visible height (vertical scroller)
     * or width (horizontal scroller)
     */
    pageSize?: number | undefined;
    /**
     * If true, will scroll to start when focus moves out past the beginning
     * of the scroller
     * Defaults to true
     */
    snapToStart?: boolean | undefined;
    /**
     * If true, will scroll to end when focus moves out past the end of the
     * scroller
     * Defaults to true
     */
    snapToEnd?: boolean | undefined;
    /**
     * Called when the scroller comes into focus (e.g. for highlighting)
     */
    onFocus?(evt: HWEvent): void;
    /**
     * Called when the scroller goes out of focus
     */
    onBlur?(evt: HWEvent): void;
  }

  export class TVTextScrollView extends React.Component<TVTextScrollViewProps> {}

  export interface PressableStateCallbackType {
    readonly focused: boolean;
  }

  export interface TouchableWithoutFeedbackPropsIOS {
    /**
     * *(Apple TV only)* TV preferred focus (see documentation for the View component).
     *
     * @platform ios
     */
    hasTVPreferredFocus?: boolean | undefined;

    /**
     * *(Apple TV only)* Object with properties to control Apple TV parallax effects.
     *
     * enabled: If true, parallax effects are enabled.  Defaults to true.
     * shiftDistanceX: Defaults to 2.0.
     * shiftDistanceY: Defaults to 2.0.
     * tiltAngle: Defaults to 0.05.
     * magnification: Defaults to 1.0.
     * pressMagnification: Defaults to 1.0.
     * pressDuration: Defaults to 0.3.
     * pressDelay: Defaults to 0.0.
     *
     * @platform ios
     */
    tvParallaxProperties?: TVParallaxProperties | undefined;
  }
}
