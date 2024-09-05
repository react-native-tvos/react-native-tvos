/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {TabBarIOSProps} from './TabBarIOSProps';

import React from 'react';

const StyleSheet = require('../../StyleSheet/StyleSheet');
const View = require('../View/View');
const TabBarItemIOS = require('./TabBarItemIOS');

let showedDeprecationWarning = false;

class TabBarIOS extends React.Component<TabBarIOSProps> {
  static Item: any = TabBarItemIOS;

  componentDidMount() {
    if (!showedDeprecationWarning) {
      console.warn(
        'TabBarIOS and TabBarItemIOS are deprecated and will be removed in a future release. ' +
          'Please use react-native-tab-view instead.',
      );

      showedDeprecationWarning = true;
    }
  }

  render(): React.Node {
    return (
      <View style={[this.props.style, styles.tabGroup]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  },
});

module.exports = TabBarIOS;
