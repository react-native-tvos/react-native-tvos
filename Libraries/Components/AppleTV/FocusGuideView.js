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
const Platform = require('../../Utilities/Platform');

import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * The tags of the views the focus should go to
   */
  destinationTags: array,
|}>;

class FocusGuideView extends React.Component<Props> {
  render() {
    if (Platform.isTVOS) {
      return <RNFocusGuide {...this.props} />;
    }
    return <React.Fragment />;
  }
}

const RNFocusGuide = requireNativeComponent('RCTTVFocusGuideView', FocusGuide);

module.exports = FocusGuideView;
