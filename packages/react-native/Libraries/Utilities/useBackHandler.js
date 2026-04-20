/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {useEffect, useRef} from 'react';
import Platform from './Platform';
import BackHandler from './BackHandler';
import NativeTVNavigationEventEmitter from '../../src/private/specs_DEPRECATED/modules/NativeTVNavigationEventEmitter';

type BackHandlerEntry = {
  handler: () => ?boolean,
  enabled: boolean,
};

// Module-level registry shared across all hook instances.
// Entries are pushed on mount and spliced on unmount.
// Position is stable: toggling `enabled` never causes re-ordering.
const _registry: Array<BackHandlerEntry> = [];
let _backHandlerSub: ?{remove: () => void, ...} = null;

function _ensureSubscribed(): void {
  if (_backHandlerSub != null) {
    return;
  }
  // One BackHandler subscription acts as the dispatcher for all hook instances.
  // Existing BackHandler.addEventListener calls (e.g. from React Navigation)
  // coexist in BackHandler's subscription list and are unaffected.
  _backHandlerSub = BackHandler.addEventListener(
    'hardwareBackPress',
    (): ?boolean => {
      for (let i = _registry.length - 1; i >= 0; i--) {
        const entry = _registry[i];
        if (entry.enabled && entry.handler()) {
          return true;
        }
      }
      return false;
    },
  );
}

function _updateNativeCount(delta: number): void {
  // Only tvOS requires explicit counter management. On tvOS, pressesBegan
  // on RCTRootView reads this counter to decide whether to claim the press.
  // On Android TV / Fire TV, the system handles the unhandled case natively.
  if (!Platform.isTV || NativeTVNavigationEventEmitter == null) {
    return;
  }
  if (delta > 0) {
    NativeTVNavigationEventEmitter.incrementBackHandlerCount();
  } else {
    NativeTVNavigationEventEmitter.decrementBackHandlerCount();
  }
}

type Options = {
  /**
   * Whether this handler is currently active. Defaults to true.
   *
   * Toggling this does not change the handler's position in the LIFO queue.
   * On tvOS: when enabled is false this handler does not count toward the
   * native gate, so the system can background the app if no other handlers
   * are enabled.
   *
   * On tvOS: if enabled is true, the handler should return true to consume
   * the event. Returning false from an enabled handler leaves the press
   * consumed with no system fallback. Use enabled:false as the conditional
   * gate instead of returning false.
   */
  enabled?: boolean,
};

/**
 * Hook for handling the TV remote back/menu button press (and the Android
 * hardware back button).
 *
 * Replaces BackHandler.addEventListener with automatic lifecycle management:
 * the handler registers on mount and unregisters on unmount.
 *
 * On tvOS: when no enabled handlers are registered the system handles the
 * button press naturally, backgrounding the app. There is no need to call
 * TVEventControl.enableTVMenuKey() or disableTVMenuKey().
 *
 * Example:
 * ```js
 * useBackHandler(() => {
 *   navigation.goBack();
 *   return true;
 * });
 *
 * // With conditional handling:
 * useBackHandler(() => {
 *   closeOverlay();
 *   return true;
 * }, { enabled: isOverlayOpen });
 * ```
 */
export function useBackHandler(
  handler: () => ?boolean,
  {enabled = true}: Options = {},
): void {
  const entryRef = useRef<?BackHandlerEntry>(null);

  // Register once at mount. Position is stable for the component's lifetime.
  useEffect(() => {
    const entry: BackHandlerEntry = {handler, enabled};
    entryRef.current = entry;
    _registry.push(entry);
    _ensureSubscribed();

    if (enabled) {
      _updateNativeCount(1);
    }

    return () => {
      const idx = _registry.indexOf(entry);
      if (idx !== -1) {
        _registry.splice(idx, 1);
      }
      if (entry.enabled) {
        _updateNativeCount(-1);
      }
      if (_registry.length === 0 && _backHandlerSub != null) {
        _backHandlerSub.remove();
        _backHandlerSub = null;
      }
    };
    // Intentionally empty deps: register once on mount, clean up on unmount.
    // handler and enabled are managed by their own effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep handler ref current without changing position in the registry.
  useEffect(() => {
    const entry = entryRef.current;
    if (entry != null) {
      entry.handler = handler;
    }
  }, [handler]);

  // Toggle enabled in place: stable position, only flag and native counter change.
  useEffect(() => {
    const entry = entryRef.current;
    if (entry == null) {
      return;
    }
    const wasEnabled = entry.enabled;
    entry.enabled = enabled;

    if (!wasEnabled && enabled) {
      _updateNativeCount(1);
    } else if (wasEnabled && !enabled) {
      _updateNativeCount(-1);
    }
  }, [enabled]);
}
