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

import type {TabBarIOSProps} from './TabBarIOSProps';

const StyleSheet = require('../../StyleSheet/StyleSheet');
const RCTTabBar = require('./RCTTabBarNativeComponent');
const TabBarItemIOS = require('./TabBarItemIOS');
const React = require('react');

let showedDeprecationWarning = true;

class TabBarIOS extends React.Component<TabBarIOSProps> {
  static Item: React.Node = TabBarItemIOS;

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
      <RCTTabBar
        style={[styles.tabGroup, this.props.style]}
        unselectedTintColor={this.props.unselectedTintColor}
        unselectedItemTintColor={this.props.unselectedItemTintColor}
        tintColor={this.props.tintColor}
        barTintColor={this.props.barTintColor}
        barStyle={this.props.barStyle}
        itemPositioning={this.props.itemPositioning}
        translucent={this.props.translucent !== false}>
        {this.props.children}
      </RCTTabBar>
    );
  }
}

const styles = StyleSheet.create({
  tabGroup: {
    flex: 1,
  },
});

module.exports = TabBarIOS;
