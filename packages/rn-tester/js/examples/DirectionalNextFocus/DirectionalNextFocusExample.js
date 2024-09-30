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

import {RNTesterThemeContext} from '../../components/RNTesterTheme';

const React = require('react');
const ReactNative = require('react-native');

const {Platform, View, StyleSheet, TouchableOpacity, Text} = ReactNative;

exports.framework = 'React';
exports.title = 'TVDirectionalNextFocus example';
exports.description = 'tvOS nextFocus';
exports.displayName = 'TV Directional nextFocus example';
exports.examples = [
  {
    title: 'DirectionalNextFocus',
    render(): React.Node {
      return <DirectionalNextFocusExample />;
    },
  },
];

const scale = Platform.OS === 'android' ? 0.5 : 1.0;

const width = 200 * scale;
const height = 120 * scale;

const Button = React.forwardRef((props: $FlowFixMeProps, ref: $FlowFixMe) => {
  return (
    <RNTesterThemeContext.Consumer>
      {theme => {
        return (
          <TouchableOpacity
            hasTVPreferredFocus={props.hasTVPreferredFocus || false}
            nextFocusUp={props.nextFocusUp}
            nextFocusDown={props.nextFocusDown}
            nextFocusLeft={props.nextFocusLeft}
            nextFocusRight={props.nextFocusRight}
            activeOpacity={0.7}
            onPress={props.onPress}
            onFocus={props.onFocus}
            style={[styles.buttonStyle, props.style]}
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

const DirectionalNextFocusExample = () => {
  const [upDestination, setUpDestination]: [any, (any) => void] =
    React.useState(null);
  const [downDestination, setDownDestination]: [any, (any) => void] =
    React.useState(null);
  const [leftDestination, setLeftDestination]: [any, (any) => void] =
    React.useState(null);
  const [rightDestination, setRightDestination]: [any, (any) => void] =
    React.useState(null);

  const nextUpDestinationRef = React.useRef(null);
  const nextDownDestinationRef = React.useRef(null);
  const nextLeftDestinationRef = React.useRef(null);
  const nextRightDestinationRef = React.useRef(null);

  React.useEffect(() => {
    setUpDestination(nextUpDestinationRef?.current);
    setDownDestination(nextDownDestinationRef?.current);
    setLeftDestination(nextLeftDestinationRef?.current);
    setRightDestination(nextRightDestinationRef?.current);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <Button
          nextFocusUp={upDestination}
          nextFocusDown={downDestination}
          nextFocusLeft={leftDestination}
          nextFocusRight={rightDestination}
          label="Starting point"
        />
        <Button ref={nextUpDestinationRef} label="nextUp destination" />
        <View style={styles.containerFocusGuide}>
          <Button label="Wrapped button 1" />
          <Button ref={nextDownDestinationRef} label="nextDown destination" />
          <Button label="Wrapped button 3" />
        </View>
      </View>
      <View style={styles.rowContainer}>
        <Button ref={nextRightDestinationRef} label="nextRight destination" />
        <ThemedView label="" />
        <Button
          ref={nextLeftDestinationRef}
          hasTVPreferredFocus={true}
          style={{width: width * 3}}
          label="nextLeft destination"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 0.5 * width,
  },
  buttonText: {
    fontSize: 30 * scale,
  },
  buttonStyle: {
    width,
    height,
    margin: 20 * scale,
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
