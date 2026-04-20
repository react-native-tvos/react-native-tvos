# RFC: Back/Menu Button Handling on TV Platforms

**Status:** Draft for community discussion

**Affects:** tvOS, Android TV, Fire TV

---

## Problem

On tvOS, the Siri Remote's Menu/Back button is unreliable in several scenarios. The root cause is that `TVEventControl.enableTVMenuKey()` / `disableTVMenuKey()` is a **global boolean toggle**, not a reference-counted or component-scoped system.

This causes:

1. **Last call wins.** Multiple components calling `enableTVMenuKey` and `disableTVMenuKey` conflict. One component's cleanup disables the button for another.
2. **App stuck on screen.** When no JS handler handles the press, `BackHandler.exitApp()` is called. On tvOS this is a no-op (documented as "still to be implemented" in the source). The gesture has already consumed the press, so the system never sees it. The user cannot exit.
3. **Does not work with Modals.** React Native's `Modal` uses a separate `UIWindow`. The gesture recognizer lives on `RCTRootView` and never fires inside the modal.
4. **Manual lifecycle management.** Every component must call `enableTVMenuKey` on focus and `disableTVMenuKey` on cleanup. Forgetting either causes bugs. `useFocusEffect` is the wrong lifecycle hook for non-screen components like inline overlays.
5. **`BackHandler` API requires boilerplate.** Manual `addEventListener`/`remove` inside `useEffect` is verbose and leaks memory if cleanup is forgotten.

