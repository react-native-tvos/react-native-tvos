/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  DeviceEventEmitter,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useTVEventHandler,
} from 'react-native';

function TVEventView(): React.Node {
  const [lastEventType, setLastEventType] = React.useState('');
  const myTVEventHandler = (evt: {eventType: string}) => {
    setLastEventType(evt.eventType);
  };
  useTVEventHandler(myTVEventHandler);
  if (Platform.isTV) {
    return <Text>TVEvent: {lastEventType}</Text>;
  } else {
    return <View />;
  }
}

function ModalOnShowOnDismiss(): React.Node {
  const [modalShowComponent, setModalShowComponent] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [onShowCount, setOnShowCount] = useState(0);
  const [onDismissCount, setOnDismissCount] = useState(0);

  const [lastEvent, setLastEvent] = React.useState('');
  const [lastDialogKeyUpEvent, setLastDialogKeyUpEvent] = React.useState('');
  const [lastDialogKeyDownEvent, setLastDialogKeyDownEvent] = React.useState('');

  const buttonOpacity = (pressed: boolean, focused: boolean) =>
    pressed || focused ? 0.7 : 1.0;

  useTVEventHandler(evt => {
    setLastEvent(evt.eventType);
  });

  useEffect(() => {
    const onDialogKeyUpEventSubscription = DeviceEventEmitter.addListener('onDialogKeyUpEvent', (event) => {
      setLastDialogKeyUpEvent(event.keyCode);
    });

    const onDialogKeyDownEventSubscription = DeviceEventEmitter.addListener('onDialogKeyDownEvent', (event) => {
      setLastDialogKeyDownEvent(event.keyCode);
    });

    return () => {
      onDialogKeyUpEventSubscription.remove();
      onDialogKeyDownEventSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {modalShowComponent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onShow={() => {
            setOnShowCount(showCount => showCount + 1);
          }}
          onDismiss={() => {
            setOnDismissCount(dismissCount => dismissCount + 1);
          }}
          onRequestClose={() => {
            setModalVisible(false);
          }}>
          <View style={[styles.centeredView, styles.modalBackdrop]}>
            <View style={styles.modalView}>
              <TVEventView />
              <Text testID="modal-on-show-count">
                onShow is called {onShowCount} times
              </Text>
              <Text testID="modal-on-dismiss-count">
                onDismiss is called {onDismissCount} times
              </Text>
              {Platform.OS === 'android' && (
                <Text>
                  Delegated to MainActivity: keyUp={lastDialogKeyUpEvent}, keyDown={lastDialogKeyDownEvent}
                </Text>
              )}
              <Pressable
                style={({pressed, focused}) => [
                  styles.button,
                  styles.buttonClose,
                  {opacity: buttonOpacity(pressed, focused)},
                ]}
                onPress={() => setModalVisible(false)}>
                <Text testID="dismiss-modal" style={styles.textStyle}>
                  Hide modal by setting visible to false
                </Text>
              </Pressable>
              <Pressable
                style={({pressed, focused}) => [
                  styles.button,
                  styles.buttonClose,
                  {opacity: buttonOpacity(pressed, focused)},
                ]}
                onPress={() => setModalShowComponent(false)}>
                <Text
                  testID="dismiss-modal-by-removing-component"
                  style={styles.textStyle}>
                  Hide modal by removing component
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      <RNTesterText testID="on-show-count">
        onShow is called {onShowCount} times
      </RNTesterText>
      <RNTesterText testID="on-dismiss-count">
        onDismiss is called {onDismissCount} times
      </RNTesterText>
      <RNTesterText> Last event = {lastEvent}</RNTesterText>
      <Pressable
        style={({pressed, focused}) => [
          styles.button,
          styles.buttonOpen,
          {opacity: buttonOpacity(pressed, focused)},
        ]}
        onPress={() => {
          setModalShowComponent(true);
          setModalVisible(true);
        }}>
        <Text testID="open-modal" style={styles.textStyle}>
          Show Modal
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    paddingVertical: 30,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 20,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ({
  title: "Modal's onShow/onDismiss",
  name: 'onShow',
  description:
    'onShow and onDismiss (iOS only) callbacks are called when a modal is shown/dismissed',
  render: (): React.Node => <ModalOnShowOnDismiss />,
}: RNTesterModuleExample);
