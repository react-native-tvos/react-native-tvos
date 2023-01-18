/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const React = require('react');
const ReactNative = require('react-native');
import ReactNativeShims from '../../Renderer/shims/ReactNative';
const Platform = require('../../Utilities/Platform');
import {Commands} from '../View/ViewNativeComponent';
import type {ViewProps} from '../View/ViewPropTypes';

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
  destinations?: ?(Object[]),

  /**
   * @deprecated Don't use it, no longer necessary.
   */
  safePadding?: 'vertical' | 'horizontal' | 'both' | null,

  autoFocus?: boolean,
}>;

const TVFocusGuideView = ({
  enabled = true,
  safePadding,
  ...props
}: TVFocusGuideViewProps): React.Node => {
  const enabledStyle = {display: enabled ? 'flex' : 'none'};
  const style = [styles.container, props.style, enabledStyle];

  // `autoFocus` and `destinations` props shouldn't be used together.
  // Otherwise they can conflict with each other. So if `destinations` is
  // provided, we set `autoFocus` prop to false to avoid that conflict.
  const autoFocus = props.destinations?.length ? false : props.autoFocus;

  if (Platform.isTVOS) {
    return (
      <FocusGuideViewTVOS {...props} style={style} autoFocus={autoFocus} />
    );
  }

  if (Platform.isTV) {
    return (
      <FocusGuideViewAndroidTV {...props} style={style} autoFocus={autoFocus} />
    );
  }

  return <ReactNative.View {...props} style={style} />;
};

const FocusGuideViewTVOS = (props: TVFocusGuideViewProps) => {
  const focusGuideRef = React.useRef(null);
  console.log(props.autoFocus);
  React.useEffect(() => {
    if (props.destinations) {
      const nativeDestinations = (props.destinations || [])
        .map(d => ReactNative.findNodeHandle(d))
        .filter(c => c !== 0 && c !== null && c !== undefined);
      const hostComponentRef = ReactNativeShims.findHostInstance_DEPRECATED(
        focusGuideRef?.current,
      );
      console.log(nativeDestinations);
      hostComponentRef &&
        Commands.setDestinations(hostComponentRef, nativeDestinations);
    }
  }, [props.destinations]);

  return (
    <ReactNative.View ref={focusGuideRef} {...props} collapsable={false} />
  );
};

const FocusGuideViewAndroidTV = (props: TVFocusGuideViewProps) => {
  const nativeDestinations = React.useMemo(
    () =>
      (props.destinations || [])
        .map(d => ReactNative.findNodeHandle(d))
        .filter(c => c !== 0 && c !== null && c !== undefined),
    [props.destinations],
  );

  return (
    <ReactNative.View
      {...props}
      focusable={props.focusable ?? true}
      destinations={nativeDestinations}
      collapsable={false}
    />
  );
};

const styles = ReactNative.StyleSheet.create({
  container: {
    minWidth: 1,
    minHeight: 1,
  },
});

module.exports = TVFocusGuideView;
