/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RenderItemType} from 'react-native/Libraries/Lists/VirtualizedList';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import {useRNTesterTheme} from '../../components/RNTesterTheme';
import * as React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  Dimensions,
  TVFocusGuideView,
  Switch,
} from 'react-native';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;
const scale = screenHeight / 1080;

type ItemType = number;
const data: ItemType[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25,
];

const ITEM_SPACING = 5 * scale;
const ITEM_WIDTH = 400 * scale;
const ITEM_TOTAL_WIDTH = ITEM_WIDTH + ITEM_SPACING;
const ITEM_HEIGHT = 100 * scale;
const NUMBER_OF_VISIBLE_ITEMS = Math.ceil(screenWidth / ITEM_TOTAL_WIDTH);
const MID_INDEX = Math.floor(data.length / 2);

function Row({title, children}: {title: string, children: React.Node}) {
  return (
    <TVFocusGuideView autoFocus>
      <Text style={styles.rowTitle}>{title}</Text>
      {children}
    </TVFocusGuideView>
  );
}

/**
 * Constructs a case that tests if `additionalRenderRegions` property works as expected.
 * Starts the FlatList at the middle of the list. Every item immediately scrolls the list
 * to the beginning of the list on `onPress` event which leads to focus recovery issues
 * due to virtualization. `additionalRenderRegions` prop makes sure the items at the beginning
 * of the list are always rendered which makes focus recovery work deterministically.
 *
 * It indicates everything work as expected if focus is recovered to the first element (the one with text `0`)
 * after the pressing action.
 */
export function FlatList_additionalRenderRegions(): React.Node {
  const theme = useRNTesterTheme();
  const listRef = React.useRef<?FlatList<ItemType>>(null);
  const [additionalRenderRegionsEnabled, setAdditionalRenderRegionsEnabled] =
    React.useState(true);

  const renderItem: RenderItemType<ItemType> = ({index}) => (
    <Pressable
      onPress={() => {
        listRef.current?.scrollToOffset({offset: 0, animated: false});
      }}
      style={state => [
        {backgroundColor: theme.TertiarySystemFillColor},
        styles.pressableBaseStyle,
        state.focused && {borderColor: theme.BorderColor, borderWidth: 4},
      ]}>
      <Text style={styles.pressableText}>{index}</Text>
    </Pressable>
  );

  return (
    <TVFocusGuideView autoFocus trapFocusLeft trapFocusRight>
      <TVFocusGuideView style={styles.switchSection}>
        <Text style={styles.switchText}>Enable `additionalRenderRegions`</Text>
        <Switch
          value={additionalRenderRegionsEnabled}
          onValueChange={() => setAdditionalRenderRegionsEnabled(val => !val)}
        />
      </TVFocusGuideView>

      <Row title="Initial Row">
        <FlatList
          ref={listRef}
          horizontal
          data={data}
          renderItem={renderItem}
          windowSize={1}
          initialScrollIndex={MID_INDEX}
          contentOffset={{x: MID_INDEX * ITEM_TOTAL_WIDTH, y: 0}}
          additionalRenderRegions={
            additionalRenderRegionsEnabled
              ? [{first: 0, last: NUMBER_OF_VISIBLE_ITEMS - 1}]
              : undefined
          }
          getItemLayout={(_d, index) => ({
            length: ITEM_TOTAL_WIDTH,
            offset: index * ITEM_TOTAL_WIDTH,
            index,
          })}
        />
      </Row>
    </TVFocusGuideView>
  );
}

export default ({
  title: 'Additional Render Regions',
  name: 'additionalRenderRegions',
  description: 'Test additionalRenderRegions feature on FlatList',
  render: () => <FlatList_additionalRenderRegions />,
}: RNTesterModuleExample);

const styles = StyleSheet.create({
  pressableBaseStyle: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginRight: ITEM_SPACING,
  },
  pressableText: {fontSize: 24 * scale},
  rowTitle: {color: 'white', marginBottom: 5 * scale},
  switchSection: {flexDirection: 'row', paddingTop: 10 * scale},
  switchText: {color: 'white'},
});
