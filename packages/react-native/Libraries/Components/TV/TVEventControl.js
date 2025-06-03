/**
 * Methods to enable and disable listening for Apple TV remote events (menu key, pan gesture)
 *
 * @format
 * @flow
 */

'use strict';

import NativeTVNavigationEventEmitter from '../../../src/private/specs_DEPRECATED/modules/NativeTVNavigationEventEmitter';

const TVEventControl = {
  enableTVMenuKey: () => {
    NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.enableTVMenuKey();
  },
  disableTVMenuKey: () => {
    NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.disableTVMenuKey();
  },
  enableTVPanGesture: () => {
    NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.enableTVPanGesture();
  },
  disableTVPanGesture: () => {
    NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.disableTVPanGesture();
  },
  enableGestureHandlersCancelTouches: () => {
    NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.enableGestureHandlersCancelTouches();
  },
  disableGestureHandlersCancelTouches: () => {
    NativeTVNavigationEventEmitter &&
      NativeTVNavigationEventEmitter.disableGestureHandlersCancelTouches();
  },
};

export default TVEventControl;
