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

  export const useTVEventHandler: (handleEvent: (event: HWKeyEvent) => void) => void;

  export const TVMenuControl: {
    enableTVMenuKey(): void;
    disableTVMenuKey(): void;
  };

  interface HWFocusEvent {
    eventType: 'blur' | 'focus';
    eventKeyAction: -1;
    tag: number;
  }

  export type HWKeyEvent =
    | HWFocusEvent
    | {
        eventType: 'up' | 'down' | 'right' | 'left' | string;
        eventKeyAction: -1 | 1 | 0 | number;
        tag?: number;
      };

  export class TVEventHandler {
    enable<T extends React.Component<unknown>>(
      component?: T,
      callback?: (component: T, data: HWKeyEvent) => void
    ): void;
    disable(): void;
  }

  export interface FocusGuideProps extends ViewProps {
    /**
     * Array of `Component`s to register as destinations with `UIFocusGuide`
     */
    destinations?: (null | number | React.Component<any, any> | React.ComponentClass<any>)[];
  }

  /**
   * This component provides support for Apple's `UIFocusGuide` API,
   * to help ensure that focusable controls can be navigated to,
   * even if they are not directly in line with other controls.
   * An example is provided in `RNTester` that shows two different ways of using this component.
   * https://github.com/react-native-tvos/react-native-tvos/blob/tvos-v0.63.1/RNTester/js/TVFocusGuideExample.js
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
    onFocus?(evt: HWKeyEvent): void;
    /**
     * Called when the scroller goes out of focus
     */
    onBlur?(evt: HWKeyEvent): void;
  }

  export class TVTextScrollView extends React.Component<TVTextScrollViewProps> {}
}
