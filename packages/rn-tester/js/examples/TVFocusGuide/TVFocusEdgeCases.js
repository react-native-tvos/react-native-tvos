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
const {
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
  TVFocusGuideView,
  findNodeHandle,
} = ReactNative;

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
    <RNText style={[styles.text, {color: theme.LabelColor}, style]} tvHiddenFromFocus={tvHiddenFromFocus}>
      {children}
    </RNText>
  );
};

const Button = ({
  text,
  style,
  pressedItemId,
  onPress,
  triggerOnPressOnMount,
                  hasTVPreferredFocus,
}) => {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const pressed = pressedItemId === findNodeHandle(ref.current);
  const handleOnPress = () => {
    if (onPress) {
      onPress(findNodeHandle(ref.current));
    }
  };
  useEffect(() => {
    if (triggerOnPressOnMount) {
      handleOnPress();
    }
  }, []);
  return (
    <TouchableOpacity
      ref={ref}
      style={[
        style,
        {backgroundColor: pressed ? 'green' : focused ? 'red' : 'blue'},
      ]}
      onFocus={() => {
        setFocused(true);
      }}
      onBlur={() => {
        setFocused(false);
      }}
      onPress={handleOnPress}
      activeOpacity={0.7}
      hasTVPreferredFocus={hasTVPreferredFocus}
    >
      <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const Example = ({description, focusGuideStyle, safePadding}) => {
  const [enabled, setEnabled] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const destination = destinations[0];

  const onItemPressed = target => {
    setDestinations([target]);
    setEnabled(!enabled);
  };

  return (
    <View style={styles.exampleContainer}>
      <Text style={styles.exampleDescription}>{description}</Text>
      <View style={styles.exampleContent}>
        <Button style={styles.exampleButton} text="Button 1" />
        <TVFocusGuideView
          style={[styles.exampleFocusGuide, focusGuideStyle]}
          destinations={destinations}
          safePadding={safePadding}>
          <Button
            style={styles.exampleButton}
            text="Button 2"
            onPress={onItemPressed}
            pressedItemId={destination}
          />
          <Button
            style={styles.exampleButton}
            text="Button 3"
            onPress={onItemPressed}
            pressedItemId={destination}
            triggerOnPressOnMount
          />
          <Button
            style={styles.exampleButton}
            text="Button 4"
            onPress={onItemPressed}
            pressedItemId={destination}
          />
          <Button
            style={styles.exampleButton}
            text="Button 5"
            onPress={onItemPressed}
            pressedItemId={destination}
          />
        </TVFocusGuideView>
      </View>
    </View>
  );
};

const TVFocusGuideEdgeCases = () => {
  const theme = useRNTesterTheme();

  const [test, setTest] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setTest(true);
    }, 2000);
  }, []);

  if (!Platform.isTV) {
    return (
      <View>
        <Text>This example is intended to be run on TV.</Text>
      </View>
    );
  }

  const sectionStyle = [styles.section, {borderColor: theme.BorderColor}];

  return (
  <>
    <Button style={styles.exampleButton} text="Button before" />
    <Button style={styles.barelyVisibleLeft} text="Button barely visible left" hasTVPreferredFocus={true}/>
    <Button style={styles.barelyVisibleTop} text="Button barely visible top" />
    <View style={sectionStyle} tvHiddenFromFocus={true}>
      <Text style={styles.title}>
         hidden from focus
      </Text>
      <Button style={styles.exampleButton} text="Button hiddenff" tvHiddenFromFocus={true}/>
    </View>
    <View style={sectionStyle} tvHiddenFromFocus={false}>
      <Text style={styles.title}>
        Hidden from focus
      </Text>
      <Button style={styles.exampleButton} text="Button !hiddenff" tvHiddenFromFocus={true}/>
    </View>
      <Button style={styles.exampleButton} text="Button after" />
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
