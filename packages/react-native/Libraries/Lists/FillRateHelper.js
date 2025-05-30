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

import VirtualizedLists from '@react-native-tvos/virtualized-lists';

type FillRateHelperType = typeof VirtualizedLists.FillRateHelper;
const FillRateHelper: FillRateHelperType = VirtualizedLists.FillRateHelper;

export type {FillRateInfo} from '@react-native-tvos/virtualized-lists';
export default FillRateHelper;
