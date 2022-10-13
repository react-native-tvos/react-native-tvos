/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const React = require('react');
const Platform = require('../../Utilities/Platform');
import TVFocusGuideView from './TVFocusGuideView';
import type {TVFocusGuideViewProps} from './TVFocusGuideView';

export type TVBlockFocusViewProps = $Diff<
  TVFocusGuideViewProps,
  {
    destinations: *,
    children: *,
  },
>;

/**
 * Android-only This component blocks (or "consumes") the focus going in its direction instead of letting Android's focus system trying the find the closest focusable element.
 * "-1" as destination forces the TVFocusGuideView to consume the focus.
 */

const TVBlockFocusView = (props: TVBlockFocusViewProps): React.Node => {
  if (Platform.OS === 'ios') {
    return null;
  }
  return <TVFocusGuideView {...props} destinations={[-1]} />;
};

module.exports = TVBlockFocusView;