This is confirmed in react-native-tvos issues [#988](https://github.com/react-native-tvos/react-native-tvos/issues/988), [#341](https://github.com/react-native-tvos/react-native-tvos/issues/341), [#18](https://github.com/react-native-tvos/react-native-tvos/issues/18).

Android TV and Fire TV are not affected: `BackHandler` is natively backed via `OnBackPressedDispatcher` / `hardwareBackPress`, and the system handles the unhandled case automatically.

---

## Proposed Solution

Two changes, each independently useful.

### 1. Native: replace the boolean toggle with a reference-counted gate (tvOS only)

`RCTRootView` overrides `pressesBegan:withEvent:` and `pressesEnded:withEvent:` to gate the menu/back button on an atomic counter:

```objc
- (void)pressesBegan:(NSSet<UIPress *> *)presses withEvent:(UIPressesEvent *)event
{
  for (UIPress *press in presses) {
    if (press.type == UIPressTypeMenu && [RCTTVRemoteHandler backHandlerCount] > 0) {
      return; // claimed; notification fires on pressesEnded
    }
  }
  [super pressesBegan:presses withEvent:event];
}

- (void)pressesEnded:(NSSet<UIPress *> *)presses withEvent:(UIPressesEvent *)event
{
  for (UIPress *press in presses) {
    if (press.type == UIPressTypeMenu && [RCTTVRemoteHandler backHandlerCount] > 0) {
      [[NSNotificationCenter defaultCenter]
          postNavigationPressEventWithType:RCTTVRemoteEventMenu
                                 keyAction:RCTTVRemoteEventKeyActionUp
                                       tag:nil
                                    target:nil];
      return;
    }
  }
  [super pressesEnded:presses withEvent:event];
}
```

- Counter > 0: `pressesBegan` claims the press (UIKit delivers `pressesEnded` to this responder); `pressesEnded` posts the menu event to JS.
- Counter = 0: both methods call `super`. The press propagates through UIKit's responder chain to `UIApplication`, which backgrounds the app. **No code needed to "exit" the app.** The system does it.

This replaces the former `UITapGestureRecognizer` + `gestureRecognizerShouldBegin:` approach. Using `pressesBegan`/`pressesEnded` is the idiomatic UIKit mechanism for hardware button presses; gesture recognizers are designed for touch/trackpad input.

Two new native methods are exposed via `RCTTVNavigationEventEmitter`:

```objc
RCT_EXPORT_METHOD(incrementBackHandlerCount) { ... }
RCT_EXPORT_METHOD(decrementBackHandlerCount) { ... }
```

`TVEventControl.enableTVMenuKey()` and `disableTVMenuKey()` are **deprecated**. Existing calls become no-ops so existing code does not break.

`BackHandler.exitApp()` on tvOS is **deprecated**. It was always a no-op. In the new design the system handles "no handler registered" naturally.

### 2. JS: `useBackHandler` hook (all TV platforms)

A React hook that replaces `BackHandler.addEventListener` with automatic lifecycle management and stable LIFO ordering.

```js
import { useBackHandler } from 'react-native';

function MyScreen() {
  useBackHandler(() => {
    navigation.goBack();
    return true;
  });
}
```

With conditional handling:

```js
useBackHandler(() => {
  closeOverlay();
  return true;
}, { enabled: isOverlayOpen });
```

**Key properties:**

- **Auto-cleanup on unmount.** No manual `remove()` call needed.
- **Stable LIFO ordering.** A module-level registry ensures the handler's position never changes when `enabled` toggles. The last-mounted active handler always wins, regardless of `enabled` state changes on other handlers.
- **`enabled` option.** Toggle the handler without unmounting. When `enabled` is false, the native counter decrements so the gesture correctly falls through to the system.
- **One BackHandler subscription.** Internally, `useBackHandler` registers a single dispatcher with `BackHandler`. All hook instances are routed through it. Existing `BackHandler.addEventListener` calls (e.g. from React Navigation) continue to work.
- **No native changes on Android TV / Fire TV.** `_updateNativeCount` is a no-op on non-tvOS platforms.

**Important tvOS constraint:** On tvOS, if `enabled: true`, the handler should return `true`. The gesture has already consumed the press by the time JS runs. If the handler returns `false`, the press is lost. Use `enabled: false` as the conditional gate, not `return false`.

---

## Migration

### From `BackHandler.addEventListener`:

Before:
```js
useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    navigation.goBack();
    return true;
  });
  return () => sub.remove();
}, []);
```

After:
```js
useBackHandler(() => {
  navigation.goBack();
  return true;
});
```

### From `TVEventControl.enableTVMenuKey` / `disableTVMenuKey`:

Remove all calls. The new system manages this automatically.

---

## What Is NOT Changing

- `BackHandler` is **deprecated**, not removed. Existing code continues to work. React Navigation does not need to update before this ships.
- Android TV / Fire TV behavior is unchanged. The hook is an ergonomic improvement there, not a bug fix.
- `TVEventControl.enableTVPanGesture` / `disableTVPanGesture` and `enableGestureHandlersCancelTouches` / `disableGestureHandlersCancelTouches` are unchanged.

---

## Open Questions for Discussion

1. **`gestureRecognizerShouldBegin` vs `pressesBegan`.** ✅ Resolved: the reference implementation uses `pressesBegan`/`pressesEnded` on `RCTRootView`. This is the idiomatic UIKit path for hardware buttons, avoids gesture recognizer coordination overhead, and provides clean press-phase callbacks without a category shim. The `UITapGestureRecognizer` + delegate approach has been removed.

   The modal/separate-UIWindow limitation (Problem 3) is NOT fixed by the `RCTRootView`-level override, since each UIWindow has its own responder chain. A follow-on change could move the override to `RCTView` (individual view level): because the focused view in any UIWindow is an `RCTView`, pressing the menu key would enter the responder chain of that window and be handled correctly. That change is broader in scope and intentionally deferred. Reverting to a gesture recognizer (re-adding `tvMenuKeyRecognizer` + `gestureRecognizerShouldBegin:` in `RCTTVRemoteHandler`) is straightforward if needed.

2. **`useBackHandler` naming.** The hook is not TV-specific: the ergonomic improvements (auto-cleanup, `enabled`, stable ordering) benefit Android phone apps too. Should it be proposed to upstream React Native as `useBackHandler`, or stay TV-only in this fork?

3. **`BackHandler` removal timeline.** When should the deprecated `BackHandler` TV code be removed? This depends on React Navigation and other navigation library adoption.

---

## Implementation

The reference implementation on branch `proposal/use-back-handler` includes:

- `RCTTVRemoteHandler`: counter-based gate (`__backHandlerCount`), `incrementBackHandlerCount` / `decrementBackHandlerCount` class methods
- `RCTRootView`: `pressesBegan:`/`pressesEnded:` overrides that read `backHandlerCount` to gate the menu press
- `RCTTVNavigationEventEmitter`: `incrementBackHandlerCount` / `decrementBackHandlerCount` exported methods
- `NativeTVNavigationEventEmitter.js`: updated Turbo Module spec
- `useBackHandler.js`: the new hook
- `BackHandler.ios.js`: backward-compatible deprecation
- `TVEventControl.js`: deprecation of menu key methods
