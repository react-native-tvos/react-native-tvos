/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('react');

const {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = require('react-native');

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';

exports.displayName = 'ScrollViewLargeBlocksExample';
exports.title = '<ScrollView> with large text blocks';
exports.description =
  'Scroll view for focus navigation on Apple TV and Android TV';
exports.examples = [
  {
    title: '<ScrollView> with long text on TV platforms\n',
    description:
      'Ensure that TV platforms can scroll through a single block of text that is greater than the screen height',
    render: function(): React.Node {
      class BigTextBlock extends React.Component<
        {},
        {
          scrollDurationIndex: number,
          pageSizeIndex: number,
          snapToStart: boolean,
          snapToEnd: boolean,
        },
      > {
        constructor(props: Object) {
          super(props);
          this.state = {
            scrollDurationIndex: 0,
            pageSizeIndex: 0,
            snapToStart: false,
            snapToEnd: false,
          };
        }

        render() {
          return (
            <View>
              <View style={{flexDirection: 'row'}}>
                <Text style={styles.rowLabel}>Scroll duration:</Text>
                {scrollDurations.map((s, i) => {
                  return (
                    <Button
                      selected={this.state.scrollDurationIndex === i}
                      label={scrollDurationLabels[i]}
                      onPress={() => {
                        this.setState({
                          scrollDurationIndex: i,
                        });
                      }}
                    />
                  );
                })}
              </View>
              <View style={{flexDirection: 'row'}}>
                <Text style={styles.rowLabel}>
                  Page size (scroll distance per swipe):
                </Text>
                {pageSizes.map((s, i) => {
                  return (
                    <Button
                      selected={this.state.pageSizeIndex === i}
                      label={pageSizeLabels[i]}
                      onPress={() => {
                        this.setState({
                          pageSizeIndex: i,
                        });
                      }}
                    />
                  );
                })}
              </View>
              <ScrollView
                isTVSelectable={true}
                horizontal={true}
                tvParallaxProperties={{
                  pressDuration:
                    scrollDurations[this.state.scrollDurationIndex],
                }}
                snapToInterval={pageSizes[this.state.pageSizeIndex]}
                snapToStart={this.state.snapToStart}
                snapToEnd={this.state.snapToEnd}
                removeClippedSubviews={false}
                automaticallyAdjustContentInsets={false}
                style={styles.bigScrollView}>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text style={{fontSize: 40, width: 300}}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
              </ScrollView>
              <ScrollView
                isTVSelectable={true}
                tvParallaxProperties={{
                  pressDuration:
                    scrollDurations[this.state.scrollDurationIndex],
                }}
                snapToInterval={pageSizes[this.state.pageSizeIndex]}
                snapToStart={this.state.snapToStart}
                snapToEnd={this.state.snapToEnd}
                removeClippedSubviews={false}
                automaticallyAdjustContentInsets={false}
                style={styles.bigScrollView}>
                <Text style={{fontSize: 50}}>
                  Begin. Lorem ipsum dolor sit amet, consectetur adipiscing
                  elit, sed do eiusmod tempor incididunt ut labore et dolore
                  magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo
                  consequat. Duis aute irure dolor in reprehenderit in voluptate
                  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
                  sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum. Two. Lorem ipsum
                  dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi
                  ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat
                  nulla pariatur. Excepteur sint occaecat cupidatat non
                  proident, sunt in culpa qui officia deserunt mollit anim id
                  est laborum. Three. Lorem ipsum dolor sit amet, consectetur
                  adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo
                  consequat. Duis aute irure dolor in reprehenderit in voluptate
                  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
                  sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum. Four. Lorem ipsum
                  dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi
                  ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat
                  nulla pariatur. Excepteur sint occaecat cupidatat non
                  proident, sunt in culpa qui officia deserunt mollit anim id
                  est laborum. Five. Lorem ipsum dolor sit amet, consectetur
                  adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo
                  consequat. Duis aute irure dolor in reprehenderit in voluptate
                  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
                  sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum. Six. Lorem ipsum
                  dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi
                  ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                  reprehenderit in voluptate velit esse cillum dolore eu fugiat
                  nulla pariatur. Excepteur sint occaecat cupidatat non
                  proident, sunt in culpa qui officia deserunt mollit anim id
                  est laborum. End.
                </Text>
              </ScrollView>
              <View style={{flexDirection: 'row'}}>
                <Text style={styles.rowLabel}>
                  Snap to start or end when leaving focus:
                </Text>
                <Button
                  selected={this.state.snapToStart}
                  label="Snap to start"
                  onPress={() => {
                    this.setState(prevState => {
                      return {
                        snapToStart: !prevState.snapToStart,
                      };
                    });
                  }}
                />
                <Button
                  selected={this.state.snapToEnd}
                  label="Snap to end"
                  onPress={() => {
                    this.setState(prevState => {
                      return {
                        snapToEnd: !prevState.snapToEnd,
                      };
                    });
                  }}
                />
              </View>
            </View>
          );
        }
      }
      return <BigTextBlock />;
    },
  },
];

class Item extends React.PureComponent<{|
  msg?: string,
  style?: ViewStyleProp,
|}> {
  render() {
    return (
      <View style={[styles.item, this.props.style]}>
        <Text>{this.props.msg}</Text>
      </View>
    );
  }
}

const scrollDurations = [0.0, 0.2, 0.6, 1.0];

const scrollDurationLabels = ['default (0.3)', '0.2', '0.6', '1.0'];

const pageSizes = [0, 200, 600, 1000];

const pageSizeLabels = ['default (half view height)', '200', '600', '1000'];

let ITEMS = [...Array(12)].map((_, i) => `Item ${i}`);

const createItemRow = (msg, index) => <Item key={index} msg={msg} />;

const Button = ({label, onPress, selected}) => (
  <TouchableOpacity
    style={selected ? styles.buttonSelected : styles.button}
    activeOpacity={0.5}
    tvParallaxProperties={{pressedMagnification: 1.1}}
    onPress={onPress}>
    <Text>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300,
  },
  bigScrollView: {
    backgroundColor: '#eeeeee',
    height: 850,
  },
  horizontalScrollView: {
    height: 106,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 5,
  },
  rowLabel: {
    margin: 5,
    padding: 5,
    alignItems: 'center',
  },
  button: {
    margin: 5,
    padding: 5,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    borderRadius: 3,
  },
  buttonSelected: {
    margin: 5,
    padding: 5,
    alignItems: 'center',
    backgroundColor: '#ccccff',
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    margin: 5,
    padding: 5,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
  },
});
