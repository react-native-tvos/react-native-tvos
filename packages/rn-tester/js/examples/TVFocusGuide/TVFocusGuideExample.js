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

import {RNTesterThemeContext} from '../../components/RNTesterTheme';

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

class Button extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={this.props.onPress}
              onFocus={this.props.onFocus}
              style={this.props.style}
              ref={this.props.ref}>
              <Text style={[{color: theme.LinkColor}, styles.buttonText]}>
                {this.props.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

class ThemedView extends React.Component<$FlowFixMeProps> {
  render() {
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View style={this.props.style}>
              <Text style={[{color: theme.LabelColor}, styles.buttonText]}>
                {this.props.label}
              </Text>
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

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
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View style={styles.container}>
              <View style={styles.rowContainer}>
                <Button
                  onPress={() => {}}
                  style={{
                    width,
                    height,
                  }}
                  label="Left Top"
                />
                <Button
                  onPress={() => {}}
                  onFocus={() =>
                    this._setDestination(this.buttonBottomLeft, 'bottom left')
                  }
                  ref={component => (this.buttonTopRight = component)}
                  style={{
                    width,
                    height,
                  }}
                  label="Right Top"
                />
                <ThemedView
                  style={{
                    width,
                    height,
                  }}
                  label={`Focus guide points to ${this.state.destinationText}`}
                />
                <TVFocusGuideView
                  style={styles.containerFocusGuide}
                  destinations={[this.rightButtonInFocusViewContainer]}>
                  <Button
                    onPress={() => {}}
                    style={{
                      width,
                      height,
                    }}
                    label="Wrapped button 1"
                  />
                  <Button
                    onPress={() => {}}
                    style={{
                      width,
                      height,
                    }}
                    label="Wrapped button 2"
                  />
                  <Button
                    ref={component =>
                      (this.rightButtonInFocusViewContainer = component)
                    }
                    onPress={() => {}}
                    style={{
                      width,
                      height,
                    }}
                    label="Wrapped button 3"
                  />
                </TVFocusGuideView>
              </View>
              <View style={styles.rowContainer}>
                <Button
                  onPress={() => {}}
                  onFocus={() =>
                    this._setDestination(this.buttonTopRight, 'top right')
                  }
                  ref={component => (this.buttonBottomLeft = component)}
                  style={{
                    width,
                    height,
                  }}
                  label="Left Bottom"
                />
                <RNTesterThemeContext.Consumer>
                  {theme => {
                    return (
                      <TVFocusGuideView
                        style={[
                          {backgroundColor: theme.TertiarySystemFillColor},
                          styles.focusGuide,
                        ]}
                        destinations={destinations}>
                        <Text
                          style={[
                            {color: theme.LabelColor},
                            styles.buttonText,
                          ]}>
                          Focus guide
                        </Text>
                      </TVFocusGuideView>
                    );
                  }}
                </RNTesterThemeContext.Consumer>
                <View
                  style={{
                    width,
                    height,
                  }}
                />
                <ThemedView
                  style={{
                    width: width * 3,
                    height,
                  }}
                  label="Blue focus guide container above always points to button 3
                    if navigating from outside"
                />
              </View>
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: -20,
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
  },
  containerFocusGuide: {
    backgroundColor: 'transparent',
    borderColor: 'blue',
    borderWidth: 2,
    flexDirection: 'row',
  },
});
