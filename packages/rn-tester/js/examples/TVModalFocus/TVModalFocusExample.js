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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import {useTheme} from '../../components/RNTesterTheme';
import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

exports.framework = 'React';
exports.title = 'Focus APIs inside a Modal';
exports.description =
  'hasTVPreferredFocus, requestTVFocus and nextFocus* move focus inside a Modal';
exports.displayName = 'TVModalFocusExample';
exports.examples = [
  {
    title: 'Move focus inside a Modal',
    description:
      'Open the modal. "Prefer item 3" sets hasTVPreferredFocus on item 3, "requestTVFocus item 0" calls requestTVFocus() on item 0, and Up from "nextFocusUp: item 0" goes to item 0 instead of item 3 above it.',
    render(): React.Node {
      return <TVModalFocusExample />;
    },
  },
] as Array<RNTesterModuleExample>;

const ITEM_COUNT = 4;

function TVModalFocusExample(): React.Node {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.container}>
      <Button label="Open modal" onPress={() => setVisible(true)} />
      <Modal
        visible={visible}
        animationType="none"
        onRequestClose={() => setVisible(false)}>
        <ModalContent onClose={() => setVisible(false)} />
      </Modal>
    </View>
  );
}

function ModalContent(props: {onClose: () => void}): React.Node {
  const theme = useTheme();
  const [preferredIndex, setPreferredIndex] = useState<?number>(null);
  const [focusedLabel, setFocusedLabel] = useState('none');
  // $FlowFixMe[unclear-type]
  const firstItemRef = useRef<any>(null);
  // $FlowFixMe[unclear-type]
  const [nextFocusUpTarget, setNextFocusUpTarget] = useState<any>(null);

  useEffect(() => {
    setNextFocusUpTarget(firstItemRef.current);
  }, []);

  return (
    <View
      style={[styles.modal, {backgroundColor: theme.SystemBackgroundColor}]}>
      <View style={styles.row}>
        <Button
          label="Prefer item 3"
          onPress={() => setPreferredIndex(ITEM_COUNT - 1)}
          onFocus={() => setFocusedLabel('Prefer item 3')}
        />
        <Button
          label="requestTVFocus item 0"
          onPress={() => firstItemRef.current?.requestTVFocus()}
          onFocus={() => setFocusedLabel('requestTVFocus item 0')}
        />
        <Button
          label="Close"
          onPress={props.onClose}
          onFocus={() => setFocusedLabel('Close')}
        />
      </View>
      <Text style={[styles.status, {color: theme.LabelColor}]}>
        {`Focused: ${focusedLabel}`}
      </Text>
      <View style={styles.row}>
        {Array.from({length: ITEM_COUNT}, (_, index) => (
          <Button
            key={index}
            ref={index === 0 ? firstItemRef : undefined}
            label={`Item ${index}`}
            hasTVPreferredFocus={index === preferredIndex}
            onFocus={() => setFocusedLabel(`Item ${index}`)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {Array.from({length: ITEM_COUNT - 1}, (_, index) => (
          <View key={index} style={styles.spacer} />
        ))}
        <Button
          label="nextFocusUp: item 0"
          nextFocusUp={nextFocusUpTarget}
          onFocus={() => setFocusedLabel('nextFocusUp: item 0')}
        />
      </View>
    </View>
  );
}

const Button = React.forwardRef(
  (
    props: {
      label: string,
      onPress?: () => void,
      onFocus?: () => void,
      hasTVPreferredFocus?: boolean,
      // $FlowFixMe[unclear-type]
      nextFocusUp?: any,
    },
    // $FlowFixMe[unclear-type]
    ref: any,
  ): React.Node => {
    const theme = useTheme();
    return (
      <Pressable
        ref={ref}
        onPress={props.onPress}
        onFocus={props.onFocus}
        hasTVPreferredFocus={props.hasTVPreferredFocus}
        nextFocusUp={props.nextFocusUp}
        style={({focused}) => [
          styles.button,
          {
            backgroundColor: focused
              ? theme.LinkColor
              : theme.SecondaryGroupedBackgroundColor,
          },
        ]}>
        <Text style={[styles.buttonText, {color: theme.LabelColor}]}>
          {props.label}
        </Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  modal: {
    flex: 1,
    padding: 60,
  },
  row: {
    flexDirection: 'row',
  },
  spacer: {
    margin: 10,
    width: 220,
  },
  button: {
    borderRadius: 8,
    margin: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 22,
  },
  status: {
    fontSize: 22,
    margin: 10,
  },
});
