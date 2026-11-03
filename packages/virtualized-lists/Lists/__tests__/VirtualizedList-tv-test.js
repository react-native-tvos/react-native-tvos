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
import {Platform, TVFocusGuideView} from 'react-native';
import {act, create} from 'react-test-renderer';

jest.useFakeTimers();

describe('VirtualizedList on TV', () => {
  beforeEach(() => {
    jest.spyOn(Platform, 'isTV', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function renderList(style) {
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
    return component;
  }

  function guideStyle(component) {
    return component.root.findByType(TVFocusGuideView).props.style;
  }

  it('forwards flex sizing of the list style to the focus guide', async () => {
    const component = await renderList({flex: 1});
    expect(guideStyle(component)).toMatchObject({flex: 1});
  });

  it('forwards flexGrow, flexShrink, flexBasis and alignSelf', async () => {
    const component = await renderList([
      {flexGrow: 2, flexShrink: 0},
      {flexBasis: 10, alignSelf: 'stretch', backgroundColor: 'red'},
    ]);
    const style = guideStyle(component);
    expect(style).toMatchObject({
      flexGrow: 2,
      flexShrink: 0,
      flexBasis: 10,
      alignSelf: 'stretch',
    });
    expect(style).not.toHaveProperty('backgroundColor');
  });

  it('does not set flex sizing on the focus guide when the list style has none', async () => {
    const component = await renderList(undefined);
    expect(guideStyle(component).flex).toBeUndefined();
  });
});
