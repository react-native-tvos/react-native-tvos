/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {Platform} from 'react-native';

// Caps lists and example frames to a readable, centered width on wide layouts.
// TV screens are viewed from a distance, so content there uses the full width.
export const maxContentWidthStyle = {
  width: '100%',
  maxWidth: (Platform.isTV ? undefined : 600) as ?number,
  alignSelf: 'center',
} as const;
