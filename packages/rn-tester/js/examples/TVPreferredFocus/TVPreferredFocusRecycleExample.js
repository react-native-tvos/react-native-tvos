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
import {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

exports.framework = 'React';
exports.title = 'hasTVPreferredFocus with recycled views';
exports.description =
  'A remounted group of items gives focus to its preferred item every time';
exports.displayName = 'TVPreferredFocusRecycleExample';
exports.examples = [
  {
    title: 'Remount a group with a preferred item',
    description:
      'Press "Remount" to unmount the group and mount new components on the next render. The views of the old group go back to the recycle pool, and the new group can get them. The item marked "preferred" should get focus after every remount.',
    render(): React.Node {
      return <TVPreferredFocusRecycleExample />;
    },
  },
] as Array<RNTesterModuleExample>;

const GROUP_SIZES = [1, 10, 40];

type FocusResult = 'pending' | 'focused';

function TVPreferredFocusRecycleExample(): React.Node {
  const theme = useTheme();
  const [groupSize, setGroupSize] = useState(10);
  const [groupKey, setGroupKey] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [result, setResult] = useState<FocusResult>('pending');

  useEffect(() => {
    if (!mounted) {
      setGroupKey(key => key + 1);
      setMounted(true);
    }
  }, [mounted]);

  const remount = () => {
    setResult('pending');
    setMounted(false);
  };

  const preferredIndex = Math.floor(groupSize / 2);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button label="Remount" onPress={remount} />
        {GROUP_SIZES.map(size => (
          <Button
            key={size}
            label={`${size} item${size === 1 ? '' : 's'}`}
            selected={size === groupSize}
            onPress={() => {
              setGroupSize(size);
              remount();
            }}
          />
        ))}
      </View>
      <Text style={[styles.status, {color: theme.LabelColor}]}>
        {`Remount ${groupKey}: preferred item ${
          result === 'focused' ? 'got focus' : 'did not get focus'
        }`}
      </Text>
      <View style={styles.group}>
        {mounted ? (
          <React.Fragment key={groupKey}>
            {Array.from({length: groupSize}, (_, index) => (
              <Item
                key={index}
                label={index === preferredIndex ? 'preferred' : `${index}`}
                hasTVPreferredFocus={index === preferredIndex}
                onFocus={
                  index === preferredIndex
                    ? () => setResult('focused')
                    : undefined
                }
              />
            ))}
          </React.Fragment>
        ) : null}
      </View>
    </View>
  );
}

function Button(props: {
  label: string,
  onPress: () => void,
  selected?: boolean,
}): React.Node {
  const theme = useTheme();
  return (
    <Pressable
      onPress={props.onPress}
      style={({focused}) => [
        styles.button,
        {
          backgroundColor: focused
            ? theme.LinkColor
            : theme.SecondaryGroupedBackgroundColor,
          borderColor: props.selected ? theme.LabelColor : 'transparent',
        },
      ]}>
      <Text style={[styles.buttonText, {color: theme.LabelColor}]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function Item(props: {
  label: string,
  hasTVPreferredFocus: boolean,
  onFocus?: () => void,
}): React.Node {
  const theme = useTheme();
  return (
    <Pressable
      hasTVPreferredFocus={props.hasTVPreferredFocus}
      onFocus={props.onFocus}
      style={({focused}) => [
        styles.item,
        {
          backgroundColor: focused
            ? theme.LinkColor
            : theme.SecondaryGroupedBackgroundColor,
        },
      ]}>
      <Text style={[styles.itemText, {color: theme.LabelColor}]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    borderWidth: 2,
    borderRadius: 8,
    margin: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 20,
  },
  status: {
    fontSize: 20,
    margin: 8,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    borderRadius: 6,
    margin: 6,
    width: 110,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
  },
});
