---
name: tv-focus-navigation
description: Use when implementing focus-based navigation for TV apps, using TVFocusGuideView, configuring focus trapping, handling focus/blur events on Pressable/Touchable controls, managing VirtualizedList focus behavior, or using nextFocus direction props.
version: 1.0.0
license: MIT
---

# TV Focus Navigation

## When to Use

- Implementing focus-based navigation with remote controls or D-Pads
- Using `TVFocusGuideView` to guide focus between non-aligned controls
- Trapping focus within a container (e.g., a sidebar or modal)
- Handling focus/blur events on interactive controls
- Configuring VirtualizedList/FlatList for TV focus management
- Using `nextFocus*` props to override default focus direction

## When NOT to Use

- Handling raw remote button events — use the `tv-remote-input` skill instead
- Platform detection — use the `tv-platform-detection` skill instead

## Pressable and Touchable Focus Events

TV focus events work natively on `Pressable`, `TouchableHighlight`, and `TouchableOpacity`. These components "just work" on both Apple TV and Android TV:

| Event | When it fires |
|---|---|
| `onFocus()` | View gains focus |
| `onBlur()` | View loses focus |
| `onPress()` | "Select" button pressed (center button on remote/DPad) |
| `onPressIn()` | "Select" button pressed down |
| `onPressOut()` | "Select" button released |
| `onLongPress()` | "Select" button held down |

> `TouchableNativeFeedback` and `TouchableWithoutFeedback` respond to press events but **not** focus/blur. They are not recommended for TV.

Focus and blur events are fully native core events — they respond correctly to capturing and bubbling event handlers in `View` components.

### Tailwind Support

These focus events enable support for [`focus:` and `active:` pseudo classes in Tailwind/NativeWind styles](https://www.nativewind.dev/core-concepts/states#hover-focus-and-active-).

## TVFocusGuideView

Provides support for Apple's `UIFocusGuide` API, implemented identically on Android TV. Ensures focusable controls can be navigated to, even when not directly aligned with other controls.

### Props

| Prop | Type | Description |
|---|---|---|
| `destinations` | `any[]?` | Array of components to register as focus destinations |
| `autoFocus` | `boolean?` | Automatically manages focus — redirects to first focusable child on first visit, remembers last focused child on subsequent visits. `destinations` takes precedence. |
| `focusable` | `boolean?` | When `false`, this view and all subviews become non-focusable |
| `trapFocusUp` | `boolean?` | Prevents focus from escaping upward |
| `trapFocusDown` | `boolean?` | Prevents focus from escaping downward |
| `trapFocusLeft` | `boolean?` | Prevents focus from escaping left |
| `trapFocusRight` | `boolean?` | Prevents focus from escaping right |

### Example

```jsx
import { TVFocusGuideView } from 'react-native';

<TVFocusGuideView autoFocus trapFocusLeft trapFocusRight>
  <Pressable onPress={() => {}}>
    <Text>Item 1</Text>
  </Pressable>
  <Pressable onPress={() => {}}>
    <Text>Item 2</Text>
  </Pressable>
</TVFocusGuideView>
```

## Next Focus Direction Props

The `nextFocusUp`, `nextFocusDown`, `nextFocusLeft`, and `nextFocusRight` props on `View` work on both iOS and Android (previously Android-only).

> **Caveat (iOS):** If there is no focusable element in the `nextFocus*` direction adjacent to the starting view, iOS does not check for the override destination.

## VirtualizedList / FlatList

VirtualizedList is extended for TV focus management. All improvements apply automatically to `FlatList` and other VirtualizedList-based components.

### Defaults

VirtualizedList contents are automatically wrapped with a `TVFocusGuideView` with `trapFocus*` properties enabled based on list orientation. This prevents focus from accidentally leaving the list due to virtualization until reaching the beginning or end.

### Additional Props

| Prop | Type | Description |
|---|---|---|
| `additionalRenderRegions` | `{first: number; last: number;}[]?` | Defines always-rendered regions not subject to virtualization. Useful for preventing blank areas in critical list sections. Regions are specified as index ranges and rendered lazily after initial render. |

## TVTextScrollView

On Apple TV, a `ScrollView` won't scroll unless it contains focusable items. `TVTextScrollView` works on both Apple TV and Android TV, using native code to enable scrolling via swipe gestures on the remote control.

## Apple TV Parallax Animations

Native code implements Apple-recommended parallax animations to guide the eye during focus navigation. These animations can be disabled or adjusted with optional view properties.

## Back Navigation

`BackHandler` supports back navigation on Apple TV using the menu button or `<` button on the remote, in addition to the standard Android TV back button behavior.
