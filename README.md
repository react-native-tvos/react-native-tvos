## react-native-tvos

Apple TV and Android TV support for React Native are maintained here and in the corresponding `react-native-tvos` NPM package, and not in the [core repo](https://github.com/facebook/react-native/).  This is a full fork of the main repository, with only the changes needed to support Apple TV and Android TV.

Releases of `react-native-tvos` will be based on a public release of `react-native`; e.g. the 0.72.4-0 release of this package will be derived from the 0.72.4 release of `react-native`. All releases of this repo will follow the 0.xx.x-y format, where x digits are from a specific RN core release, and y represents the additional versioning from this repo.

Releases will be published on npmjs.org and you may find the latest release version here: https://www.npmjs.com/package/react-native-tvos?activeTab=versions or use the tag `@latest`

You will find the relevant tvOS support and maintenance within the branches marked `tvos-v0.xx.x`;   

To build your project for Apple TV, you should change your `package.json` imports to import `react-native` as follows, so that this package is used instead of the core react-native package.

```js
"react-native": "npm:react-native-tvos@latest",
```

You cannot use this package and the core react-native package simultaneously in a project.

### Hermes JS support

As of the 0.71 release, Hermes is fully working on both Apple TV and Android TV, and is enabled by default.

### React Native new architecture (Fabric) support

- _Apple TV_: Modify your app's Podfile to set the `:fabric_enabled` value to `true` in both iOS and tvOS targets. After that, run `pod install` to pick up the additional pods needed for the new architecture. Some components (TVTextScrollView, TabBarIOS) have not been reimplemented in the new architecture so they will show up as an "unimplemented component".
- _Android TV_: To enable Fabric, modify `android/gradle.properties` in your app and set `newArchEnabled=true`, then rebuild your app.

### Typescript

Typescript types for TV-specific components and APIs have been added to `types/public`.

## General support for TV

TV device support has been implemented with the intention of making existing React Native applications "just work" on TV, with few or no changes needed in the JavaScript code for the applications.

The RNTester app supports Apple TV and Android TV.  In this repo, `RNTester/Podfile` and `RNTester/RNTesterPods.xcodeproj` have been modified to work for tvOS.  Run `pod install`, then open `RNTesterPods.xcworkspace` and build.


You should also install `yarn` globally, as it should be used instead of `npm` for working in React Native projects.

## Build changes

- _Native layer for Apple TV_: React Native Xcode projects all now have Apple TV build targets, with names ending in the string '-tvOS'.  Changes in the React Native podspecs in 0.73 now require that your application `Podfile` only have one target. This repo supports either an iOS target or a tvOS target, but both targets should not be active at the same time. The new app template now has the iOS target commented out.
- _Maven artifacts for Android TV_: In 0.71, the React Native Android prebuilt archives are published to Maven instead of being included in the NPM. We are following the same model, except that the Maven artifacts will be in group `io.github.react-native-tvos` instead of `com.facebook.react`. The `@react-native/gradle-plugin` module has been upgraded so that the Android dependencies will be detected correctly during build.

## _(New)_ Project creation using the Expo CLI

> _Pitfall:_ Make sure you do not globally install `react-native` or `react-native-tvos`. If you have done this the wrong way, you may get error messages like `ld: library not found for -lPods-TestApp-tvOS`.

We strongly recommend [Yarn](https://classic.yarnpkg.com/en/docs/install) as the package manager.

To create a new project, use `yarn create react-native-app` as shown below. (This will install the Expo tool `create-react-native-app` for you if it is not already present.)

New projects created this way will automatically have properly configured iPhone and Apple TV targets created in their XCode projects, and will have the Android manifest correctly configured for both Android phone and Android TV.  New projects are set up to use the Expo CLI; the Expo dependency and `react-native.config.js` are included in the new app template.

```sh
# Init an app called 'TestApp', note that you must not be in a node module (directory with node_modules sub-directory) for this to work
yarn create react-native-app TestApp --template https://github.com/react-native-tvos/react-native-template-typescript-tv/tree/tv-release-0.73.0 --template-path template
cd TestApp
# Now build and start the app in the tvOS Simulator - this will only work on a macOS machine.
# This command can also be run via "yarn tvos".
npx expo run:ios --scheme MyApp-tvOS --device "Apple TV"
# You can also build and start the app on an iOS phone simulator.
# This command can also be run via "yarn ios".
npx expo run:ios
# or specify a simulator:
npx expo run:ios --scheme MyApp --device "iPhone 15"
# This command builds and starts the app in an Android TV emulator or a phone emulator (needs to be created in advance).
# This command can also be run via "yarn android".
npx expo run:android --device tv_api_31
```

See [this document](https://docs.expo.dev/bare/using-expo-cli/) for more details on Expo CLI functionality. (Note that many of these features require that Expo SDK modules be built into your app. Expo SDK support requires a different project configuration as described below.)

## _(New)_ Using the Expo SDK with TV apps

Starting with the Expo SDK 50 preview, and react-native-tvos 0.73.x, it will be possible to create Expo apps, and build them for TV via a new config plugin.

This functionality will be new in Expo SDK 50, and will be considered an experimental feature for now.

The fastest way to generate a new project is described in the [TV Example](https://github.com/expo/examples/tree/master/with-tv) in the Expo examples repo.

Besides most of the core Expo modules, these also work on TV:

- expo-av
- expo-image
- expo-localization
- expo-updates

TV does NOT support dev client (dev menu, dev launcher) at this time.
TV does NOT support Expo Router at this time.

## Code changes

- _JavaScript layer_: Support for TV has been added to the `Platform` React Native API.

```javascript
var Platform = require('Platform');
var running_on_tv = Platform.isTV;

// If you want to be more specific and only detect devices running tvOS
// (but no Android TV devices) you can use:
var running_on_apple_tv = Platform.isTVOS;
```



- _Common codebase for iOS and tvOS_: Since tvOS and iOS share most Objective-C and JavaScript code in common, most documentation for iOS applies equally to tvOS. Apple TV specific changes in native code are all wrapped by the TARGET_OS_TV define. These include changes to suppress APIs that are not supported on tvOS (e.g. web views, sliders, switches, status bar, etc.), and changes to support user input from the TV remote or keyboard.

- _Common codebase for Android phone and Android TV_: Apps built for Android using this repo will run on both Android phone and Android TV. Most of the changes for TV are specific to handling focus-based navigation on a TV using the D-Pad on the remote control.

- _Access to touchable controls_:  The `Touchable` mixin has code added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `TouchableWithoutFeedback`, `TouchableHighlight` and `TouchableOpacity` will "just work" on both Apple TV and Android TV. In particular:

  - `onFocus` will be executed when the touchable view goes into focus
  - `onBlur` will be executed when the touchable view goes out of focus
  - `onPress` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote.

- _Pressable controls_: The `Pressable` API works with TV.  Additional `onFocus` and `onBlur` props are provided to allow you to customize behavior when a Pressable enters or leaves focus. Similar to the `pressed` state that is true while a user is pressing the component on a touchscreen, the `focused` state will be true when it is focused on TV.  `PressableExample` in RNTester has been modified appropriately.

- _TV remote/keyboard input_: Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events.  For a more convenient API, we provide `useTVEventHandler`.

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

- _Flipper_: We do not support Flipper.

- _LogBox_: The new LogBox error/warning display (which replaced YellowBox in 0.63) is working as expected on TV platforms, after a few adjustments to make the controls accessible to the focus engine.

- _Dev Menu support_: On the Apple TV simulator, cmd-D will bring up the developer menu, just like on iOS. To bring it up on a real Apple TV device, make a long press on the play/pause button on the remote. (Please do not shake the Apple TV device, that will not work :) ). Android TV dev menu behavior is the same as on Android phone.

- _TV remote animations on Apple TV_: `RCTTVView` native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views. The animations can be disabled or adjusted with new optional view properties.

- _Back navigation with the TV remote menu button_: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button or '<' button on the Apple TV remote, and the back button as usual on Android TV remote.

- _TVEventControl for AppleTV_: (Formerly "TVMenuControl") This module provides methods to enable and disable features on the Apple TV Siri remote:
  - `enableTVMenuKey`/`disableTVMenuKey`:  Method to enable and disable the menu key gesture recognizer, in order to fix an issue with Apple's guidelines for menu key navigation (see https://github.com/facebook/react-native/issues/18930).  The `RNTester` app uses these methods to implement correct menu key behavior for back navigation.
  - `enableTVPanGesture`/`disableTVPanGesture`: Methods to enable and disable detection of finger touches that pan across the touch surface of the Siri remote. See `TVEventHandlerExample` in the `RNTester` app for a demo.
  - `enableGestureHandlersCancelTouches`/`disableGestureHandlersCancelTouches`: Methods to turn on and turn off cancellation of touches by the gesture handlers in `RCTTVRemoteHandler` (see #366). Cancellation of touches is turned on (enabled) by default in 0.69 and earlier releases.

- _TVFocusGuideView_: This component provides support for Apple's `UIFocusGuide` API and is implemented in the same way for Android TV, to help ensure that focusable controls can be navigated to, even if they are not directly in line with other controls.  An example is provided in `RNTester` that shows two different ways of using this component.

| Prop | Value | Description | 
|---|---|---|
| destinations | any[]? | Array of `Component`s to register as destinations of the FocusGuideView |
| autoFocus | boolean? | If true, `TVFocusGuide` will automatically manage focus for you. It will redirect the focus to the first focusable child on the first visit. It also remembers the last focused child and redirects the focus to it on the subsequent visits. `destinations` prop takes precedence over this prop when used together. |
| trapFocus* (Up, Down, Left, Right) | Prevents focus escaping from the container for the given directions. |

More information on the focus handling improvements above can be found in [this article](https://medium.com/xite-engineering/revolutionizing-focus-management-in-tv-applications-with-react-native-10ba69bd90).

- _Next Focus Direction_: the props `nextFocus*` on `View` should work as expected on iOS too (previously android only). One caveat is that if there is no focusable in the `nextFocusable*` direction next to the starting view, iOS doesn't check if we want to override the destination. 

- _TVTextScrollView_: On Apple TV, a ScrollView will not scroll unless there are focusable items inside it or above/below it.  This component wraps ScrollView and uses tvOS-specific native code to allow scrolling using swipe gestures from the remote control.
hey there my name is pratiksha
