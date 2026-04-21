---
name: tv-specific-features
description: Use when implementing TV-specific features including focus-based navigation, TVFocusGuideView, focus trapping, Pressable/Touchable focus events, VirtualizedList TV focus, nextFocus direction props, TV remote control input, TVEventHandler, useTVEventHandler, TVEventControl, Apple TV Siri remote configuration, accessibility on TV, or LogBox on TV.
version: 1.0.0
license: MIT
---

# TV-Specific Features

## When to Use

- Implementing focus-based navigation with remote controls or D-Pads
- Using `TVFocusGuideView` to guide focus between non-aligned controls
- Trapping focus within a container (e.g., a sidebar or modal)
- Handling focus/blur events on interactive controls
- Configuring VirtualizedList/FlatList for TV focus management
- Using `nextFocus*` props to override default focus direction
- Handling custom TV remote control events
- Configuring Apple TV Siri remote features (pan gestures, menu key)
- TV accessibility features
- LogBox behavior on TV

## When NOT to Use

- Platform detection — use the `tv-platform-detection` skill instead
- Build configuration — use the `tv-build-configuration` skill instead
- Creating a new project — use the `tv-project-setup` skill instead

---

## Focus Navigation

### Pressable and Touchable Focus Events

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

### TVFocusGuideView

Provides support for Apple's `UIFocusGuide` API, implemented identically on Android TV. Ensures focusable controls can be navigated to, even when not directly aligned with other controls.

#### Props

| Prop | Type | Description |
|---|---|---|
| `destinations` | `any[]?` | Array of components to register as focus destinations |
| `autoFocus` | `boolean?` | Automatically manages focus — redirects to first focusable child on first visit, remembers last focused child on subsequent visits. `destinations` takes precedence. |
| `focusable` | `boolean?` | When `false`, this view and all subviews become non-focusable |
| `trapFocusUp` | `boolean?` | Prevents focus from escaping upward |
| `trapFocusDown` | `boolean?` | Prevents focus from escaping downward |
| `trapFocusLeft` | `boolean?` | Prevents focus from escaping left |
| `trapFocusRight` | `boolean?` | Prevents focus from escaping right |

#### Example

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

### Next Focus Direction Props

The `nextFocusUp`, `nextFocusDown`, `nextFocusLeft`, and `nextFocusRight` props on `View` work on both iOS and Android (previously Android-only).

> **Caveat (iOS):** If there is no focusable element in the `nextFocus*` direction adjacent to the starting view, iOS does not check for the override destination.

### VirtualizedList / FlatList

VirtualizedList is extended for TV focus management. All improvements apply automatically to `FlatList` and other VirtualizedList-based components.

**Defaults:** VirtualizedList contents are automatically wrapped with a `TVFocusGuideView` with `trapFocus*` properties enabled based on list orientation. This prevents focus from accidentally leaving the list due to virtualization until reaching the beginning or end.

| Prop | Type | Description |
|---|---|---|
| `additionalRenderRegions` | `{first: number; last: number;}[]?` | Defines always-rendered regions not subject to virtualization. Useful for preventing blank areas in critical list sections. Regions are specified as index ranges and rendered lazily after initial render. |

### TVTextScrollView

On Apple TV, a `ScrollView` won't scroll unless it contains focusable items. `TVTextScrollView` works on both Apple TV and Android TV, using native code to enable scrolling via swipe gestures on the remote control.

### Apple TV Parallax Animations

Native code implements Apple-recommended parallax animations to guide the eye during focus navigation. These animations can be disabled or adjusted with optional view properties.

### Back Navigation

`BackHandler` supports back navigation on Apple TV using the menu button or `<` button on the remote, in addition to the standard Android TV back button behavior.

---

## Remote Input

### TVEventHandler

For custom handling of TV remote events, use `TVEventHandler` to listen for events.

#### Functional Component (Hook API)

```javascript
import { useTVEventHandler } from 'react-native';

const TVEventHandlerView = () => {
  const [lastEventType, setLastEventType] = React.useState('');

  useTVEventHandler(evt => {
    setLastEventType(evt.eventType);
  });

  return (
    <View>
      <TouchableOpacity onPress={() => {}}>
        <Text>
          This example shows the last event detected from the
          Apple TV Siri remote or keyboard.
        </Text>
      </TouchableOpacity>
      <Text style={{ color: 'blue' }}>{lastEventType}</Text>
    </View>
  );
};
```

#### Class Component (Subscription API)

```javascript
import { TVEventHandler } from 'react-native';

class Game2048 extends React.Component {
  _tvEventHandlerSubscription;

  _enableTVEventHandler() {
    this._tvEventHandlerSubscription = TVEventHandler.addListener((evt) => {
      if (evt && evt.eventType === 'right') {
        this.setState({ board: this.state.board.move(2) });
      } else if (evt && evt.eventType === 'up') {
        this.setState({ board: this.state.board.move(1) });
      } else if (evt && evt.eventType === 'left') {
        this.setState({ board: this.state.board.move(0) });
      } else if (evt && evt.eventType === 'down') {
        this.setState({ board: this.state.board.move(3) });
      } else if (evt && evt.eventType === 'playPause') {
        this.restartGame();
      }
    });
  }

  _disableTVEventHandler() {
    if (this._tvEventHandlerSubscription) {
      this._tvEventHandlerSubscription.remove();
      delete this._tvEventHandlerSubscription;
    }
  }

  componentDidMount() {
    this._enableTVEventHandler();
  }

  componentWillUnmount() {
    this._disableTVEventHandler();
  }
}
```

### Event Types

Common `eventType` values from TV remote events:
- `up`, `down`, `left`, `right` — directional navigation
- `select` — center/select button
- `playPause` — play/pause button (Apple TV)
- `longSelect` — long press on select button

### TVEventControl (Apple TV Only)

Formerly "TVMenuControl". Provides methods to enable and disable features on the Apple TV Siri remote.

#### Menu Key Control

Enable/disable the menu key gesture recognizer to implement correct menu key navigation per Apple's guidelines:

```javascript
import { TVEventControl } from 'react-native';

TVEventControl.enableTVMenuKey();
TVEventControl.disableTVMenuKey();
```

#### Pan Gesture Control

Enable/disable detection of finger touch panning across the Siri remote touch surface:

```javascript
TVEventControl.enableTVPanGesture();
TVEventControl.disableTVPanGesture();
```

See `TVEventHandlerExample` in the RNTester app for a demo.

#### Gesture Handler Touch Cancellation

Control whether gesture handlers in `RCTTVRemoteHandler` cancel touches:

```javascript
TVEventControl.enableGestureHandlersCancelTouches();   // default in 0.69 and earlier
TVEventControl.disableGestureHandlersCancelTouches();
```

### Dev Menu

- **Apple TV Simulator:** `Cmd+D` opens the developer menu (same as iOS)
- **Real Apple TV device:** Long press play/pause button on remote
- **Android TV:** Same behavior as Android phone
- **Expo dev menu:** Supported on TV as of Expo SDK 54 and RNTV 0.81 (Apple TV EAS login not yet available)

---

## Accessibility

An additional `accessibilityFocus` [accessibility action](https://reactnative.dev/docs/accessibility#accessibility-actions) is available on Android for detecting focus changes on every accessible element (like `Text`) when TalkBack is enabled.

## LogBox

The LogBox error/warning display works on TV platforms, with adjustments to make controls accessible to the focus engine.
