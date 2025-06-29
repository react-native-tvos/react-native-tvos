/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Text from '../../../Text/Text';

const render = require('../../../../jest/renderer');
const LogBoxButton = require('../LogBoxButton').default;
const React = require('react');

// Mock `TouchableHighlight` because we are interested in snapshotting the
// behavior of `LogBoxButton`, not `TouchableHighlight`.
jest.mock('../../../Components/Touchable/TouchableHighlight', () => ({
  __esModule: true,
  default: 'TouchableHighlight',
}));

describe('LogBoxButton', () => {
  it('should render only a view without an onPress', async () => {
    const output = await render.create(
      <LogBoxButton
        backgroundColor={{
          default: 'black',
          pressed: 'red',
        }}>
        <Text>Press me</Text>
      </LogBoxButton>,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render TouchableHighlight and pass through props', async () => {
    const output = await render.create(
      <LogBoxButton
        backgroundColor={{
          default: 'black',
          pressed: 'red',
        }}
        hitSlop={{}}
        onPress={() => {}}>
        <Text>Press me</Text>
      </LogBoxButton>,
    );

    expect(output).toMatchSnapshot();
  });
});
