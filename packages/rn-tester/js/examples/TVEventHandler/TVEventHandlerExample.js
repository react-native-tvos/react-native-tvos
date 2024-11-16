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

const {
  StyleSheet,
  Text,
  TextInput,
  View,
  useTVEventHandler,
  Platform,
  Pressable,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TVEventControl,
} = ReactNative;

const focusHandler = (event: $FlowFixMe, props: any) => {
  if (props.noBubbledEvents) {
    event.name = undefined;
    event.stopPropagation();
  } else {
    event.name = props.title;
  }
  props.log(`Focus on ${props.title} at ${event.nativeEvent?.target}`);
};

const blurHandler = (event: $FlowFixMe, props: any) => {
  if (props.noBubbledEvents) {
    event.stopPropagation();
  } else {
    event.name = props.title;
  }
  props.log(`Blur on ${props.title} at ${event.nativeEvent?.target}`);
};

const pressEventHandler = (eventType: string, props: any) => {
  props.log(`${props.title} ${eventType}`);
};

const PressableButton = (props: {
  title: string,
  log: (entry: string) => void,
  functional?: boolean,
  noBubbledEvents?: boolean,
  tvParallaxProperties?: $FlowFixMe,
}) => {
  // Set functional=false to have no functional style or children
  // and test the fix for #744
  const {functional, log, noBubbledEvents, title, ...pressableProps} = props;
  const [userFocused, setUserFocused] = React.useState(false);
  return functional !== false ? (
    <Pressable
      {...pressableProps}
      onFocus={(event: $FlowFixMe) => focusHandler(event, props)}
      onBlur={(event: $FlowFixMe) => blurHandler(event, props)}
      onPress={() => pressEventHandler('onPress', props)}
      onLongPress={() => pressEventHandler('onLongPress', props)}
      onPressIn={() => pressEventHandler('onPressIn', props)}
      onPressOut={() => pressEventHandler('onPressOut', props)}
      tvParallaxProperties={props.tvParallaxProperties}
      android_ripple={{
        color: '#cccccc',
        radius: 50,
      }}
      style={({pressed, focused}) =>
        pressed || focused ? styles.pressableFocused : styles.pressable
      }>
      {({focused, pressed}) => {
        return (
          <Text style={styles.pressableText}>
            {pressed
              ? `${props.title} pressed`
              : focused
                ? `${props.title} focused`
                : props.title}
          </Text>
        );
      }}
    </Pressable>
  ) : (
    <Pressable
      {...pressableProps}
      onFocus={(event: $FlowFixMe) => {
        focusHandler(event, props);
        setUserFocused(true);
      }}
      onBlur={(event: $FlowFixMe) => {
        blurHandler(event, props);
        setUserFocused(false);
      }}
      tvParallaxProperties={props.tvParallaxProperties}
      onPress={() => pressEventHandler('onPress', props)}
      onLongPress={() => pressEventHandler('onLongPress', props)}
      onPressIn={() => pressEventHandler('onPressIn', props)}
      onPressOut={() => pressEventHandler('onPressOut', props)}
      style={userFocused ? styles.pressableFocused : styles.pressable}>
      <Text style={styles.pressableText}>{`${props.title}`}</Text>
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
      onFocus={(event: any) => focusHandler(event, props)}
      onBlur={(event: any) => blurHandler(event, props)}
      onPress={() => pressEventHandler('onPress', props)}
      onLongPress={() => pressEventHandler('onLongPress', props)}
      onPressIn={() => pressEventHandler('onPressIn', props)}
      onPressOut={() => pressEventHandler('onPressOut', props)}>
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
      onFocus={(event: any) => focusHandler(event, props)}
      onBlur={(event: any) => blurHandler(event, props)}
      onPress={() => pressEventHandler('onPress', props)}
      onLongPress={() => pressEventHandler('onLongPress', props)}
      onPressIn={() => pressEventHandler('onPressIn', props)}
      onPressOut={() => pressEventHandler('onPressOut', props)}>
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
      onPress={() => pressEventHandler('onPress', props)}
      onLongPress={() => pressEventHandler('onLongPress', props)}
      onPressIn={() => pressEventHandler('onPressIn', props)}
      onPressOut={() => pressEventHandler('onPressOut', props)}>
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  logContainer: {
    flexDirection: 'row',
    padding: 5 * scale,
    margin: 5 * scale,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  logText: {
    height: 600 * scale,
    fontSize: 10 * scale,
    margin: 5 * scale,
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  pressable: {
    minWidth: 200 * scale,
    height: 20 * scale,
    borderColor: 'blue',
    backgroundColor: 'blue',
    borderWidth: 1,
    borderRadius: 5 * scale,
    margin: 5 * scale,
  },
  pressableFocused: {
    minWidth: 200 * scale,
    height: 20 * scale,
    borderColor: 'blue',
    backgroundColor: '#000088',
    borderWidth: 1,
    borderRadius: 5 * scale,
    margin: 5 * scale,
  },
  pressableText: {
    color: 'white',
    fontSize: 12 * scale,
  },
  containerView: {
    backgroundColor: '#eeeeee',
    width: 300 * scale,
    borderRadius: 5 * scale,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10 * scale,
    marginTop: 10 * scale,
  },
});

const TVEventHandlerView: () => React.Node = () => {
  const [remoteEventLog, setRemoteEventLog] = React.useState<string[]>([]);
  const [pressableEventLog, setPressableEventLog] = React.useState<string[]>(
    [],
  );

  const textInputRef = React.useRef<any>(undefined);
  const [textInputValue, setTextInputValue] = React.useState<string>('');

  const logWithAppendedEntry = (log: string[], entry: string) => {
    const limit = 20;
    const newEventLog = log.slice(log.length === limit ? 1 : 0, limit);
    newEventLog.push(entry);
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

  // Apple TV: enable detection of pan gesture events (and disable on unmount)
  React.useEffect(() => {
    TVEventControl.enableTVPanGesture();
    return () => TVEventControl.disableTVPanGesture();
  }, []);

  if (!Platform.isTV) {
    return (
      <View>
        <Text>This example is intended to be run on TV.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        <View>
          <PressableButton title="Pressable" log={updatePressableLog} />
          <PressableButton
            title="Pressable nonfunctional"
            log={updatePressableLog}
            functional={false}
          />
          <PressableButton
            title="Pressable tvOS expand"
            log={updatePressableLog}
            tvParallaxProperties={{
              enabled: true,
              magnification: 1.05,
              pressMagnification: 1.1,
            }}
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
        </View>
        <View
          style={styles.containerView}
          onBlurCapture={(event: any) => {
            updatePressableLog(
              `Container captured blur event for ${event.nativeEvent.target}`,
            );
          }}
          onFocusCapture={(event: any) => {
            updatePressableLog(
              `Container captured focus event for ${event.nativeEvent.target}`,
            );
          }}
          onBlur={(event: any) =>
            updatePressableLog(
              `Container received bubbled blur event from ${event.name} at ${event.nativeEvent.target}`,
            )
          }
          onFocus={(event: any) =>
            updatePressableLog(
              `Container received bubbled focus event from ${event.name} at ${event.nativeEvent?.target}`,
            )
          }>
          <Text style={{fontSize: 12 * scale}}>
            Container receives bubbled events
          </Text>
          <PressableButton
            title="Contained button 1"
            log={updatePressableLog}
          />
          <PressableButton
            title="Contained button 2"
            log={updatePressableLog}
            noBubbledEvents
          />
        </View>
        <View
          style={styles.containerView}
          onFocus={(event: $FlowFixMe) => {
            updatePressableLog(
              `Focus bubbled from ${event.nativeEvent.target}`,
            );
          }}
          onBlur={(event: $FlowFixMe) => {
            updatePressableLog(`Blur bubbled from ${event.nativeEvent.target}`);
          }}>
          <Text style={{fontSize: 12 * scale}}>
            TextInput wrapped with TouchableOpacity
          </Text>
          <TouchableOpacity
            style={[
              styles.pressable,
              {
                backgroundColor: '#cccccc',
                height: 50 * scale,
              },
            ]}
            onPress={() => textInputRef.current?.focus()}>
            <View>
              <TextInput
                ref={textInputRef}
                onFocus={(event: $FlowFixMe) =>
                  updatePressableLog(
                    `TextInput ${event.nativeEvent.target} is focused`,
                  )
                }
                onBlur={(event: $FlowFixMe) =>
                  updatePressableLog(
                    `TextInput ${event.nativeEvent.target} is blurred`,
                  )
                }
                placeholder="Enter a value"
                value={textInputValue}
                style={[
                  styles.pressableText,
                  {color: 'red', height: 50 * scale},
                ]}
                placeholderTextColor="#0000ff"
                onChange={(value: any) => {
                  setTextInputValue(value.nativeEvent.text);
                }}
                onSubmitEditing={(value: any) => {
                  setTextInputValue(value.nativeEvent.text);
                  console.log(value.nativeEvent.text);
                }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.logContainer}>
        <View style={{width: 400 * scale}}>
          <Text style={{fontSize: 16 * scale}}>Native events</Text>
          <Text style={styles.logText}>{pressableEventLog.join('\n')}</Text>
        </View>
        <View style={{width: 200 * scale}}>
          <Text style={{fontSize: 16 * scale}}>TV event handler events</Text>
          <Text style={styles.logText}>{remoteEventLog.join('\n')}</Text>
        </View>
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
