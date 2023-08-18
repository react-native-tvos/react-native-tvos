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

import {useRNTesterTheme} from '../../components/RNTesterTheme';

const {Platform, View, StyleSheet, Pressable, Text, TVFocusGuideView} =
  ReactNative;

exports.framework = 'React';
exports.title = 'TVFocusGuide example';
exports.description = 'Focus guide API';
exports.displayName = 'TVFocusGuideExample';
exports.examples = [
  {
    title: 'TVFocusGuide',
    render(): React.Node {
      return <TVFocusGuideExample />;
    },
  },
];

const screenHeight = ReactNative.Dimensions.get('window').height;
const scale = screenHeight / 1080;
const width = 200 * scale;
const height = 120 * scale;

const Button = React.forwardRef((props: $FlowFixMeProps, ref) => {
  const theme = useRNTesterTheme();
  return (
    <Pressable
      onPress={props.onPress}
      onFocus={props.onFocus}
      style={({pressed, focused}) =>
        focused ? styles.buttonStyleFocused : styles.buttonStyle
      }
      ref={ref}>
      <Text style={[{color: theme.LinkColor}, styles.buttonText]}>
        {props.label}
      </Text>
    </Pressable>
  );
});

const ThemedView = (props: $FlowFixMeProps) => {
  const theme = useRNTesterTheme();
  return (
    <View style={[styles.buttonStyle, props.style]}>
      <Text style={[{color: theme.LabelColor}, styles.buttonText]}>
        {props.label}
      </Text>
    </View>
  );
};

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

  const theme = useRNTesterTheme();
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
        <TVFocusGuideView
          style={[
            {backgroundColor: theme.TertiarySystemFillColor},
            styles.focusGuide,
          ]}
          destinations={destinations}>
          <Text style={[{color: theme.LabelColor}, styles.buttonText]}>
            Focus guide
          </Text>
        </TVFocusGuideView>
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
};

const marginSize = 20 * scale;
const styles = StyleSheet.create({
  container: {
    marginTop: -marginSize,
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 100 * scale,
  },
  buttonText: {
    fontSize: 30 * scale,
  },
  buttonStyle: {
    width,
    height,
    marginLeft: marginSize,
    marginRight: marginSize,
    marginTop: marginSize,
    marginBottom: marginSize,
  },
  buttonStyleFocused: {
    opacity: 0.5,
    width,
    height,
    marginLeft: marginSize,
    marginRight: marginSize,
    marginTop: marginSize,
    marginBottom: marginSize,
  },
  focusGuide: {
    width,
    height,
    marginLeft: marginSize,
    marginRight: marginSize,
    marginTop: marginSize,
    marginBottom: marginSize,
  },
  containerFocusGuide: {
    backgroundColor: 'transparent',
    borderColor: 'blue',
    borderWidth: 2,
    flexDirection: 'row',
  },
});
