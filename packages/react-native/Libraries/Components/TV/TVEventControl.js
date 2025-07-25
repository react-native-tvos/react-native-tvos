/**
 * Methods to enable and disable listening for Apple TV remote events (menu key, pan gesture)
 *
 * @format
 * @flow
 */

'use strict';

import NativeTVNavigationEventEmitter from '../../../src/private/specs_DEPRECATED/modules/NativeTVNavigationEventEmitter';
import Platform from '../../Utilities/Platform';

const TVEventControl = {
  enableTVMenuKey: () => {
    Platform.isTV && NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.enableTVMenuKey();
  },
  disableTVMenuKey: () => {
    Platform.isTV && NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.disableTVMenuKey();
  },
  enableTVPanGesture: () => {
    Platform.isTV && NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.enableTVPanGesture();
  },
  disableTVPanGesture: () => {
    Platform.isTV && NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.disableTVPanGesture();
  },
  enableGestureHandlersCancelTouches: () => {
    Platform.isTV && NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.enableGestureHandlersCancelTouches();
  },
  disableGestureHandlersCancelTouches: () => {
    Platform.isTV && NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.disableGestureHandlersCancelTouches();
  },
};

export default TVEventControl;
