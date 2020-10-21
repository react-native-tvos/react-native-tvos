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
        {Platform.isTVOS ? (
          <RNFocusGuide
            style={this.props.style}
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

const RNFocusGuide = requireNativeComponent('RCTTVFocusGuideView');

module.exports = TVFocusGuideView;
