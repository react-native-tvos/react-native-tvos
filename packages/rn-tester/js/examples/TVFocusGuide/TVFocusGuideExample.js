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

const {Platform, View, StyleSheet, TouchableOpacity, Text, TVFocusGuideView} =
  ReactNative;

exports.framework = 'React';
exports.title = 'TVFocusGuide example Android & tvOS';
exports.description = 'tvOS focus guide API';
exports.displayName = 'TVFocusGuideExample';
exports.examples = [
  {
    title: 'TVFocusGuide',
    render(): React.Node {
      return <TVFocusGuideExample />;
    },
  },
];

const width = 100;
const height = 60;

const Button = React.forwardRef((props: $FlowFixMeProps, ref) => {
  return (
    <RNTesterThemeContext.Consumer>
      {theme => {
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={props.onPress}
            onFocus={props.onFocus}
            style={styles.buttonStyle}
            ref={ref}>
            <Text style={[{color: theme.LinkColor}, styles.buttonText]}>
              {props.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    </RNTesterThemeContext.Consumer>
  );
});

const ThemedView = (props: $FlowFixMeProps) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View style={[styles.buttonStyle, props.style]}>
          <Text style={[{color: theme.LabelColor}, styles.buttonText]}>
            {props.label}
          </Text>
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const TVFocusGuideExample = () => {
  const [destination, setDestination] = React.useState(null);
  const [destinationText, setDestinationText] = React.useState('');
  const destinations = destination?.current ? [destination?.current] : [];

  const buttonTopRight = React.useRef(null);
  const buttonBottomLeft = React.useRef(null);

  const rightButtonInFocusViewContainer = React.useRef(null);
  const containerDestinations = rightButtonInFocusViewContainer?.current
    ? [rightButtonInFocusViewContainer?.current]
    : [];

  const _setDestination = (o: ?Object, text: string) => {
    setDestination(o);
    setDestinationText(text);
  };

  return (
    <RNTesterThemeContext.Consumer>
      {theme => {
        return (
          <View style={styles.container}>
            <View style={styles.rowContainer}>
              <Button onPress={() => {}} label="Left Top" />
              <Button
                onPress={() => {}}
                onFocus={() => _setDestination(buttonBottomLeft, 'bottom left')}
                ref={buttonTopRight}
                label="Right Top"
              />
              <ThemedView label={`Focus guide points to ${destinationText}`} />
              <TVFocusGuideView
                style={styles.containerFocusGuide}
                destinations={containerDestinations}>
                <Button onPress={() => {}} label="Wrapped button 1" />
                <Button onPress={() => {}} label="Wrapped button 2" />
                <Button
                  ref={rightButtonInFocusViewContainer}
                  onPress={() => {}}
                  label="Wrapped button 3"
                />
              </TVFocusGuideView>
            </View>
            <View style={styles.rowContainer}>
              <Button
                onPress={() => {}}
                onFocus={() => _setDestination(buttonTopRight, 'top right')}
                ref={buttonBottomLeft}
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
                        style={[{color: theme.LabelColor}, styles.buttonText]}>
                        Focus guide
                      </Text>
                    </TVFocusGuideView>
                  );
                }}
              </RNTesterThemeContext.Consumer>
              <ThemedView label="" />
              <ThemedView
                style={{
                  width: width * 3,
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
};

const styles = StyleSheet.create({
  container: {
    marginTop: -20,
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 50,
  },
  buttonText: {
    fontSize: 15,
  },
  buttonStyle: {
    width,
    height,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  focusGuide: {
    width,
    height,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  containerFocusGuide: {
    backgroundColor: 'transparent',
    borderColor: 'blue',
    borderWidth: 2,
    flexDirection: 'row',
  },
});
