/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {GestureResponderEvent} from '../../Types/CoreEventTypes';

import TouchableHighlight from '../../Components/Touchable/TouchableHighlight';
import TouchableWithoutFeedback from '../../Components/Touchable/TouchableWithoutFeedback';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useState} from 'react';

type Props = $ReadOnly<{
  id?: string,
  backgroundColor: $ReadOnly<{
    default: string,
    pressed: string,
  }>,
  children?: React.Node,
  hitSlop?: ?EdgeInsetsProp,
  onPress?: ?(event: GestureResponderEvent) => void,
  style?: ViewStyleProp,
}>;

function LogBoxButton(props: Props): React.Node {
  const [pressed, setPressed] = useState(false);

  let backgroundColor = props.backgroundColor;
  if (!backgroundColor) {
    backgroundColor = {
      default: LogBoxStyle.getBackgroundColor(0.95),
      pressed: LogBoxStyle.getBackgroundColor(0.6),
    };
  }

  const content = (
    <View
      id={props.id}
      style={StyleSheet.compose(
        {
          backgroundColor: pressed
            ? backgroundColor.pressed
            : backgroundColor.default,
        },
        props.style,
      )}>
      {props.children}
    </View>
  );

  return props.onPress == null ? (
    content
  ) : Platform.isTV ? (
        <TouchableHighlight
          tvParallaxProperties={{enabled: false}}
          hitSlop={props.hitSlop}
          onPress={props.onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}>
          {content}
        </TouchableHighlight>
  ) : (
        <TouchableWithoutFeedback
          hitSlop={props.hitSlop}
          onPress={props.onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}>
          {content}
        </TouchableWithoutFeedback>
  );
}

export default LogBoxButton;
