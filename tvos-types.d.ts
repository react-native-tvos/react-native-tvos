import React from 'react';
import { ViewProps, ScrollViewProps } from 'react-native';

declare module 'react-native' {
  interface ViewProps {
  /**
   * TV next focus down (see documentation for the View component).
   */
  nextFocusDown?: number,

  /**
   * TV next focus forward (see documentation for the View component).
   * 
   * @platform android
   */
  nextFocusForward?: number,

  /**
   * TV next focus left (see documentation for the View component).
   */
  nextFocusLeft?: number,

  /**
   * TV next focus right (see documentation for the View component).
   */
  nextFocusRight?: number,

  /**
   * TV next focus up (see documentation for the View component).
   */
  nextFocusUp?: number,
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

  export type HWEvent = {
    eventType: 'up' | 'down' | 'right' | 'left' | 'longUp' | 'longDown' | 'longRight' | 'longLeft' | 'blur' | 'focus' | 'pan' | string;
    eventKeyAction?: -1 | 1 | 0 | number;
    tag?: number;
    body?: {
      state: "Began" | "Changed" | "Ended",
      x: number,
      y: number,
      velocityx: number,
      velocityy: number
    } 
  };

  export class TVEventHandler {
    enable<T extends React.Component<unknown>>(
      component?: T,
      callback?: (component: T, data: HWEvent) => void
    ): void;
    disable(): void;
  }

  export interface FocusGuideProps extends ViewProps {
     /**
     * If the view should be "visible". display "flex" if visible, otherwise "none".
     * Defaults to true
     */
    enabled?: boolean;
    /**
     * Array of `Component`s to register as destinations with `UIFocusGuide`
     */
    destinations?: (null | number | React.Component<any, any> | React.ComponentClass<any>)[];
    /**
     * If true, `TVFocusGuide` will automatically manage focus for you.
     * It will redirect the focus to the first focusable child on the first visit.
     * It also remembers the last focused child and redirects the focus
     * to it on the subsequent visits.
     *
     * @default false
     */
    autoFocus?: boolean;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusUp?: boolean;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusDown?: boolean;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusLeft?: boolean;
    /**
     * Enables focus trapping for the focus guide (see README).
     */
    trapFocusRight?: boolean;
    /**
     * @deprecated Don't use it, no longer necessary.
     */
    safePadding?: 'both' | 'vertical' | 'horizontal' | null;
  }

  /**
   * This component provides support for Apple's `UIFocusGuide` API,
   * to help ensure that focusable controls can be navigated to,
   * even if they are not directly in line with other controls.
   * An example is provided in `RNTester` that shows two different ways of using this component.
   * https://github.com/react-native-tvos/react-native-tvos/blob/tvos-v0.63.4/RNTester/js/examples/TVFocusGuide/TVFocusGuideExample.js
   */
  export class TVFocusGuideView extends React.Component<FocusGuideProps> {}

  export interface TVTextScrollViewProps extends ScrollViewProps {
    /**
     * The duration of the scroll animation when a swipe is detected.
     * Default value is 0.3 s
     */
    scrollDuration?: number;
    /**
     * Scrolling distance when a swipe is detected
     * Default value is half the visible height (vertical scroller)
     * or width (horizontal scroller)
     */
    pageSize?: number;
    /**
     * If true, will scroll to start when focus moves out past the beginning
     * of the scroller
     * Defaults to true
     */
    snapToStart?: boolean;
    /**
     * If true, will scroll to end when focus moves out past the end of the
     * scroller
     * Defaults to true
     */
    snapToEnd?: boolean;
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
    hasTVPreferredFocus?: boolean;

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
    tvParallaxProperties?: TVParallaxProperties;
  }

}
