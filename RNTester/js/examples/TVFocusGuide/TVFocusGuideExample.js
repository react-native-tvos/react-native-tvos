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
    render(): React.Node {
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

  rightButtonInFocusViewContainer: ?Object;

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
              Pink focus guide points to {this.state.destinationText}
            </Text>
          </View>
          <TVFocusGuideView style={styles.containerFocusGuide} destinations={[this.rightButtonInFocusViewContainer]}>
            <TouchableOpacity
              onPress={() => {}}
              style={{
                width,
                height,
              }}>
              <Text style={styles.buttonText}>Wrapped button 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {}}
              style={{
                width,
                height,
              }}>
              <Text style={styles.buttonText}>Wrapped button 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              ref={component => (this.rightButtonInFocusViewContainer = component)}
              onPress={() => {}}
              style={{
                width,
                height,
              }}>
              <Text style={styles.buttonText}>Wrapped button 3</Text>
            </TouchableOpacity>
          </TVFocusGuideView>
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
          <TVFocusGuideView style={styles.focusGuide} destinations={destinations}>
            <Text style={styles.buttonText}>Focus guide</Text>
          </TVFocusGuideView>
          <View
            style={{
              width,
              height,
            }}>
          </View>
          <View
            style={{
              width: width*3,
              height,
            }}>
            <Text style={styles.buttonText}>
              Blue focus guide container above always points to button 3 if navigating from outside
            </Text>
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
  containerFocusGuide: {
    backgroundColor: 'transparent',
    borderColor: 'blue',
    borderWidth: 2,
    flexDirection: 'row',
  },
});
