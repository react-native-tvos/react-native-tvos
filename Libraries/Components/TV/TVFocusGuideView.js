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
  enabled: ?Boolean,

  /**
   * The views the focus should go to
   */
  destinations: ?(Object[]),

  /**
   * How the TVFocusGuideView content safe padding should be applied. "null" to disable it.
   */
  safePadding?: 'vertical' | 'horizontal' | 'both' | null,
}>;

const TVFocusGuideView = ({
  enabled = true,
  safePadding,
  style,
  ...otherProps
}: TVFocusGuideViewProps): React.Node => {
  const paddingChoice = safePadding === undefined ? 'both' : safePadding;
  const focusGuidePadding =
    paddingChoice === 'both'
      ? {padding: 1}
      : paddingChoice === 'vertical'
      ? {paddingVertical: 1}
      : paddingChoice === 'horizontal'
      ? {paddingHorizontal: 1}
      : null;

  const enabledStyle = {display: enabled ? 'flex' : 'none'};

  /**
   * The client specified layout(using 'style' prop) should be applied the container view ReactNative.View.
   * And the focusGuide's layout should be overridden to wrap it fully inside the container view.
   * For example, if the client specifies 'marginLeft' property in the style prop,
   * then the TVFocusGuideView will apply the 'marginLeft' for both the parentView and the focusGuideView.
   * and so, the left margin is getting added twice and UI becomes incorrect.
   * The same is applicable for other layout properties.
   */
  const focusGuideStyle = [focusGuidePadding, style, styles.focusGuide];

  return (
    /**
     * The container needs to have at least a width of 1 and a height of 1.
     * Also, being the container, it shouldn't be possible to give it some padding.
     */
    <ReactNative.View style={[style, styles.container, enabledStyle]}>
      {Platform.isTV ? (
        Platform.isTVOS ? (
          <FocusGuideViewTVOS {...otherProps} style={focusGuideStyle} />
        ) : (
          <FocusGuideViewAndroidTV {...otherProps} style={focusGuideStyle} />
        )
      ) : (
        otherProps.children
      )}
    </ReactNative.View>
  );
};

const FocusGuideViewTVOS = (props: TVFocusGuideViewProps) => {
  const focusGuideRef = React.useRef(null);

  React.useEffect(() => {
    const nativeDestinations = (props.destinations || [])
      .map(d => ReactNative.findNodeHandle(d))
      .filter(c => c !== 0 && c !== null && c !== undefined);
    const hostComponentRef = ReactNativeShims.findHostInstance_DEPRECATED(
      focusGuideRef?.current,
    );
    hostComponentRef &&
      Commands.setDestinations(hostComponentRef, nativeDestinations);
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
    />
  );
};

const styles = ReactNative.StyleSheet.create({
  container: {
    minWidth: 1,
    minHeight: 1,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  focusGuide: {
    position: 'relative',
    opacity: 1,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    marginLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
  },
});

module.exports = TVFocusGuideView;
