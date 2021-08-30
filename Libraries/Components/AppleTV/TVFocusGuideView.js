/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');
const React = require('react');
const ReactNative = require('react-native');
const Platform = require('../../Utilities/Platform');
import type {ViewProps} from '../View/ViewPropTypes';

type FocusGuideProps = $ReadOnly<{
  ...ViewProps,

  /**
   * The views the focus should go to
   */
  destinations: ?(Object[]),
}>;

class TVFocusGuideView extends React.Component<FocusGuideProps> {
  _focusGuideRef: ?Object;
  _destinationTags: ?(number[]);

  componentDidUpdate() {
    const destinations = this.props.destinations || [];
    this._destinationTags = destinations.map(
      c => ReactNative.findNodeHandle(c) || 0,
    );
    this._focusGuideRef &&
      this._focusGuideRef.setNativeProps({
        destinationTags: this._destinationTags,
      });
  }

  render(): React.Node {
    return (
      // Container view must have nonzero size
      <ReactNative.View style={[{minHeight: 1, minWidth: 1}, this.props.style]}>
        {
          /**
           * The client specified layout(using 'style' prop) should be applied the container view ReactNative.View.
           * And the focusGuide's layout shoule be overrided to wrap it fully inside the container view.
           * For example, if the client specifies 'marginLeft' property in the style prop, 
           * then the TVFocusGuideView will apply the 'marginLeft' for both the parentView and the focusGuideView.
           * and so, the left margin is getting added twice and UI becomes incorrect. 
           * The same is applicable for other layout properties.
           */
        }
        {Platform.isTVOS ? (
          <RNFocusGuide
            style={[this.props.style, styles.focusGuideLayout]}
            ref={ref => (this._focusGuideRef = ref)}
            destinationTags={this._destinationTags}>
            {this.props.children}
          </RNFocusGuide>
        ) : (
          this.props.children
        )}
      </ReactNative.View>)
  }
}

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

const RNFocusGuide = requireNativeComponent('RCTTVFocusGuideView');

module.exports = TVFocusGuideView;
