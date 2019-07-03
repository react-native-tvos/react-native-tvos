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
const ReactNative = require('react-native-tvos');

const {
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TVFocusGuideView,
} = ReactNative;

exports.framework = 'React';
exports.title = 'TVFocusGuide example';
exports.description = 'tvOS focus guide API';
exports.examples = [
  {
    title: 'TVFocusGuide',
    render() {
      return <TVFocusGuideExample />;
    },
  },
];

const padding = 100;
const width = 200;
const height = 120;

class TVFocusGuideExample extends React.Component<
  $FlowFixMeProps,
  {
    destination: ?Object,
    destinationText: string,
  },
> {
  constructor(props: Object) {
    super(props);
    this.state = {
      destination: undefined,
      destinationText: 'null',
    };
  }

  buttonTopRight: ?Object;

  buttonBottomLeft: ?Object;

  _setDestination(destination: ?Object, destinationText: string) {
    this.setState({
      destination,
      destinationText,
    });
  }

  render() {
    if (!Platform.isTVOS) {
      return (
        <View>
          <Text>This example is intended to be run on Apple TV.</Text>
        </View>
      );
    }
    const destinations = this.state.destination ? [this.state.destination] : [];
    return (
      <View style={styles.container}>
        <View style={styles.rowContainer}>
          <TouchableOpacity
            onPress={() => {}}
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>Left Top</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {}}
            onFocus={() =>
              this._setDestination(this.buttonBottomLeft, 'bottom left')
            }
            ref={component => (this.buttonTopRight = component)}
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>Right Top</Text>
          </TouchableOpacity>
          <View
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>
              Focus guide points to {this.state.destinationText}
            </Text>
          </View>
        </View>
        <View style={styles.rowContainer}>
          <TouchableOpacity
            onPress={() => {}}
            onFocus={() =>
              this._setDestination(this.buttonTopRight, 'top right')
            }
            ref={component => (this.buttonBottomLeft = component)}
            style={{
              width,
              height,
            }}>
            <Text style={styles.buttonText}>Left Bottom</Text>
          </TouchableOpacity>
          <View style={styles.focusGuide}>
            <Text style={styles.buttonText}>Focus guide</Text>
            <TVFocusGuideView destinations={destinations} />
          </View>
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
});
