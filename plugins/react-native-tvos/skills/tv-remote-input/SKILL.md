---
name: tv-remote-input
description: Use when handling TV remote control events, keyboard input on TV, using TVEventHandler or useTVEventHandler hook, or configuring Apple TV Siri remote features with TVEventControl (pan gestures, menu key).
version: 1.0.0
license: MIT
---

# TV Remote Input

## When to Use

- Handling custom TV remote control events (directional, select, play/pause, etc.)
- Using `TVEventHandler` or `useTVEventHandler` for remote event listeners
- Configuring Apple TV Siri remote features (pan gestures, menu key behavior)
- Building games or custom navigation that needs raw remote input

## When NOT to Use

- Standard focus navigation with Pressable/Touchable — use the `tv-focus-navigation` skill instead
- Back navigation — `BackHandler` already handles menu/back button (see `tv-focus-navigation`)

## TVEventHandler

For custom handling of TV remote events, use `TVEventHandler` to listen for events.

### Functional Component (Hook API)

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

### Class Component (Subscription API)

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

## Event Types

Common `eventType` values from TV remote events:
- `up`, `down`, `left`, `right` — directional navigation
- `select` — center/select button
- `playPause` — play/pause button (Apple TV)
- `longSelect` — long press on select button

## TVEventControl (Apple TV Only)

Formerly "TVMenuControl". Provides methods to enable and disable features on the Apple TV Siri remote.

### Menu Key Control

Enable/disable the menu key gesture recognizer to implement correct menu key navigation per Apple's guidelines:

```javascript
import { TVEventControl } from 'react-native';

TVEventControl.enableTVMenuKey();
TVEventControl.disableTVMenuKey();
```

### Pan Gesture Control

Enable/disable detection of finger touch panning across the Siri remote touch surface:

```javascript
TVEventControl.enableTVPanGesture();
TVEventControl.disableTVPanGesture();
```

See `TVEventHandlerExample` in the RNTester app for a demo.

### Gesture Handler Touch Cancellation

Control whether gesture handlers in `RCTTVRemoteHandler` cancel touches:

```javascript
TVEventControl.enableGestureHandlersCancelTouches();   // default in 0.69 and earlier
TVEventControl.disableGestureHandlersCancelTouches();
```

## Dev Menu

- **Apple TV Simulator:** `Cmd+D` opens the developer menu (same as iOS)
- **Real Apple TV device:** Long press play/pause button on remote
- **Android TV:** Same behavior as Android phone
- **Expo dev menu:** Supported on TV as of Expo SDK 54 and RNTV 0.81 (Apple TV EAS login not yet available)
