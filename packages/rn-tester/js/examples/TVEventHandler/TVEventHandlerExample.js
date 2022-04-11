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
  const [lastEventAction, setLastEventAction] = React.useState('');
  const [eventLog, setEventLog] = React.useState([]);

  const isAndroid = Platform.OS === 'android';

  function appendEvent(eventType, eventAction, body) {
    const limit = 6;
    const newEventLog = eventLog.slice(0, limit - 1);
    if (isAndroid) {
      newEventLog.unshift(`type=${eventType}, action=${eventAction}`);
    } else {
      if (eventType === 'pan') {
        newEventLog.unshift(`type=${eventType}, body=${JSON.stringify(body)}`);
      } else {
        newEventLog.unshift(`type=${eventType}`);
      }
    }
    setEventLog(newEventLog);
  }

  const myTVEventHandler = evt => {
    appendEvent(evt.eventType, evt.eventKeyAction, evt.body);
  };

  if (Platform.isTV) {
    useTVEventHandler(myTVEventHandler); // eslint-disable-line react-hooks/rules-of-hooks
    return (
      <View>
        <TouchableOpacity onPress={() => {}}>
          <Text>
            This example enables an instance of TVEventHandler to show the last
            event detected from the Apple TV Siri remote or from a keyboard.
          </Text>
        </TouchableOpacity>
        {eventLog.map((e, ii) => (
          <Text style={{color: 'blue'}} key={ii}>
            {e}
          </Text>
        ))}
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
