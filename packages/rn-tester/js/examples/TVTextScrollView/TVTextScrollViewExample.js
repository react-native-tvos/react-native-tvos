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
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TVTextScrollView,
  View,
} = require('react-native');

const screenHeight = Dimensions.get('window').height;
const scale = screenHeight / 1080;

exports.displayName = 'TVTextScrollView';
exports.title = '<TVTextScrollView> with large text blocks';
exports.description =
  'Scroll view for focus navigation on Apple TV and Android TV';
exports.examples = [
  {
    title: '<TVTextScrollView> with long text on TV platforms\n',
    description:
      'Ensure that TV platforms can scroll through a single block of text that is greater than the screen height',
    render: function (): React.Node {
      class BigTextBlock extends React.Component<
        {},
        {
          scrollDurationIndex: number,
          pageSizeIndex: number,
          snapToStart: boolean,
          snapToEnd: boolean,
          horizontalScrollerFocused: boolean,
          verticalScrollerFocused: boolean,
        },
      > {
        constructor(props: Object) {
          super(props);
          this.state = {
            scrollDurationIndex: 0,
            pageSizeIndex: 0,
            snapToStart: false,
            snapToEnd: false,
            horizontalScrollerFocused: false,
            verticalScrollerFocused: false,
          };
        }

        render(): React.Node {
          return (
            <View style={styles.container}>
              <View style={{flexDirection: 'row'}}>
                <Text style={styles.itemText}>Scroll duration:</Text>
                {scrollDurations.map((s, i) => {
                  return (
                    <Button
                      key={i}
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
                <Text style={styles.itemText}>
                  Page size (scroll distance per swipe):
                </Text>
                {pageSizes.map((s, i) => {
                  return (
                    <Button
                      key={i}
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
              <TVTextScrollView
                scrollDuration={scrollDurations[this.state.scrollDurationIndex]}
                pageSize={pageSizes[this.state.pageSizeIndex]}
                horizontal={true}
                snapToStart={this.state.snapToStart}
                snapToEnd={this.state.snapToEnd}
                onFocus={() => {
                  this.setState({
                    horizontalScrollerFocused: true,
                  });
                }}
                onBlur={() => {
                  this.setState({
                    horizontalScrollerFocused: false,
                  });
                }}
                style={
                  this.state.horizontalScrollerFocused
                    ? styles.bigScrollViewFocused
                    : styles.bigScrollView
                }>
                {ITEMCOMPONENTS}
              </TVTextScrollView>
              <TVTextScrollView
                scrollDuration={scrollDurations[this.state.scrollDurationIndex]}
                pageSize={pageSizes[this.state.pageSizeIndex]}
                snapToStart={this.state.snapToStart}
                snapToEnd={this.state.snapToEnd}
                onFocus={() => {
                  this.setState({
                    verticalScrollerFocused: true,
                  });
                }}
                onBlur={() => {
                  this.setState({
                    verticalScrollerFocused: false,
                  });
                }}
                style={
                  this.state.verticalScrollerFocused
                    ? styles.bigScrollViewFocused
                    : styles.bigScrollView
                }>
                <Text style={{fontSize: 50}}>{ITEMS.join('\n')}</Text>
              </TVTextScrollView>
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
      return (
        <View>
          <View style={{height: 400 * scale}} />
          <BigTextBlock />
        </View>
      );
    },
  },
];

class Item extends React.PureComponent<{|
  msg?: string,
  style?: any,
|}> {
  render(): React.Node {
    return (
      <View style={[styles.item, this.props.style]}>
        <Text style={styles.itemText}>{this.props.msg}</Text>
      </View>
    );
  }
}

const scrollDurations = [0.0, 0.2, 0.6, 1.0];

const scrollDurationLabels = ['default (0.3)', '0.2', '0.6', '1.0'];

const pageSizes = [0, 200, 600, 1000];

const pageSizeLabels = ['default (half view height)', '200', '600', '1000'];

const ITEMS = [...Array(12)].map(
  (
    _,
    i,
  ) => `Item ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.`,
);

const ITEMCOMPONENTS = ITEMS.map((m, i) => <Item key={i} msg={m} />);

const Button = ({
  label,
  onPress,
  selected,
}: {
  label: string,
  onPress?: () => void,
  selected?: boolean,
}) => (
  <TouchableOpacity
    style={selected ? styles.buttonSelected : styles.button}
    activeOpacity={0.5}
    tvParallaxProperties={{pressMagnification: 1.1}}
    onPress={onPress}>
    <Text style={styles.itemText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginTop: -300 * scale,
  },
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300 * scale,
  },
  bigScrollView: {
    backgroundColor: '#eeeeee',
    height: 600 * scale,
  },
  bigScrollViewFocused: {
    backgroundColor: '#ccffcc',
    height: 600 * scale,
  },
  horizontalScrollView: {
    height: 106 * scale,
  },
  text: {
    fontSize: 16 * scale,
    fontWeight: 'bold',
    margin: 6,
  },
  rowLabel: {
    margin: 6 * scale,
    padding: 6 * scale,
    alignItems: 'center',
  },
  button: {
    margin: 6 * scale,
    padding: 6 * scale,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    borderRadius: 3 * scale,
  },
  buttonSelected: {
    margin: 6 * scale,
    padding: 6 * scale,
    alignItems: 'center',
    backgroundColor: '#ccccff',
    borderRadius: 4 * scale,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    margin: 6 * scale,
    padding: 6 * scale,
    backgroundColor: '#cccccc',
    borderRadius: 4 * scale,
    width: 300 * scale,
  },
  itemText: {
    fontSize: 30 * scale,
  },
});
