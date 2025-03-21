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

export type {
  ViewToken,
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
} from '@react-native-tvos/virtualized-lists';

import VirtualizedLists from '@react-native-tvos/virtualized-lists';

type ViewabilityHelperType = typeof VirtualizedLists.ViewabilityHelper;
const ViewabilityHelper: ViewabilityHelperType =
  VirtualizedLists.ViewabilityHelper;

export default ViewabilityHelper;
