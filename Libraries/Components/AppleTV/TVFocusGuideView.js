/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const requireNativeComponent = require('requireNativeComponent');
const React = require('react');
const ReactNative = require('ReactNative');
const Platform = require('Platform');
import type {ViewProps} from 'ViewPropTypes';

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

  render() {
    if (Platform.isTVOS) {
      return (
        <RNFocusGuide
          ref={ref => (this._focusGuideRef = ref)}
          destinationTags={this._destinationTags}
        />
      );
    }
    return <React.Fragment />;
  }
}

const RNFocusGuide = requireNativeComponent('RCTTVFocusGuideView');

module.exports = TVFocusGuideView;
