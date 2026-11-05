/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {coreVersionForTVVersion} = require('../utils');

describe('coreVersionForTVVersion', () => {
  test('removes the TV suffix of a release', () => {
    expect(coreVersionForTVVersion('0.75.2-0')).toBe('0.75.2');
    expect(coreVersionForTVVersion('0.88.1-tv.0')).toBe('0.88.1');
  });

  test('maps a TV prerelease to the core prerelease', () => {
    expect(coreVersionForTVVersion('0.76.0-0rc1')).toBe('0.76.0-rc.1');
  });

  test('removes the out-of-tree preview offset from the patch number', () => {
    expect(coreVersionForTVVersion('0.88.101-tv.0')).toBe('0.88.1');
    expect(coreVersionForTVVersion('0.88.110-tv.2')).toBe('0.88.10');
  });
});
