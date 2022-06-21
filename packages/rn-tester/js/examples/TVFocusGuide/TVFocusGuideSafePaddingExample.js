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
exports.title = 'TVFocusGuide examples with safePadding prop';
exports.description = 'Focus guide example of safe padding prop usage';
exports.displayName = 'TVFocusGuideSafePaddingExample';
exports.examples = [
  {
    title: 'TVFocusGuide',
    render(): React.Node {
      return <TVFocusGuideSafePaddingExample />;
    },
  },
];

const Text = ({style, children}) => {
  const theme = useRNTesterTheme();
  return (
    <RNText style={[styles.text, {color: theme.LabelColor}, style]}>
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
      activeOpacity={0.7}>
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

const TVFocusGuideSafePaddingExample = () => {
  const theme = useRNTesterTheme();

  if (!Platform.isTV) {
    return (
      <View>
        <Text>This example is intended to be run on TV.</Text>
      </View>
    );
  }

  const sectionStyle = [styles.section, {borderColor: theme.BorderColor}];

  return (
    <View style={{flex: 1, flexDirection: 'column'}}>
      <View style={[sectionStyle, {flex: 0, borderColor: 'grey'}]}>
        <Text>- TVFocusGuideView's backgroundColor is "cyan"</Text>
        <Text>
          - TVFocusGuideView's default destination is "Button 3" (button in
          green is the destination)
        </Text>
        <Text>
          - You can press on a button inside TVFocusGuideView to change the
          destination
        </Text>
      </View>
      <View style={sectionStyle}>
        <Text style={styles.title}>
          When there aren't padding/margin between TVFocusGuide's view and its
          children:
        </Text>
        <Example description="With `safePadding: 'both'(default) | 'vertical' | 'horizontal'`, it makes sure TVFocusGuideView will always get the focus by adding `padding: 1;` to its view." />
        <Example
          description="With `safePadding: null` and without any padding/margin inside the focus guide view, TVFocusGuideView might not and most probably won't get the focus before its children."
          safePadding={null}
        />
      </View>
      <View style={sectionStyle}>
        <Text style={styles.title}>
          When there are padding/margin between TVFocusGuide's view and its
          children:
        </Text>
        <Example
          description="With `safePadding: null` and some padding/margin inside the focus guide view, it removes the unnecessary padding added to the focus guide view."
          safePadding={null}
          focusGuideStyle={{paddingHorizontal: 24}}
        />
      </View>
    </View>
  );
};

const scale = Platform.OS === 'ios' ? 1.0 : 0.5;

const styles = StyleSheet.create({
  section: {
    flex: 1,
    borderWidth: 1,
    padding: 24*scale,
  },
  title: {
    fontSize: 32*scale,
    marginBottom: 24*scale,
  },
  exampleContainer: {
    flex: 1,
  },
  exampleDescription: {
    fontSize: 20*scale,
    fontWeight: 'bold',
    marginBottom: 24*scale,
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
    marginVertical: 10*scale,
    minWidth: 100*scale,
    height: 60*scale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 18*scale,
  },
});
