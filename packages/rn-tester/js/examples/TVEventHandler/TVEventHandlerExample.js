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
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TVEventControl,
  TVFocusGuideView,
  type TVRemoteEvent,
  View,
  useTVEventHandler,
} from 'react-native';

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
    event.name = undefined;
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
  noBubbledEvents?: boolean,
  tvParallaxProperties?: $FlowFixMe,
  accessible?: boolean,
  focusable?: boolean,
  disabled?: boolean,
}) => {
  const {log, noBubbledEvents, title, ...pressableProps} = props;
  return (
    <Pressable
      {...pressableProps}
      onFocus={(event: $FlowFixMe) => {
        focusHandler(event, props);
      }}
      onBlur={(event: $FlowFixMe) => {
        blurHandler(event, props);
      }}
      tvParallaxProperties={props.tvParallaxProperties}
      onPress={() => pressEventHandler('onPress', props)}
      onLongPress={() => pressEventHandler('onLongPress', props)}
      onPressIn={() => {
        pressEventHandler('onPressIn', props);
      }}
      onPressOut={() => {
        pressEventHandler('onPressOut', props);
      }}
      style={({focused, pressed}) => [
        pressed || focused ? styles.pressableFocused : styles.pressable,
      ]}>
      {({focused, pressed}) => (
        <Text style={styles.pressableText}>{`${props.title}${
          focused ? ' focused' : ''
        }${pressed ? ' pressed' : ''}`}</Text>
      )}
    </Pressable>
  );
};

const PressableNonfunctionalButton = (props: {
  title: string,
  log: (entry: string) => void,
  noBubbledEvents?: boolean,
  tvParallaxProperties?: $FlowFixMe,
  accessible?: boolean,
  focusable?: boolean,
  disabled?: boolean,
}) => {
  // test the fix for #744
  const {log, noBubbledEvents, title, ...pressableProps} = props;
  const [userFocused, setUserFocused] = React.useState(false);
  const [userPressed, setUserPressed] = React.useState(false);
  return (
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
      onPressIn={() => {
        pressEventHandler('onPressIn', props);
        setUserPressed(true);
      }}
      onPressOut={() => {
        pressEventHandler('onPressOut', props);
        setUserPressed(false);
      }}
      style={
        userFocused || userPressed ? styles.pressableFocused : styles.pressable
      }>
      <Text style={styles.pressableText}>{`${props.title}${
        userFocused ? ' focused' : ''
      }${userPressed ? ' pressed' : ''}`}</Text>
    </Pressable>
  );
};
const TouchableOpacityButton = (props: {
  title: string,
  focusable?: boolean,
  disabled?: boolean,
  log: (entry: string) => void,
}) => {
  const {log, title, ...touchableOpacityProps} = props;
  return (
    <TouchableOpacity
      {...touchableOpacityProps}
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
  focusable?: boolean,
  disabled?: boolean,
  log: (entry: string) => void,
}) => {
  const {log, title, ...touchableHighlightProps} = props;
  return (
    <TouchableHighlight
      {...touchableHighlightProps}
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
  const {log, title, ...touchableNativeFeedbackProps} = props;
  return (
    <TouchableNativeFeedback
      {...touchableNativeFeedbackProps}
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
  const [isContainerFocused, setIsContainerFocused] =
    React.useState<boolean>(false);

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

  const logEntryForEvent = (event: TVRemoteEvent) => {
    return [
      `type=${event.eventType}`,
      event.eventKeyAction ? `action=${event.eventKeyAction}` : '',
      event.body?.x ? `x=${event.body?.x}` : '',
      event.body?.y ? `y=${event.body?.y}` : '',
      event.body?.velocityX ? `vx=${Math.floor(event.body?.velocityX)}` : '',
      event.body?.velocityY ? `vy=${Math.floor(event.body?.velocityY)}` : '',
    ].join(' ');
  };

  useTVEventHandler(event => {
    const {eventType} = event;
    if (eventType !== 'focus' && eventType !== 'blur') {
      setRemoteEventLog(log =>
        logWithAppendedEntry(log, logEntryForEvent(event)),
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
      <ScrollView>
        <View>
          <PressableButton title="Pressable" log={updatePressableLog} />
          <PressableNonfunctionalButton
            title="Pressable nonfunctional form"
            log={updatePressableLog}
          />
          <PressableButton
            title="Pressable accessible={false}"
            accessible={false}
            log={updatePressableLog}
            noBubbledEvents
          />
          <PressableButton
            title="Pressable focusable={false}"
            focusable={false}
            log={updatePressableLog}
            noBubbledEvents
          />
          <PressableButton
            title="Pressable disabled={true}"
            disabled={true}
            log={updatePressableLog}
            noBubbledEvents
          />
          <PressableButton
            title="Pressable disabled={true} focusable={false}"
            disabled={true}
            focusable={false}
            log={updatePressableLog}
            noBubbledEvents
          />
          <PressableButton
            title="Pressable disabled={true} focusable={true}"
            disabled={true}
            focusable={true}
            log={updatePressableLog}
            noBubbledEvents
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
          <TouchableOpacityButton
            title="TouchableOpacity focusable={false}"
            focusable={false}
            log={updatePressableLog}
          />
          <TouchableOpacityButton
            title="TouchableOpacity disabled={true}"
            disabled={true}
            log={updatePressableLog}
          />
          <TouchableOpacityButton
            title="TouchableOpacity disabled={true} focusable={false}"
            disabled={true}
            focusable={false}
            log={updatePressableLog}
          />
          <TouchableHighlightButton
            title="TouchableHighlight"
            log={updatePressableLog}
          />
          <TouchableHighlightButton
            title="TouchableHighlight focusable={false}"
            focusable={false}
            log={updatePressableLog}
          />
          <TouchableHighlightButton
            title="TouchableHighlight disabled={true}"
            disabled={true}
            log={updatePressableLog}
          />
          <TouchableHighlightButton
            title="TouchableHighlight disabled={true} focusable={false}"
            disabled={true}
            focusable={false}
            log={updatePressableLog}
          />
          {Platform.OS === 'android' ? (
            <TouchableNativeFeedbackButton
              title="TouchableNativeFeedback"
              log={updatePressableLog}
            />
          ) : null}
        </View>
        <TVFocusGuideView
          style={[
            styles.containerView,
            isContainerFocused ? {backgroundColor: '#cccccc'} : {},
          ]}
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
          onBlur={(event: any) => {
            updatePressableLog(
              `Container received bubbled blur event from ${event.name} at ${event.nativeEvent.target}`,
            );
            setIsContainerFocused(false);
          }}
          onFocus={(event: any) => {
            updatePressableLog(
              `Container received bubbled focus event from ${event.name} at ${event.nativeEvent?.target}`,
            );
            setIsContainerFocused(true);
          }}>
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
        </TVFocusGuideView>
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
          <Text style={{fontSize: 12 * scale}}>Unwrapped TextInput</Text>
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
            style={[styles.pressableText, {color: 'red', height: 50 * scale}]}
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
      </ScrollView>

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
