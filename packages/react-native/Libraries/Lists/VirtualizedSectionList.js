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

import {typeof VirtualizedSectionList as VirtualizedSectionListType} from '@react-native-tvos/virtualized-lists';

const VirtualizedSectionList: VirtualizedSectionListType =
  require('@react-native-tvos/virtualized-lists').VirtualizedSectionList;

export type {
  SectionBase,
  ScrollToLocationParamsType,
} from '@react-native-tvos/virtualized-lists';
module.exports = VirtualizedSectionList;
