/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} = require('react-native');

const NUM_ITEMS = 20;

class ScrollViewSimpleExample extends React.Component<{...}> {
  makeItems: (nItems: number, styles: any) => Array<any> = (
    nItems: number,
    styles,
  ): Array<any> => {
    const items = [];
    for (let i = 0; i < nItems; i++) {
      if (i % 6 === 0) {
        items[i] = (
          <TouchableOpacity disabled accessible={false} key={i} style={styles}>
            <Text style={{ color: '#a52a2a' }}>{'Inaccessible ' + i}</Text>
          </TouchableOpacity>
        );
      } else if (i % 3 === 0) {
        items[i] = (
          <TouchableOpacity disabled key={i} style={styles}>
            <Text style={{ color: '#a52a2a' }}>{'Disabled ' + i}</Text>
          </TouchableOpacity>
        );
      } else {
        items[i] = (
          <TouchableOpacity key={i} style={styles}>
            <Text testID="scroll_view_item">{'Item ' + i}</Text>
          </TouchableOpacity>
        );
      }
    }
    return items;
  };

  render(): React.Node {
    // One of the items is a horizontal scroll view
    const items = this.makeItems(NUM_ITEMS, styles.itemWrapper);
    items[4] = (
      <ScrollView key={'scrollView'} horizontal={true}>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
        ])}
      </ScrollView>
    );
    items.push(
      <ScrollView
        key={'scrollViewSnap'}
        horizontal
        snapToInterval={210.0}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );
    items.push(
      <ScrollView
        key={'scrollViewSnapStart'}
        horizontal
        snapToAlignment={'start'}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );
    items.push(
      <ScrollView
        key={'scrollViewSnapCenter'}
        horizontal
        snapToAlignment={'center'}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );
    items.push(
      <ScrollView
        key={'scrollViewSnapEnd'}
        horizontal
        snapToAlignment={'end'}
        pagingEnabled>
        {this.makeItems(NUM_ITEMS, [
          styles.itemWrapper,
          styles.horizontalItemWrapper,
          styles.horizontalPagingItemWrapper,
        ])}
      </ScrollView>,
    );

    const verticalScrollView = (
      <ScrollView style={styles.verticalScrollView}>{items}</ScrollView>
    );

    return verticalScrollView;
  }
}

const styles = StyleSheet.create({
  verticalScrollView: {
    margin: 10,
  },
  itemWrapper: {
    backgroundColor: '#dddddd',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 5,
    borderColor: '#a52a2a',
    padding: 30,
    margin: 5,
  },
  horizontalItemWrapper: {
    padding: 50,
  },
  horizontalPagingItemWrapper: {
    width: 200,
  },
});

exports.title = 'ScrollViewSimpleExample';
exports.category = 'Basic';
exports.description =
  'Component that enables scrolling through child components.  The components are touchables, and every 7th component is disabled to check for correct behavior of scrolling and of the focus engine on TV platforms';

exports.examples = [
  {
    title: 'Simple scroll view with every 7th element disabled',
    render: function(): React.Element<typeof ScrollViewSimpleExample> {
      return <ScrollViewSimpleExample />;
    },
  },
];
