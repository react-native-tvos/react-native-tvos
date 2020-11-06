## react-native-tvos

Going forward, Apple TV support for React Native will be maintained here and in the corresponding `react-native-tvos` NPM package, and not in the [core repo](https://github.com/facebook/react-native/).  This is a full fork of the main repository, with only the changes needed to support Apple TV.

Releases of `react-native-tvos` will be based on a public release of `react-native`; e.g. the 0.63.1-0 release of this package will be derived from the 0.63.1 release of `react-native`. All releases of this repo will follow the 0.xx.x-y format, where x digits are from a specific RN core release, and y represents the additional versioning from this repo.

Releases will be published on npmjs.org and you may find the latest release version here: https://www.npmjs.com/package/react-native-tvos?activeTab=versions or use the tag `@latest`

You will find the relevant tvOS support and maintenance within the branches marked `tvos-v0.xx.x`;   

To build your project for Apple TV, you should change your `package.json` imports to import `react-native` as follows, so that this package is used instead of the core react-native package.

```js
"react-native": "npm:react-native-tvos@latest",
```

You cannot use this package and the core react-native package simultaneously in a project.

### Typescript

Due to the nature of the typing resolution, the current solution to include types is to:

- install `@types/react-native` as a dev dependency
- put `import 'react-native/tvos-types.d'` in any of your `.ts` files (root suggested)

## General support for Apple TV

TV devices support has been implemented with the intention of making existing React Native applications "just work" on Apple TV, with few or no changes needed in the JavaScript code for the applications.

The RNTester app supports Apple TV.  In this repo, `RNTester/Podfile` and `RNTester/RNTesterPods.xcodeproj` have been modified to work for tvOS.  Run `pod install`, then open `RNTesterPods.xcworkspace` and build.

## Pitfall

Make sure you do not globally install `react-native` or `react-native-tvos`. You should only install `react-native-cli` to use the commands below. If you have done this the wrong way, you may get error messages like:

```
ld: library not found for -lPods-TestApp-tvOS
```

You should also install `yarn` globally, as it should be used instead of npm for working in React Native projects.

## Build changes

- _Native layer_: React Native Xcode projects all now have Apple TV build targets, with names ending in the string '-tvOS'.

- _react-native init_: Creating a new project that uses this package is done using the react-native CLI.  New projects created this way will automatically have properly configured Apple TV targets created in their XCode projects.

To use this NPM package in a new project, you can reference it as in the following example using the older `react-native-cli` package:

```sh
# Make sure you have the CLI installed globally (this only needs to be done once on your system)
npm install -g react-native-cli
# Init an app called 'TestApp', note that you must not be in a node module (directory with node_modules sub-directory) for this to work
react-native init TestApp --version=react-native@npm:react-native-tvos@latest
# Now start the app in the tvOS Simulator - this will only work on a macOS machine
cd TestApp && react-native run-ios  --simulator "Apple TV" --scheme "TestApp-tvOS"
```

If you are using the newer `@react-native-community/cli` package, the syntax is slightly different:

```sh
# Make sure you have the CLI installed globally (this only needs to be done once on your system)
npm install -g @react-native-community/cli
# Init an app called 'TestApp', note that you must not be in a node module (directory with node_modules sub-directory) for this to work
react-native init TestApp --template=react-native-tvos@latest
# Now start the app in the tvOS Simulator - this will only work on a macOS machine
cd TestApp && react-native run-ios  --simulator "Apple TV" --scheme "TestApp-tvOS"
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

- _TV remote/keyboard input_: A native class, `RCTTVRemoteHandler`, sets up gesture recognizers for TV remote events. When TV remote events occur, this class fires notifications that are picked up by `RCTTVNavigationEventEmitter` (a subclass of `RCTEventEmitter`), that fires a JS event. This event will be picked up by instances of the `TVEventHandler` JavaScript object. Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events.  In 0.63.1-1, we have added `useTVEventHandler`, which wraps `useEffect` to make this more convenient and simpler for use with functional components.

```javascript

import { TVEventHandler, useTVEventHandler } from 'react-native';

// Functional component

const TVEventHandlerView: () => React.Node = () => {
  const [lastEventType, setLastEventType] = React.useState('');

  const myTVEventHandler = evt => {
    setLastEventType(evt.eventType);
  };

  useTVEventHandler(myTVEventHandler);

  return (
    <View>
      <TouchableOpacity onPress={() => {}}>
        <Text>
          This example enables an instance of TVEventHandler to show the last
          event detected from the Apple TV Siri remote or from a keyboard.
        </Text>
      </TouchableOpacity>
      <Text style={{color: 'blue'}}>{lastEventType}</Text>
    </View>
  );

};

// Class based component

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

- _Turbomodules_: Working as of the 0.61.2-0 release.

- _Flipper_: Working in the 0.62.2-x releases.  Working in the 0.63.1-1 and later releases; however, tvOS requires the Flipper pods from 0.62.2-x.  `scripts/react_native_pods.rb` contains macros for both versions.  The new project template Podfile is correctly set up to provide the older Flipper for both iOS and tvOS targets.

- _LogBox_: The new LogBox error/warning display (which replaced YellowBox in 0.63) is working as expected in tvOS, after a few adjustments to make the controls accessible to the focus engine.

- _Pressable_: The new `Pressable` API for React Native 0.63 works with TV.  Additional `onFocus` and `onBlur` props are provided to allow you to customize behavior when a Pressable enters or leaves focus. Similar to the `pressed` state that is true while a user is pressing the component on a touchscreen, the `focused` state will be true when it is focused on TV.  `PressableExample` in RNTester has been modified appropriately.

- _Dev Menu support_: On the simulator, cmd-D will bring up the developer menu, just like on iOS. To bring it up on a real Apple TV device, make a long press on the play/pause button on the remote. (Please do not shake the Apple TV device, that will not work :) )

- _TV remote animations_: `RCTTVView` native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views. The animations can be disabled or adjusted with new optional view properties.

- _Back navigation with the TV remote menu button_: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button on the TV remote.

- _TVMenuControl_: This module provides methods to enable and disable navigation using the menu key on the TV remote.  This is required in order to fix an issue with Apple's guidelines for menu key navigation (see https://github.com/facebook/react-native/issues/18930).  The `RNTester` app uses this new module to implement correct menu key behavior.

- _TVFocusGuideView_: This component provides support for Apple's `UIFocusGuide` API, to help ensure that focusable controls can be navigated to, even if they are not directly in line with other controls.  An example is provided in `RNTester` that shows two different ways of using this component.

- _Next Focus Direction_: the props `nextFocus*` on `View` should work as expected on iOS too (previously android only). One caveat is that if there is no focusable in the `nextFocusable*` direction next to the starting view, iOS doesn't check if we want to override the destination. 

- _TVTextScrollView_: On Apple TV, a ScrollView will not scroll unless there are focusable items inside it or above/below it.  This component wraps ScrollView and uses tvOS-specific native code to allow scrolling using swipe gestures from the remote control.

- _Known issues_:

  - As of the 0.61.2-0 release, Fabric code does not compile or run.  Issue is under investigation.
  - There are known issues with the TabBarIOS component, due to changes that Apple made in UITabBar for tvOS 13.

