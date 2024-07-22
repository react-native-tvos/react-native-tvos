/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import setAndForwardRef from '../../Utilities/setAndForwardRef';
import {Commands} from '../View/ViewNativeComponent';

const React = require('react');
const ReactNative = require('react-native');

const {View} = ReactNative;

type TVFocusGuideViewProps = $ReadOnly<{
  ...ViewProps,

  /**
   * If the view should be "visible". display "flex" if visible, otherwise "none".
   * Useful for absolute focus guides without children
   * Defaults to true
   */
  enabled?: boolean,

  /**
   * The views the focus should go to
   */
  destinations?: (?React.ElementRef<HostComponent<mixed>>)[],

  /**
   * @deprecated Don't use it, no longer necessary.
   */
  safePadding?: 'vertical' | 'horizontal' | 'both' | null,

  autoFocus?: boolean,

  trapFocusUp?: boolean,
  trapFocusDown?: boolean,
  trapFocusLeft?: boolean,
  trapFocusRight?: boolean,

  /**
   * When set to false, this view and all its subviews will be NOT focusable.
   */
  focusable?: boolean | undefined,
}>;

export type TVFocusGuideViewImperativeMethods = $ReadOnly<{
  setDestinations: (
    destinations: (?React.ElementRef<HostComponent<mixed>>)[],
  ) => void,
}>;

function TVFocusGuideView(
  {
    enabled = true,
    safePadding,
    destinations: destinationsProp,
    autoFocus,
    focusable,
    ...props
  }: TVFocusGuideViewProps,
  forwardedRef,
): React.Node {
  const focusGuideRef = React.useRef<React.ElementRef<
    typeof ReactNative.View,
  > | null>(null);

  const setDestinations = React.useCallback(
    (destinations: (?React.ElementRef<HostComponent<mixed>>)[]) => {
      const dests: number[] = (destinations || [])
        .map(ReactNative.findNodeHandle)
        .filter(Boolean);

      if (focusGuideRef.current != null) {
        Commands.setDestinations(focusGuideRef.current, dests);
      }
    },
    [],
  );

  const _setNativeRef = setAndForwardRef({
    getForwardedRef: () => forwardedRef,
    setLocalRef: ref => {
      focusGuideRef.current = ref;

      // This is a hack. Ideally we would forwardRef to the underlying
      // host component. However, since TVFocusGuide has its own methods that can be
      // called as well, if we used the standard forwardRef then these
      // methods wouldn't be accessible
      //
      // Here we mutate the ref, so that the user can use the standard native
      // methods like `focus()`, `blur()`, etc. while also having access to
      // imperative methods of this component like `setDestinations()`.
      if (ref) {
        ref.setDestinations = setDestinations;
      }
    },
  });

  React.useEffect(() => {
    if (destinationsProp != null) {
      setDestinations(destinationsProp);
    }
  }, [setDestinations, destinationsProp]);

  const enabledStyle = {display: enabled ? 'flex' : 'none'};
  const style = [styles.container, props.style, enabledStyle];

  // If there are no destinations and the autoFocus is false the the default value of focusable should be false
  // It is then properly handled by the native code
  const tvOSSelectable =
    destinationsProp || autoFocus ? focusable !== false : false;

  return (
    // $FlowFixMe[prop-missing]
    <ReactNative.View
      {...props}
      style={style}
      ref={_setNativeRef}
      collapsable={false}
      autoFocus={autoFocus}
      // tvOS only prop
      isTVSelectable={tvOSSelectable}
      // Android TV only prop
      tvFocusable={focusable}
    />
  );
}

const styles = ReactNative.StyleSheet.create({
  container: {
    minWidth: 1,
    minHeight: 1,
  },
});

const ForwardedTVFocusGuideView: React.AbstractComponent<
  TVFocusGuideViewProps,
  React.ElementRef<typeof View> & TVFocusGuideViewImperativeMethods,
> = React.forwardRef(TVFocusGuideView);
ForwardedTVFocusGuideView.displayName = 'TVFocusGuideView';

module.exports = ForwardedTVFocusGuideView;
