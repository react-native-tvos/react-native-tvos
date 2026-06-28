/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BlurEvent, FocusEvent} from '../../Types/CoreEventTypes';

import * as React from 'react';

type FocusEnterLeaveState = {
  entered: boolean,
  pendingLeave: ?TimeoutID,
};

export type FocusEnterLeaveHandlers = {
  handleFocusCapture: (event: FocusEvent) => void,
  handleBlurCapture: (event: BlurEvent) => void,
};

/**
 * Collapses the per-descendant focus/blur events into a single enter (focus
 * crosses into the subtree) and a single leave (focus fully exits). A
 * child-to-child move fires blur then focus back to back, so the deferred
 * leave gets cancelled by the incoming focus and nothing fires.
 *
 * Hooks the capture phase, not bubble: capture reaches the container before
 * any descendant sees the event, so a descendant calling stopPropagation
 * can't leave us desynced.
 */
export default function useFocusEnterLeave(
  onFocusEnter: ?(event: FocusEvent) => void,
  onFocusLeave: ?(event: BlurEvent) => void,
  onFocusCapture: ?(event: FocusEvent) => void,
  onBlurCapture: ?(event: BlurEvent) => void,
): FocusEnterLeaveHandlers {
  const stateRef = React.useRef<FocusEnterLeaveState>({
    entered: false,
    pendingLeave: null,
  });

  const handleFocusCapture = React.useCallback(
    (event: FocusEvent) => {
      const state = stateRef.current;
      if (state.pendingLeave != null) {
        clearTimeout(state.pendingLeave);
        state.pendingLeave = null;
      }
      if (!state.entered) {
        state.entered = true;
        onFocusEnter?.(event);
      }
      onFocusCapture?.(event);
    },
    [onFocusEnter, onFocusCapture],
  );

  const handleBlurCapture = React.useCallback(
    (event: BlurEvent) => {
      const state = stateRef.current;
      if (state.pendingLeave != null) {
        clearTimeout(state.pendingLeave);
      }
      // Defer: if focus lands on another descendant this same tick, the focus
      // handler clears this before it runs.
      state.pendingLeave = setTimeout(() => {
        state.pendingLeave = null;
        if (state.entered) {
          state.entered = false;
          onFocusLeave?.(event);
        }
      }, 0);
      onBlurCapture?.(event);
    },
    [onFocusLeave, onBlurCapture],
  );

  // Reset on unmount so a remounted instance starts clean and no deferred
  // leave fires after we're gone.
  React.useEffect(() => {
    const state = stateRef.current;
    return () => {
      if (state.pendingLeave != null) {
        clearTimeout(state.pendingLeave);
        state.pendingLeave = null;
      }
      state.entered = false;
    };
  }, []);

  return {handleFocusCapture, handleBlurCapture};
}
