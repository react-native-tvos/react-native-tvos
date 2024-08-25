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

import * as React from 'react';
import ReactNative from 'react-native';
import type {TVRemoteEvent} from '../../../../../Libraries/Types/CoreEventTypes';

const {
  StyleSheet,
  Text,
  View,
  useTVEventHandler,
  Platform,
  Pressable,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TVEventControl,
} = ReactNative;

const PressableButton = (props: {
  title: string,
  log: (entry: string) => void,
  functional?: boolean,
}) => {
  // Set functional=false to have no functional style or children
  // and test the fix for #744
  const [userFocused, setUserFocused] = React.useState(false);
  const functional = props?.functional ?? true;
  return functional ? (
    <Pressable
      onFocus={event =>
        props.log(`${props.title} focus action=${event.eventKeyAction}`)
      }
      onBlur={event =>
        props.log(`${props.title} blur action=${event.eventKeyAction}`)
      }
      onPress={event =>
        props.log(`${props.title} pressed action=${event.eventKeyAction}`)
      }
      onLongPress={event =>
        props.log(`${props.title} long press action=${event.eventKeyAction}`)
      }
      style={({pressed, focused}) =>
        pressed || focused ? styles.pressableFocused : styles.pressable
      }>
      {({focused}) => {
        return (
          <Text style={styles.pressableText}>
            {focused ? `${props.title} focused` : props.title}
          </Text>
        );
      }}
    </Pressable>
  ) : (
    <Pressable
      onFocus={event => {
        props.log(`${props.title} focus action=${event.eventKeyAction}`);
        setUserFocused(true);
      }}
      onBlur={event => {
        props.log(`${props.title} blur action=${event.eventKeyAction}`);
        setUserFocused(false);
      }}
      onPress={event =>
        props.log(`${props.title} pressed action=${event.eventKeyAction}`)
      }
      onLongPress={event =>
        props.log(`${props.title} long press action=${event.eventKeyAction}`)
      }
      style={userFocused ? styles.pressableFocused : styles.pressable}>
      <Text style={styles.pressableText}>{`${props.title} nonfunctional`}</Text>
    </Pressable>
  );
};

const TouchableOpacityButton = (props: {
  title: string,
  log: (entry: string) => void,
}) => {
  return (
    <TouchableOpacity
      style={styles.pressable}
      onFocus={event =>
        props.log(`${props.title} focus action=${event.eventKeyAction}`)
      }
      onBlur={event =>
        props.log(`${props.title} blur action=${event.eventKeyAction}`)
      }
      onPress={event =>
        props.log(`${props.title} pressed action=${event.eventKeyAction}`)
      }
      onLongPress={event =>
        props.log(`${props.title} long press action=${event.eventKeyAction}`)
      }>
      <Text style={styles.pressableText}>{props.title}</Text>
    </TouchableOpacity>
  );
};

const TouchableHighlightButton = (props: {
  title: string,
  log: (entry: string) => void,
}) => {
  return (
    <TouchableHighlight
      style={styles.pressable}
      onFocus={event =>
        props.log(`${props.title} focus action=${event.eventKeyAction}`)
      }
      onBlur={event =>
        props.log(`${props.title} blur action=${event.eventKeyAction}`)
      }
      onPress={event =>
        props.log(`${props.title} pressed action=${event.eventKeyAction}`)
      }
      onLongPress={event =>
        props.log(`${props.title} long press action=${event.eventKeyAction}`)
      }>
      <Text style={styles.pressableText}>{props.title}</Text>
    </TouchableHighlight>
  );
};

const TouchableNativeFeedbackButton = (props: {
  title: string,
  log: (entry: string) => void,
}) => {
  return (
    <TouchableNativeFeedback
      background={TouchableNativeFeedback.SelectableBackground()}
      onFocus={event =>
        props.log(`${props.title} focus action=${event.eventKeyAction}`)
      }
      onBlur={event =>
        props.log(`${props.title} blur action=${event.eventKeyAction}`)
      }
      onPress={event =>
        props.log(`${props.title} pressed action=${event.eventKeyAction}`)
      }
      onLongPress={event =>
        props.log(`${props.title} long press action=${event.eventKeyAction}`)
      }>
      <View style={styles.pressable}>
        <Text style={styles.pressableText}>{props.title}</Text>
      </View>
    </TouchableNativeFeedback>
  );
};

const scale = Platform.isTV && Platform.OS === 'ios' ? 2 : 1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logContainer: {
    flexDirection: 'row',
    padding: 5 * scale,
    margin: 5 * scale,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  logText: {
    height: 100 * scale,
    width: 150 * scale,
    fontSize: 10 * scale,
    margin: 5 * scale,
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  pressable: {
    borderColor: 'blue',
    backgroundColor: 'blue',
    borderWidth: 1,
    borderRadius: 5 * scale,
    margin: 5 * scale,
  },
  pressableFocused: {
    borderColor: 'blue',
    backgroundColor: '#000088',
    borderWidth: 1,
    borderRadius: 5 * scale,
    margin: 5 * scale,
  },
  pressableText: {
    color: 'white',
    fontSize: 15 * scale,
  },
});

const TVEventHandlerView: () => React.Node = () => {
  const [remoteEventLog, setRemoteEventLog] = React.useState<string[]>([]);
  const [pressableEventLog, setPressableEventLog] = React.useState<string[]>(
    [],
  );

  const logWithAppendedEntry = (log: string[], entry: string) => {
    const limit = 6;
    const newEventLog = log.slice(0, limit - 1);
    newEventLog.unshift(entry);
    return newEventLog;
  };

  const updatePressableLog = (entry: string) => {
    setPressableEventLog(log => logWithAppendedEntry(log, entry));
  };

  useTVEventHandler(event => {
    const {eventType, eventKeyAction} = event;
    if (eventType !== 'focus' && eventType !== 'blur') {
      setRemoteEventLog(log =>
        logWithAppendedEntry(
          log,
          `type=${eventType}, action=${
            eventKeyAction !== undefined ? eventKeyAction : ''
          }`,
        ),
      );
    }
  });

  if (!Platform.isTV) {
    return (
      <View>
        <Text>This example is intended to be run on TV.</Text>
      </View>
    );
  }

  // Apple TV: enable detection of pan gesture events (and disable on unmount)
  React.useEffect(() => {
    TVEventControl.enableTVPanGesture();
    return () => TVEventControl.disableTVPanGesture();
  }, []);

  return (
    <View style={styles.container}>
      <PressableButton title="Pressable" log={updatePressableLog} />
      <PressableButton
        title="Pressable"
        log={updatePressableLog}
        functional={false}
      />
      <TouchableOpacityButton
        title="TouchableOpacity"
        log={updatePressableLog}
      />
      <TouchableHighlightButton
        title="TouchableHighlight"
        log={updatePressableLog}
      />
      {Platform.OS === 'android' ? (
        <TouchableNativeFeedbackButton
          title="TouchableNativeFeedback"
          log={updatePressableLog}
        />
      ) : null}

      <View style={styles.logContainer}>
        <Text style={styles.logText}>{remoteEventLog.join('\n')}</Text>
        <Text style={styles.logText}>{pressableEventLog.join('\n')}</Text>
      </View>
    </View>
  );
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
