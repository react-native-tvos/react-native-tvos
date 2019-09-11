## react-native-tvos

Going forward, Apple TV support for React Native will be maintained here and in the corresponding `react-native-tvos` NPM package, and not in the [core repo](https://github.com/facebook/react-native/).  This is a full fork of the main repository, with only the changes needed to support Apple TV.

Releases of `react-native-tvos` will be based on a public release of `react-native`; e.g. the 0.59.10-1 release of this package will be derived from the 0.59.10 release of `react-native`.

To build your project for Apple TV, you should change your `package.json` imports to import `react-native` as follows, so that this package is used.

```js
"react-native": "npm:react-native-tvos@0.59.10-1",
```

## General support for Apple TV

TV devices support has been implemented with the intention of making existing React Native applications "just work" on Apple TV, with few or no changes needed in the JavaScript code for the applications.

The RNTester app supports Apple TV.
- _Without cocoapods:_ In `RNTester/RNTester.xcodeproj`,  use the `RNTester-tvOS` build target to build for tvOS.
- _With cocoapods:_ In this repo, `RNTester/Podfile` and `RNTester/RNTesterPods.xcodeproj` have been modified to work for tvOS.  Run `pod install`, then open `RNTesterPods.xcworkspace` and build.

## Build changes

- _Native layer_: React Native Xcode projects all now have Apple TV build targets, with names ending in the string '-tvOS'.

- _react-native init_: New React Native projects created with `react-native init` will have Apple TV target automatically created in their XCode projects.  To use this NPM package for creating a new project, you can reference it as in the following example:

```sh
react-native init TestApp --version=react-native@npm:react-native-tvos@0.59.10-1
```

- _JavaScript layer_: Support for Apple TV has been added to `Platform.ios.js`. You can check whether code is running on AppleTV by doing

```javascript
var Platform = require('Platform');
var running_on_tv = Platform.isTV;

// If you want to be more specific and only detect devices running tvOS
// (but no Android TV devices) you can use:
var running_on_apple_tv = Platform.isTVOS;
```

## Code changes

- _General support for tvOS_: Apple TV specific changes in native code are all wrapped by the TARGET_OS_TV define. These include changes to suppress APIs that are not supported on tvOS (e.g. web views, sliders, switches, status bar, etc.), and changes to support user input from the TV remote or keyboard.

- _Common codebase_: Since tvOS and iOS share most Objective-C and JavaScript code in common, most documentation for iOS applies equally to tvOS.

- _Access to touchable controls_: When running on Apple TV, the native view class is `RCTTVView`, which has additional methods to make use of the tvOS focus engine. The `Touchable` mixin has code added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `TouchableWithoutFeedback`, `TouchableHighlight` and `TouchableOpacity` will "just work". In particular:

  - `onFocus` will be executed when the touchable view goes into focus
  - `onBlur` will be executed when the touchable view goes out of focus
  - `onPress` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote.

- _TV remote/keyboard input_: A new native class, `RCTTVRemoteHandler`, sets up gesture recognizers for TV remote events. When TV remote events occur, this class fires notifications that are picked up by `RCTTVNavigationEventEmitter` (a subclass of `RCTEventEmitter`), that fires a JS event. This event will be picked up by instances of the `TVEventHandler` JavaScript object. Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events, as in the following code:

```javascript
var TVEventHandler = require('TVEventHandler');

class Game2048 extends React.Component {
  _tvEventHandler: any;

  _enableTVEventHandler() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      if (evt && evt.eventType === 'right') {
        cmp.setState({board: cmp.state.board.move(2)});
      } else if(evt && evt.eventType === 'up') {
        cmp.setState({board: cmp.state.board.move(1)});
      } else if(evt && evt.eventType === 'left') {
        cmp.setState({board: cmp.state.board.move(0)});
      } else if(evt && evt.eventType === 'down') {
        cmp.setState({board: cmp.state.board.move(3)});
      } else if(evt && evt.eventType === 'playPause') {
        cmp.restartGame();
      }
    });
  }

  _disableTVEventHandler() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  }

  componentDidMount() {
    this._enableTVEventHandler();
  }

  componentWillUnmount() {
    this._disableTVEventHandler();
  }
```

- _Dev Menu support_: On the simulator, cmd-D will bring up the developer menu, just like on iOS. To bring it up on a real Apple TV device, make a long press on the play/pause button on the remote. (Please do not shake the Apple TV device, that will not work :) )

- _TV remote animations_: `RCTTVView` native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views. The animations can be disabled or adjusted with new optional view properties.

- _Back navigation with the TV remote menu button_: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button on the TV remote.

- _TabBarIOS behavior_: The `TabBarIOS` component wraps the native `UITabBar` API, which works differently on Apple TV. To avoid jittery rerendering of the tab bar in tvOS (see [this issue](https://github.com/facebook/react-native/issues/15081)), the selected tab bar item can only be set from Javascript on initial render, and is controlled after that by the user through native code.

- _TVMenuControl_: This module provides methods to enable and disable navigation using the menu key on the TV remote.  This is required in order to fix an issue with Apple's guidelines for menu key navigation (see https://github.com/facebook/react-native/issues/18930).  The `RNTester` app uses this new module to implement correct menu key behavior.

- _TVFocusGuideView_: This component provides support for Apple's `UIFocusGuide` API, to help ensure that focusable controls can be navigated to, even if they are not directly in line with other controls.  A new example is provided in `RNTester`.

- _Known issues_:

  - [ListView scrolling](https://github.com/facebook/react-native/issues/12793). The issue can be easily worked around by setting `removeClippedSubviews` to false in ListView and similar components. For more discussion of this issue, see [this PR](https://github.com/facebook/react-native/pull/12944).
