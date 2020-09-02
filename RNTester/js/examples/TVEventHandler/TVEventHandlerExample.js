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

const {Platform, View, Text, TouchableOpacity, useTVEventHandler} = ReactNative;

const TVEventHandlerView: () => React.Node = () => {
  const [lastEventType, setLastEventType] = React.useState('');

  const ref = React.useRef(null);

  const myTVEventHandler = evt => {
    setLastEventType(evt.eventType);
  };

  if (Platform.isTV) {
    useTVEventHandler(ref, myTVEventHandler); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <View>
        <TouchableOpacity ref={ref} onPress={() => {}}>
          <Text>
            This example enables an instance of TVEventHandler to show the last
            event detected from the Apple TV Siri remote or from a keyboard.
          </Text>
        </TouchableOpacity>
        <Text style={{color: 'blue'}}>{lastEventType}</Text>
      </View>
    );
  } else {
    return (
      <View>
        <Text>This example is intended to be run on Apple TV.</Text>
      </View>
    );
  }
};

exports.framework = 'React';
exports.title = 'TVEventHandler example';
exports.description = 'iOS alerts and action sheets';
exports.examples = [
  {
    title: 'TVEventHandler',
    render(): React.Node {
      return <TVEventHandlerView />;
    },
  },
];
