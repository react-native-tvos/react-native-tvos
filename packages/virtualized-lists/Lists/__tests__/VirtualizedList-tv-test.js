/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

import VirtualizedList from '../VirtualizedList';
import * as React from 'react';
import {Platform, StyleSheet, TVFocusGuideView} from 'react-native';
import {act, create} from 'react-test-renderer';

jest.useFakeTimers();

async function renderFocusGuideStyle(style) {
  let component;
  await act(() => {
    component = create(
      <VirtualizedList
        data={[{key: 'i1'}, {key: 'i2'}]}
        renderItem={({item}) => <item value={item.key} />}
        getItem={(data, index) => data[index]}
        getItemCount={data => data.length}
        style={style}
      />,
    );
  });
  return StyleSheet.flatten(
    component.root.findByType(TVFocusGuideView).props.style,
  );
}

describe('VirtualizedList on TV', () => {
  let isTVDescriptor;

  beforeEach(() => {
    isTVDescriptor = Object.getOwnPropertyDescriptor(Platform, 'isTV');
    Object.defineProperty(Platform, 'isTV', {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    if (isTVDescriptor != null) {
      Object.defineProperty(Platform, 'isTV', isTVDescriptor);
    }
  });

  test('gives the focus guide the ScrollView base flex when the list has no style', async () => {
    expect(await renderFocusGuideStyle(undefined)).toEqual({
      flexGrow: 1,
      flexShrink: 1,
    });
  });

  test('gives the focus guide the flex of a list sized by flex: 1', async () => {
    expect(await renderFocusGuideStyle({flex: 1})).toEqual({
      flex: 1,
      flexGrow: 1,
      flexShrink: 1,
    });
  });

  test('keeps size, margins and looks off the focus guide', async () => {
    expect(
      await renderFocusGuideStyle([
        {height: 200, margin: 10, backgroundColor: 'red'},
        {flexGrow: 2, flexBasis: 100, alignSelf: 'stretch'},
      ]),
    ).toEqual({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: 100,
      alignSelf: 'stretch',
    });
  });
});
