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
import {Commands} from '../../Components/View/ViewNativeComponent';
import type {ViewProps} from '../View/ViewPropTypes';

const Platform = require('../../Utilities/Platform');

type FocusGuideProps = $ReadOnly<{
  ...ViewProps,

  /**
   * The views the focus should go to
   */
  destinations: ?(Object[]),
}>;

const TVFocusGuideView = (props: FocusGuideProps) => {
  const tvOSFocusGuideRef = React.useRef(null);
  const [nativeDestinations, setNativeDestinations] = React.useState([]);

  React.useEffect(() => {
    setNativeDestinations(
      (props.destinations || [])
        .map(d => ReactNative.findNodeHandle(d))
        .filter(c => c !== 0 && c !== null && c !== undefined),
    );
  }, [props.destinations]);

  React.useEffect(() => {
    const hostComponentRef =
      tvOSFocusGuideRef.current &&
      ReactNativeShims.findHostInstance_DEPRECATED(tvOSFocusGuideRef.current);
    hostComponentRef &&
      Commands.setDestinations(hostComponentRef, nativeDestinations);
  }, [nativeDestinations]);

  const renderContent = () => {
    if (Platform.isTV) {
      switch (Platform.OS) {
        case 'ios':
          return (
            <ReactNative.View
              style={[props.style, styles.focusGuideLayout]}
              ref={tvOSFocusGuideRef}>
              {props.children}
            </ReactNative.View>
          );
        case 'android':
          return (
            <ReactNative.View
              style={[props.style, styles.focusGuideLayout]}
              focusable={true}
              destinations={nativeDestinations}>
              {props.children}
            </ReactNative.View>
          );
      }
    }
    return Platform.props.children;
  };

  return (
    // Container view must have nonzero size
    <ReactNative.View style={[{minHeight: 1, minWidth: 1}, props.style]}>
      {/**
       * The client specified layout(using 'style' prop) should be applied the container view ReactNative.View.
       * And the focusGuide's layout shoule be overrided to wrap it fully inside the container view.
       * For example, if the client specifies 'marginLeft' property in the style prop,
       * then the TVFocusGuideView will apply the 'marginLeft' for both the parentView and the focusGuideView.
       * and so, the left margin is getting added twice and UI becomes incorrect.
       * The same is applicable for other layout properties.
       */}
      {renderContent()}
    </ReactNative.View>
  );
};

const styles = ReactNative.StyleSheet.create({
  focusGuideLayout: {
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
