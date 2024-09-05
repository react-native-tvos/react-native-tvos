/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

import React from 'react';

const StyleSheet = require('../../StyleSheet/StyleSheet');
const View = require('../View/View');

let showedDeprecationWarning = false;

class DummyTab extends React.Component {
  componentDidMount() {
    if (!showedDeprecationWarning) {
      console.warn(
        'TabBarIOS and TabBarItemIOS are deprecated and will be removed in a future release. ' +
          'Please use react-native-tab-view instead.',
      );

      showedDeprecationWarning = true;
    }
  }

  render() {
    if (!this.props.selected) {
      return <View />;
    }
    return (
      <View style={[this.props.style, styles.tab]}>{this.props.children}</View>
    );
  }
}

const styles = StyleSheet.create({
  tab: {
    // TODO(5405356): Implement overflow: visible so position: absolute isn't useless
    // position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderColor: 'red',
    borderWidth: 1,
  },
});

module.exports = DummyTab;
