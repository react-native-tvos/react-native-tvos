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

import {useRNTesterTheme} from '../../components/RNTesterTheme';

const React = require('react');
const ReactNative = require('react-native');

const {useRef, useState, useEffect} = React;
const {Platform, View, StyleSheet, TouchableOpacity, findNodeHandle} =
  ReactNative;

const RNText = ReactNative.Text;

exports.framework = 'React';
exports.title = 'TVFocus edge cases';
exports.description = 'Focus edge cases';
exports.displayName = 'TVFocusGuideEdgeCases';
exports.examples = [
  {
    title: 'Edge case',
    render(): React.Node {
      return <TVFocusGuideEdgeCases />;
    },
  },
];

const Text = ({style, children, tvHiddenFromFocus}) => {
  const theme = useRNTesterTheme();
  return (
    <RNText
      style={[styles.text, {color: theme.LabelColor}, style]}
      tvHiddenFromFocus={tvHiddenFromFocus}>
      {children}
    </RNText>
  );
};

const Button = ({
  text,
  style,
  pressedItemId,
  onPress,
  hasTVPreferredFocus,
  onFocus,
}) => {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const pressed = pressedItemId === findNodeHandle(ref.current);
  const handleOnPress = () => {
    if (onPress) {
      onPress(findNodeHandle(ref.current));
    }
  };
  return (
    <TouchableOpacity
      ref={ref}
      style={[
        style,
        {backgroundColor: pressed ? 'green' : focused ? 'red' : 'blue'},
      ]}
      onFocus={() => {
        setFocused(true);
        onFocus(text);
      }}
      onBlur={() => {
        setFocused(false);
      }}
      onPress={handleOnPress}
      activeOpacity={0.7}
      hasTVPreferredFocus={hasTVPreferredFocus}>
      <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const ShowTextRef = ({nameRef}) => {
  const [date, setDate] = useState('--');
  useEffect(() => {
    const i = setInterval(() => {
      setDate(new Date().toISOString());
    }, 200);
    return () => clearInterval(i);
  }, []);
  return (
    <View>
      <Text style={styles.title}>
        Last onFocus: {nameRef.current} @{date}
      </Text>
    </View>
  );
};

const TVFocusGuideEdgeCases = () => {
  const focusedNameRef = useRef('no focus');
  const [delayedFocus, setDelayedFocus] = useState(0);
  const focusCount = useRef(0);
  useEffect(() => {
    const i = setInterval(() => {
      focusCount.current = focusCount.current + 1;
      setDelayedFocus(focusCount.current);
    }, 2000);
    return () => clearInterval(i);
  }, []);

  const setFocusedName = name => {
    focusedNameRef.current = name;
  };

  if (!Platform.isTV) {
    return (
      <View>
        <Text>This example is intended to be run on TV.</Text>
      </View>
    );
  }

  return (
    <>
      <Button
        style={styles.barelyVisibleTop}
        text="Button barely visible top [2]"
        hasTVPreferredFocus={delayedFocus === 2}
        onFocus={setFocusedName}
      />
      <Button
        style={styles.exampleButton}
        text="Button before [1]"
        onFocus={setFocusedName}
        hasTVPreferredFocus={delayedFocus === 1}
      />
      <Button
        style={styles.barelyVisibleLeft}
        text="Button barely visible left"
        onFocus={setFocusedName}
      />
      <Button
        style={styles.outOfScreenLeft}
        text="Button out of screen visible left [3]"
        hasTVPreferredFocus={delayedFocus === 3}
        onFocus={setFocusedName}
      />
      <Button
        style={styles.outOfScreenRight}
        text="Button out of screen visible right [4]"
        hasTVPreferredFocus={delayedFocus === 4}
        onFocus={setFocusedName}
      />
      <Button
        style={styles.transparentItem}
        text="Transparent button [5]"
        hasTVPreferredFocus={delayedFocus === 5}
        onFocus={setFocusedName}
      />
      <View style={styles.transparentItem}>
        <Button
          style={styles.exampleButton}
          text="Button with transparent parent [6]"
          hasTVPreferredFocus={delayedFocus === 6}
          onFocus={setFocusedName}
        />
      </View>
      <View>
        <Text>Delayed focus: {'' + delayedFocus}</Text>
      </View>
      <ShowTextRef nameRef={focusedNameRef} />
      <Button
        style={styles.exampleButton}
        text="Button after [7]"
        onFocus={setFocusedName}
        hasTVPreferredFocus={delayedFocus === 7}
      />
    </>
  );
};

const scale = Platform.OS === 'ios' ? 1.0 : 0.5;

const styles = StyleSheet.create({
  outOfScreenTop: {
    position: 'absolute',
    top: -150,
    height: 50,
  },
  outOfScreenBottom: {
    position: 'absolute',
    bottom: -50,
    height: 50,
  },
  outOfScreenRight: {
    position: 'absolute',
    top: 10,
    left: 2500,
  },
  outOfScreenLeft: {
    position: 'absolute',
    top: 10,
    left: -1000,
  },
  barelyVisibleRight: {
    position: 'absolute',
    top: 10,
    right: -100,
    width: 101,
  },
  barelyVisibleLeft: {
    position: 'absolute',
    top: 10,
    left: -100,
    width: 101,
  },
  barelyVisibleTop: {
    position: 'absolute',
    top: -100,
    height: 50,
    padding: 0,
  },
  transparentItem: {
    opacity: 0,
  },
  section: {
    flex: 1,
    borderWidth: 1,
    padding: 24 * scale,
  },
  title: {
    fontSize: 32 * scale,
    marginBottom: 24 * scale,
  },
  exampleContainer: {
    flex: 1,
  },
  exampleDescription: {
    fontSize: 20 * scale,
    fontWeight: 'bold',
    marginBottom: 24 * scale,
    opacity: 0.8,
  },
  exampleContent: {
    flexDirection: 'row',
  },
  exampleFocusGuide: {
    backgroundColor: 'cyan',
    flexDirection: 'row',
  },
  exampleButton: {
    marginVertical: 10 * scale,
    minWidth: 100 * scale,
    height: 60 * scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 18 * scale,
  },
});
