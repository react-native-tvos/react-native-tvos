## react-native-tvos

Apple TV and Android TV support for React Native are maintained here and in the corresponding `react-native-tvos` NPM package, and not in the [core repo](https://github.com/facebook/react-native/).  This is a full fork of the main repository, with only the changes needed to support Apple TV and Android TV.

Releases of `react-native-tvos` will be based on a public release of `react-native`; e.g. the 0.81.0-0 release of this package will be derived from the 0.81.0 release of `react-native`. All releases of this repo will follow the 0.xx.x-y format, where x digits are from a specific RN core release, and y represents the additional versioning from this repo.

Releases will be published on npmjs.org and you may find the latest release version here: https://www.npmjs.com/package/react-native-tvos?activeTab=versions or use the tag `@latest`

You will find the relevant tvOS support and maintenance within the branches marked `tvos-v0.xx.x`;   

To build your project for Apple TV, you should change your `package.json` imports to import `react-native` as follows, so that this package is used instead of the core react-native package.

```js
"react-native": "npm:react-native-tvos@latest",
```

You cannot use this package and the core react-native package simultaneously in a project.

This README covers only TV-specific features. For more general documentation and for changes between versions, you should also see these resources:

- React Native documentation: https://reactnative.dev
- The React Native changelog: https://github.com/facebook/react-native/blob/main/CHANGELOG.md

### Hermes JS support

- Hermes is fully working on both Apple TV and Android TV, and is enabled by default.

### React Native new architecture (Fabric) support

React Native TV fully implements the new architecture, identically to the core repo. You can read more about it in this blog post from the RN core team: [The New Architecture Is Here](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here)

If, for any reason, the New Architecture is not behaving properly in your application, there is always the option to opt-out from it until you are ready to turn it on again.

To opt-out from the New Architecture:

- _Expo apps_: See [Expo's documentation](https://docs.expo.dev/guides/new-architecture/#disable-the-new-architecture-in-an-existing-project).

- _Apple TV_: You can reinstall the dependencies by running the command:

```sh
RCT_NEW_ARCH_ENABLED=0 bundle exec pod install
```

- _Android TV_: On Android, modify the android/gradle.properties file and turn off the newArchEnabled flag, then do a clean rebuild:

```diff
-newArchEnabled=true
+newArchEnabled=false
```

### Typescript

Typescript types for TV-specific components and APIs have been added to `types/public`. This repo is also generating types for the new API [currently in development by the core team](https://reactnative.dev/blog/2025/06/12/moving-towards-a-stable-javascript-api).

## React Native core library precompiled framework for iOS and tvOS

Starting with the 0.81.0-0 release, this repo provides a precompiled framework for the React Native core library for iOS and tvOS.  This framework is built using the [Swift Package Manager](https://www.swift.org/package-manager/) and is available for both debug and release builds.  The framework is available for both iOS and tvOS, and is provided as a Maven artifact in the `io.github.react-native-tvos` group, similarly to the Android artifacts from this repo.

Builds using the above framework also require the precompiled ReactNativeDependencies framework, and the Hermes engine framework. Both of these are built automatically for both iOS and tvOS and are included in the React Native core releases, and are not separately distributed.


## General support for TV

TV device support has been implemented with the intention of making existing React Native applications "just work" on TV, with few or no changes needed in the JavaScript code for the applications.

The RNTester app supports iOS, Apple TV, Android, and Android TV.  In this repo, `RNTester/Podfile` and `RNTester/RNTesterPods.xcodeproj` have been modified to work for tvOS.

Minimum operating system versions:

- iPhone and iPad:
  - iOS 15.1
- Apple TV:
  - tvOS 15.1
- Android and Android TV:
  - API level 22 (only for the 0.77 releases)
  - API level 24 (for all later releases)

## Build changes

- _Native layer for Apple TV_: Changes in the React Native podspecs (in 0.73 and later) require that your application `Podfile` only have one target. This repo supports either an iOS target or a tvOS target.
- _Maven artifacts for Android TV_: In 0.71 and later releases, the React Native Android prebuilt archives are published to Maven instead of being included in the NPM. We are following the same model, except that the Maven artifacts will be in group `io.github.react-native-tvos` instead of `com.facebook.react`. The `@react-native/gradle-plugin` module has been upgraded so that the Android dependencies will be detected correctly during build.

## TV project creation in React Native 0.75 and later

> _Warning:_ Make sure you do not globally install `react-native` or `react-native-tvos`. If you have done this the wrong way, you may get error messages like `ld: library not found for -lPods-TestApp-tvOS`.

We strongly recommend [Yarn](https://classic.yarnpkg.com/en/docs/install) as the package manager.

### Using the Expo SDK with TV apps

As of React Native version 0.75.x, the core team [recommends Expo for new projects](https://reactnative.dev/docs/environment-setup).

See the [Building Expo apps for TV](https://docs.expo.dev/guides/building-for-tv/) guide from Expo for details on how to set up a new Expo project, including supported Expo modules and limitations.

Using Expo's [continuous native generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/) model, projects created this way can be used to build either mobile or TV apps, taking advantage of the full support for both mobile and TV platforms in this repo.

### Creating a new project with the Community CLI

We maintain [template-tv](https://github.com/react-native-tvos/template-tv), a TV-specific template for developers using the React Native Community CLI.

> [!NOTE]
> This template only supports Apple TV and Android TV. Multiple platform targets are no longer supported in React Native app Podfiles.

**Quick start:**
```sh
# Initialize a new app called 'TVTest'
# This command should be run outside of any existing node project
npx @react-native-community/cli@latest init TVTest --template @react-native-tvos/template-tv

cd TVTest

# Build and run on tvOS Simulator (macOS only, requires Apple TV simulator)
npx react-native run-ios --simulator "Apple TV"

# Build and run on Android TV emulator (requires Android TV emulator)
npx react-native run-android --device tv_api_31
```

## How to support TV specific file extensions

The template contains an [example Metro configuration](https://github.com/react-native-tvos/react-native-template-typescript-tv/blob/main/template/metro.config.js) that allows Metro to resolve application source files with TV-specific code, indicated by specific file extensions (e.g. `*.ios.tv.tsx`, `*.android.tv.tsx`, `*.tv.tsx`). The config will work the same way with the other standard source file extensions (`.js`, etc.), as documented in [Metro docs](https://metrobundler.dev/docs/configuration/#sourceexts)

When this is enabled, Metro will resolve files in the following order of preference (and similarly for the other supported file extensions):

- `file.ios.tv.tsx` or `file.android.tv.tsx`
- `file.tv.tsx`
- `file.ios.tsx` or `file.android.tsx`
- `file.tsx`

This config is not enabled by default, since it will impact bundling performance, but is available for developers who need this capability.

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

- _Pressable and Touchable controls_:  TV controls are supported with fully native events.
Code has been added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `Pressable`, `TouchableHighlight` and `TouchableOpacity` will "just work" on both Apple TV and Android TV. In particular:

  - `onFocus()` will be executed when the touchable view goes into focus
  - `onBlur()` will be executed when the touchable view goes out of focus
  - `onPress()` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote (center button on Apple TV remote, or center button on Android TV DPad).
  - `onPressIn()` will be executed when the TV remote "select" button is pressed down (center button on Apple TV remote, or center button on Android TV DPad)
  - `onPressOut()` will be executed when the TV remote "select" button is released
  - `onLongPress()` will be executed if the "select" button is held down for a length of time (this event is generated in the `Pressability` module, the same as for touchscreen long press events).

  `TouchableNativeFeedback` and `TouchableWithoutFeedback` respond to press events, but do not respond to focus and blur events, and are not recommended for TV.

Because focus and blur events are now fully native core events, they will respond correctly to capturing and bubbling event handlers in `View` components. A demo of this has been added to the TVEventHandlerExample in RNTester.

- _Tailwind styles for Pressable and Touchable controls_: The above events allow RNTV to support the [`focus:` and `active:` pseudo classes for Tailwind styles](https://www.nativewind.dev/core-concepts/states#hover-focus-and-active-).

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
  _tvEventHandlerSubscription: EventSubscription || undefined;

  _enableTVEventHandler() {
    this._tvEventHandlerSubscription = TVEventHandler.addListener(function(evt) {
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
```

- _LogBox_: The LogBox error/warning display (which replaced YellowBox in 0.63) is working as expected on TV platforms, after a few adjustments to make the controls accessible to the focus engine.

- _Dev Menu support_:
  - The developer menu provided by React Native itself works on TV. On the Apple TV simulator, cmd-D will bring up the developer menu, just like on iOS. To bring it up on a real Apple TV device, make a long press on the play/pause button on the remote. (Please do not shake the Apple TV device, that will not work :) ). Android TV dev menu behavior is the same as on Android phone.
  - As of Expo SDK 54 and RNTV 0.81, the Expo dev menu (provided by the [Expo dev client package](https://docs.expo.dev/versions/latest/sdk/dev-client/)) is supported on TV. On Apple TV, features requiring login to an Expo EAS account are not yet available.

- _TV remote animations on Apple TV_: Native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views. The animations can be disabled or adjusted with new optional view properties.

- _Back navigation with the TV remote menu button_: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button or '<' button on the Apple TV remote, and the back button as usual on Android TV remote.

- _TVEventControl for AppleTV_: (Formerly "TVMenuControl") This module provides methods to enable and disable features on the Apple TV Siri remote:
  - `enableTVMenuKey`/`disableTVMenuKey`:  Method to enable and disable the menu key gesture recognizer, in order to fix an issue with Apple's guidelines for menu key navigation (see https://github.com/facebook/react-native/issues/18930).  The `RNTester` app uses these methods to implement correct menu key behavior for back navigation.
  - `enableTVPanGesture`/`disableTVPanGesture`: Methods to enable and disable detection of finger touches that pan across the touch surface of the Siri remote. See `TVEventHandlerExample` in the `RNTester` app for a demo.
  - `enableGestureHandlersCancelTouches`/`disableGestureHandlersCancelTouches`: Methods to turn on and turn off cancellation of touches by the gesture handlers in `RCTTVRemoteHandler` (see #366). Cancellation of touches is turned on (enabled) by default in 0.69 and earlier releases.

- _Accessibility_: We have an additional `accessibilityFocus` [accessibility action](https://reactnative.dev/docs/accessibility#accessibility-actions) on Android that you can use for detecting focus changes on every *accessible* element (like a regular `Text`) when `TalkBack` is enabled.

- _TVFocusGuideView_: This component provides support for Apple's `UIFocusGuide` API and is implemented in the same way for Android TV, to help ensure that focusable controls can be navigated to, even if they are not directly in line with other controls.  An example is provided in `RNTester` that shows two different ways of using this component.

  | Prop | Value | Description | 
  |---|---|---|
  | destinations | any[]? | Array of `Component`s to register as destinations of the FocusGuideView |
  | autoFocus | boolean? | If true, `TVFocusGuide` will automatically manage focus for you. It will redirect the focus to the first focusable child on the first visit. It also remembers the last focused child and redirects the focus to it on the subsequent visits. `destinations` prop takes precedence over this prop when used together. |
  | focusable | boolean? | When set to false, this view and all its subviews will be NOT focusable. |
  | trapFocus* (Up, Down, Left, Right) | Prevents focus escaping from the container for the given directions. |
  
  More information on the focus handling improvements above can be found in [this article](https://medium.com/xite-engineering/revolutionizing-focus-management-in-tv-applications-with-react-native-10ba69bd90).
  
  - _Next Focus Direction_: the props `nextFocus*` on `View` should work as expected on iOS too (previously android only). One caveat is that if there is no focusable in the `nextFocusable*` direction next to the starting view, iOS doesn't check if we want to override the destination. 
  
  - _TVTextScrollView_: On Apple TV, a ScrollView will not scroll unless there are focusable items inside it or above/below it.  This component works on both Apple TV and Android TV, using native code to allow scrolling using swipe gestures from the remote control.

  - _VirtualizedList_: We extend `VirtualizedList` to make virtualization work well with focus management in mind. All of the improvements that we made are automatically available to all the VirtualizedList based components such as `FlatList`.
    - Defaults: VirtualizeList contents are automatically wrapped with a `TVFocusGuideView` with `trapFocus*` properties enabled depending on the orientation of the list. This default makes sure that focus doesn't leave the list accidentally due to a virtualization issue etc. until reaching the beginning or the end of the list.
    - New Props:

  | Prop | Value | Description | 
  |---|---|---|
  | additionalRenderRegions | {first: number; last: number;}[]? | Array of `RenderRegions` that allows you to define regions in the list that are not subject to virtualization, ensuring they are always rendered. This is particularly useful for preventing blank areas in critical parts of the list. These regions are rendered lazily after the initial render and are specified as an array of objects, each with `first` and `last` indices marking the beginning and end of the non-virtualized region based on index. See the [feature proposal](https://github.com/react-native-tvos/react-native-tvos/discussions/663) for more context. |
