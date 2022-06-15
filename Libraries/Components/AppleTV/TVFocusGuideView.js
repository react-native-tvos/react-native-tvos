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
import {Commands} from '../../Components/View/ViewNativeComponent';
import type {ViewProps} from '../View/ViewPropTypes';

type FocusGuideProps = $ReadOnly<{
  ...ViewProps,

  /**
   * The views the focus should go to
   */
  destinations: ?(Object[]),

  /**
   * How the TVFocusGuideView content safe padding should be applied. "null" to disable it.
   */
  safePadding?: 'vertical' | 'horizontal' | 'both' | null,
}>;

const TVFocusGuideView = (props: FocusGuideProps): React.Node => {
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

  const safePadding =
    props.safePadding === undefined ? 'both' : props.safePadding;
  const focusGuidePadding =
    safePadding === 'both'
      ? {padding: 1}
      : safePadding === 'vertical'
      ? {paddingVertical: 1}
      : safePadding === 'horizontal'
      ? {paddingHorizontal: 1}
      : null;

  return (
    /**
     * The container needs to have at least a width of 1 and a height of 1.
     * Also, being the container, it shouldn't be possible to give it some padding.
     */
    <ReactNative.View style={[props.style, styles.container]}>
      {/**
       * The client specified layout(using 'style' prop) should be applied the container view ReactNative.View.
       * And the focusGuide's layout should be overridden to wrap it fully inside the container view.
       * For example, if the client specifies 'marginLeft' property in the style prop,
       * then the TVFocusGuideView will apply the 'marginLeft' for both the parentView and the focusGuideView.
       * and so, the left margin is getting added twice and UI becomes incorrect.
       * The same is applicable for other layout properties.
       */}
      {Platform.isTVOS ? (
        <ReactNative.View
          style={[focusGuidePadding, props.style, styles.focusGuide]}
          ref={focusGuideRef}>
          {props.children}
        </ReactNative.View>
      ) : (
        props.children
      )}
    </ReactNative.View>
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
