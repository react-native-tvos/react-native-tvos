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

const React = require('react');
const ReactNative = require('react-native');

const {View, StyleSheet, TouchableOpacity, Text, findNodeHandle} = ReactNative;

exports.framework = 'React';
exports.title = 'DirectionalNextFocus example';
exports.description = 'tvOS nextFocus';
exports.examples = [
  {
    title: 'DirectionalNextFocus',
    render(): React.Node {
      return <DirectionalNextFocusExample />;
    },
  },
];

const padding = 100;
const width = 200;
const height = 120;

class DirectionalNextFocusExample extends React.Component<
  $FlowFixMeProps,
  {
    destinations: {
      up: ?Object,
      down: ?Object,
      left: ?Object,
      right: ?Object,
    },
  },
> {
  constructor(props: Object) {
    super(props);
    this.state = {
      destinations: {
        up: undefined,
        down: undefined,
        left: undefined,
        right: undefined,
      },
    };
  }

  render() {
    const {destinations} = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.rowContainer}>
          <TouchableOpacity
            nextFocusUp={destinations.up}
            nextFocusDown={destinations.down}
            nextFocusLeft={destinations.left}
            nextFocusRight={destinations.right}
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>Starting point</Text>
          </TouchableOpacity>
          <TouchableOpacity
            ref={component =>
              this.setState(prevState => ({
                destinations: {
                  ...prevState.destinations,
                  up: findNodeHandle(component),
                },
              }))
            }
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>nextUp destination</Text>
          </TouchableOpacity>
          <View style={styles.containerFocusGuide}>
            <TouchableOpacity
              style={{
                width,
                height,
              }}>
              <Text style={styles.buttonText}>Wrapped button 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              ref={component =>
                this.setState(prevState => ({
                  destinations: {
                    ...prevState.destinations,
                    down: findNodeHandle(component),
                  },
                }))
              }
              style={{
                width,
                height,
              }}>
              <Text style={styles.buttonText}>nextDown destination</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width,
                height,
              }}>
              <Text style={styles.buttonText}>Wrapped button 3</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rowContainer}>
          <TouchableOpacity
            ref={component =>
              this.setState(prevState => ({
                destinations: {
                  ...prevState.destinations,
                  right: findNodeHandle(component),
                },
              }))
            }
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>nextRight destination</Text>
          </TouchableOpacity>
          <View
            style={{
              width,
              height,
            }}
          />
          <TouchableOpacity
            ref={component =>
              this.setState(prevState => ({
                destinations: {
                  ...prevState.destinations,
                  left: findNodeHandle(component),
                },
              }))
            }
            style={{
              width: width * 3,
              height,
            }}>
            <Text style={styles.buttonText}>nextLeft destination</Text>
            <Text style={styles.buttonText}>
              does not work because there is no "real" focusable in the
              direction
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: -20,
    backgroundColor: 'transparent',
  },
  rowContainer: {
    flexDirection: 'row',
    padding,
  },
  buttonText: {
    fontSize: 30,
  },
  focusGuide: {
    width,
    height,
    backgroundColor: 'pink',
    opacity: 0.3,
  },
  containerFocusGuide: {
    backgroundColor: 'transparent',
    borderColor: 'blue',
    borderWidth: 2,
    flexDirection: 'row',
  },
});
