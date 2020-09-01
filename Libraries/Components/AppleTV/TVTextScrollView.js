/**
 * Copyright (c) Douglas Lowder.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

const React = require('react');
const ScrollView = require('../ScrollView/ScrollView');

/**
 * Convenience wrapper to create a scroll view that will scroll correctly
 * using swipe gestures on tvOS, even if the scroll view has no focusable
 * subviews.
 *
 * The main use case would be when a large scrolling block of text needs
 * to be presented to the user.
 *
 * Props:
 *
 */

import typeof Props from '../ScrollView/ScrollView';

class TVTextScrollView extends React.Component<{
  ...Props,
  scrollDuration?: number,
  pageSize?: number,
  snapToStart?: boolean,
  snapToEnd?: boolean,
  children?: React.Node,
}> {
  render(): React.Node | React.Element<string> {
    const props: $FlowFixMe = {
      ...this.props,
      tvParallaxProperties: {
        pressDuration: this.props.scrollDuration || 0.0,
      },
      isTVSelectable: true,
      snapToInterval: this.props.pageSize || 0.0,
      removeClippedSubviews: false,
      automaticallyAdjustContentInsets: false,
    };
    return <ScrollView {...props}>{this.props.children}</ScrollView>;
  }
}

module.exports = TVTextScrollView;
