/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewProps} from '../View/ViewPropTypes';
import type {ComponentOrHandleType} from './tagForComponentOrHandle';

import Platform from '../../Utilities/Platform';
import useMergeRefs from '../../Utilities/useMergeRefs';
import View from '../View/View';
import {Commands} from '../View/ViewNativeComponent';
import tagForComponentOrHandle from './tagForComponentOrHandle';

const StyleSheet = require('../../StyleSheet/StyleSheet').default;
const React = require('react');

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
  destinations?: ComponentOrHandleType[],

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
  focusable?: boolean | void,
}>;

export type TVFocusGuideViewImperativeMethods = $ReadOnly<{
  setDestinations: (destinations: (ComponentOrHandleType | number)[]) => void,
}>;

function TVFocusGuideView({
  enabled = true,
  safePadding,
  destinations: destinationsProp,
  autoFocus,
  focusable,
  ref,
  ...props
}: TVFocusGuideViewProps): React.Node {
  const focusGuideRef = React.useRef<React.ElementRef<typeof View> | null>(
    null,
  );

  const setDestinations = React.useCallback(
    (destinations: ?(ComponentOrHandleType[])) => {
      if (Platform.isTV) {
        const dests: number[] = (destinations || [])
          .map((destination: any) => tagForComponentOrHandle(destination))
          .filter(Boolean);

        if (focusGuideRef.current != null) {
          Commands.setDestinations(focusGuideRef.current, dests);
        }
      }
    },
    [],
  );

  const setLocalRef = React.useCallback(
    (instance: HostInstance | null) => {
      // $FlowExpectedError[incompatible-type]
      focusGuideRef.current = instance;

      if (instance != null) {
        // $FlowFixMe[prop-missing]
        // $FlowFixMe[unsafe-object-assign]
        Object.assign(instance, {
          setDestinations,
        });
      }
    },
    [setDestinations],
  );

  const mergedRef = useMergeRefs(setLocalRef, ref);

  React.useEffect(() => {
    if (focusable === false) {
      setDestinations([]);
    } else if (destinationsProp !== null && destinationsProp !== undefined) {
      setDestinations(destinationsProp); // $FlowFixMe[incompatible-call]
    }
  }, [setDestinations, destinationsProp, focusable]);

  const enabledStyle = {display: enabled ? 'flex' : 'none'};
  const style = [styles.container, props.style, enabledStyle];

  // If there are no destinations and the autoFocus is false the the default value of focusable should be false
  // It is then properly handled by the native code
  const tvOSSelectable =
    destinationsProp || autoFocus ? focusable !== false : false;

  return (
    // $FlowFixMe[prop-missing]
    <View
      {...props}
      style={style}
      ref={mergedRef}
      collapsable={false}
      autoFocus={focusable === false ? true : autoFocus}
      // tvOS only prop
      isTVSelectable={tvOSSelectable}
      // Android TV only prop
      tvFocusable={focusable}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 1,
    minHeight: 1,
  },
});

export default TVFocusGuideView;
