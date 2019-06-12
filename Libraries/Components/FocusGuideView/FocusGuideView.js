/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import PropTypes from 'prop-types';
import React from 'react';
import { Platform, requireNativeComponent } from 'react-native';

class FocusGuideView extends React.Component {
  render() {
    if (Platform.isTVOS) {
      return <RNFocusGuide {...this.props} />;
    }
    return <React.Fragment />;
  }
}
FocusGuide.propTypes = {
  destinationTags: PropTypes.array,
};

FocusGuide.defaultProps = {
  destinationTags: undefined,
};

const RNFocusGuide = requireNativeComponent('RCTTVFocusGuideView', FocusGuide);

module.exports = FocusGuideView;
