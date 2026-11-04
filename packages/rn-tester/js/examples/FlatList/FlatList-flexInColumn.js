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

import * as React from 'react';
import {useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';

const DATA: Array<string> = Array.from({length: 30}, (_, i) => `Item ${i}`);

export component FlatList_flexInColumn() {
  const [listHeight, setListHeight] = useState<?number>(null);

  return (
    <View style={styles.column}>
      <Text testID="flat_list_flex_in_column_height" style={styles.caption}>
        FlatList height: {listHeight ?? 'not measured'}
      </Text>
      <FlatList
        data={DATA}
        style={styles.list}
        onLayout={event => setListHeight(event.nativeEvent.layout.height)}
        renderItem={({item}) => (
          <Pressable style={styles.row}>
            <Text>{item}</Text>
          </Pressable>
        )}
      />
      <Text style={styles.footer}>
        Footer: stays at the bottom of the column
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    height: 400,
  },
  caption: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  footer: {
    padding: 8,
    backgroundColor: '#ddd',
  },
});

export default {
  title: 'Flex in a column',
  name: 'flexInColumn',
  description:
    'A list sized only by flex: 1 fills the rest of a fixed-height column.',
  render: () => <FlatList_flexInColumn />,
} as RNTesterModuleExample;
