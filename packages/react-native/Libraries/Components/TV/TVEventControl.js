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
  /**
   * @deprecated Use useBackHandler instead. The menu key is now managed
   * automatically via a reference-counted gate. Calling this method is a
   * no-op and will be removed in a future release.
   */
  enableTVMenuKey: () => {
    if (__DEV__) {
      console.warn(
        'TVEventControl.enableTVMenuKey() is deprecated. ' +
          'Use the useBackHandler hook instead. ' +
          'The menu key is now managed automatically.',
      );
    }
  },
  /**
   * @deprecated Use useBackHandler instead. The menu key is now managed
   * automatically via a reference-counted gate. Calling this method is a
   * no-op and will be removed in a future release.
   */
  disableTVMenuKey: () => {
    if (__DEV__) {
      console.warn(
        'TVEventControl.disableTVMenuKey() is deprecated. ' +
          'Use the useBackHandler hook instead. ' +
          'The menu key is now managed automatically.',
      );
    }
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
