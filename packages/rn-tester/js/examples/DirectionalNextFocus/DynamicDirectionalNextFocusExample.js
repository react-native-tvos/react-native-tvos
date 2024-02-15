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

const {View, StyleSheet, Pressable, Text, TVFocusGuideView} = ReactNative;

const screenHeight = ReactNative.Dimensions.get('window').height;
const scale = screenHeight / 1080;
const width = 200 * scale;
const height = 120 * scale;

exports.framework = 'React';
exports.title = 'DynamicNextFocus example';
exports.description = 'Dynamic NextFocus API';
exports.displayName = 'Dynamic NextFocus example';
exports.examples = [
  {
    title: 'DynamicNextFocus',
    render(): React.Node {
      return <DynamicNextFocusExample />;
    },
  },
];

const Button = React.memo((props: $FlowFixMeProps) => {
  const onRefAssign = ref => {
    props.onRefAssign?.(props.index, ref);
  };

  const theme = useRNTesterTheme();
  return (
    <Pressable
      onPress={props.onPress}
      nextFocusRight={props.nextFocusRight}
      style={({pressed, focused}) =>
        focused ? styles.buttonStyleFocused : styles.buttonStyle
      }
      ref={onRefAssign}>
      <Text style={[{color: theme.LinkColor}, styles.buttonText]}>
        {props.label}
      </Text>
    </Pressable>
  );
});

const DynamicNextFocusExample = () => {
  const [nextFocusIndex, setNextFocusIndex] = React.useState(undefined);

  const refs = React.useRef({});
  const onRefAssign = React.useCallback((index, ref) => {
    refs.current[index] = ref;
  }, []);

  React.useEffect(() => {
    setNextFocusIndex(0);
  }, []);

  return (
    <View style={styles.rowContainer}>
      <TVFocusGuideView autoFocus>
        <Button
          label={`Focus to ${nextFocusIndex}`}
          nextFocusRight={refs.current[nextFocusIndex]}
          onPress={() => {
            setNextFocusIndex((nextFocusIndex + 1) % 4);
          }}
        />
      </TVFocusGuideView>
      <View>
        <Button label={'Item nr 0'} onRefAssign={onRefAssign} index={0} />
        <Button label={'Item nr 1'} onRefAssign={onRefAssign} index={1} />
        <Button label={'Item nr 2'} onRefAssign={onRefAssign} index={2} />
        <Button label={'Item nr 3'} onRefAssign={onRefAssign} index={3} />
      </View>
    </View>
  );
};

const marginSize = 20 * scale;
const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    padding: 100 * scale,
  },
  buttonText: {
    fontSize: 30 * scale,
  },
  buttonStyle: {
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
});
