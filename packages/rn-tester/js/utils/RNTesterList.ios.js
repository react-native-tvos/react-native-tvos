/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RNTesterModule, RNTesterModuleInfo} from '../types/RNTesterTypes';

import * as RNTesterListFbInternal from './RNTesterListFbInternal';

const Components: Array<RNTesterModuleInfo> = [
  {
    key: 'ActivityIndicatorExample',
    category: 'UI',
    module: require('../examples/ActivityIndicator/ActivityIndicatorExample'),
  },
  {
    key: 'ButtonExample',
    module: require('../examples/Button/ButtonExample'),
    category: 'UI',
  },
  {
    key: 'FlatListExampleIndex',
    module: require('../examples/FlatList/FlatListExampleIndex').default,
    category: 'ListView',
  },
  {
    key: 'ImageExample',
    module: require('../examples/Image/ImageExample'),
    category: 'Basic',
  },
  {
    key: 'JSResponderHandlerExample',
    module: require('../examples/JSResponderHandlerExample/JSResponderHandlerExample'),
  },
  {
    key: 'InputAccessoryViewExample',
    module: require('../examples/InputAccessoryView/InputAccessoryViewExample'),
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('../examples/KeyboardAvoidingView/KeyboardAvoidingViewExample'),
  },
  {
    key: 'LayoutConformanceExample',
    module: require('../examples/LayoutConformance/LayoutConformanceExample')
      .default,
  },
  {
    key: 'LayoutEventsExample',
    module: require('../examples/Layout/LayoutEventsExample'),
  },
  {
    key: 'ModalExample',
    module: require('../examples/Modal/ModalExample'),
  },
  {
    key: 'NewAppScreenExample',
    module: require('../examples/NewAppScreen/NewAppScreenExample'),
  },
  {
    key: 'PressableExample',
    module: require('../examples/Pressable/PressableExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('../examples/RefreshControl/RefreshControlExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('../examples/ScrollView/ScrollViewSimpleExample'),
    category: 'Basic',
  },
  {
    key: 'SafeAreaViewExample',
    module: require('../examples/SafeAreaView/SafeAreaViewExample'),
  },
  {
    key: 'ScrollViewExample',
    module: require('../examples/ScrollView/ScrollViewExample'),
    category: 'Basic',
  },
  {
    key: 'ScrollViewAnimatedExample',
    module: require('../examples/ScrollView/ScrollViewAnimatedExample'),
  },
  {
    key: 'ScrollViewIndicatorInsetsExample',
    module: require('../examples/ScrollView/ScrollViewIndicatorInsetsIOSExample'),
    supportsTVOS: true,
  },
  {
    key: 'SectionListIndex',
    module: require('../examples/SectionList/SectionListIndex'),
    supportsTVOS: true,
  },
  {
    key: 'StatusBarExample',
    module: require('../examples/StatusBar/StatusBarExample'),
  },
  {
    key: 'SwipeableCardExample',
    module: require('../examples/SwipeableCardExample/SwipeableCardExample'),
    category: 'UI',
  },
  {
    key: 'SwitchExample',
    module: require('../examples/Switch/SwitchExample'),
    category: 'UI',
  },
  {
    key: 'TextExample',
    module: require('../examples/Text/TextExample.ios'),
    category: 'Basic',
  },
  {
    key: 'TextInputExample',
    module: require('../examples/TextInput/TextInputExample'),
    category: 'Basic',
  },
  {
    key: 'TouchableExample',
    module: require('../examples/Touchable/TouchableExample'),
  },
  {
    key: 'TransparentHitTestExample',
    module: require('../examples/TransparentHitTest/TransparentHitTestExample'),
  },
  {
    key: 'TVTextScrollViewExample',
    category: 'TV',
    module: require('../examples/TVTextScrollView/TVTextScrollViewExample'),
  },
  {
    key: 'ViewExample',
    module: require('../examples/View/ViewExample').default,
    category: 'Basic',
  },
  {
    key: 'NewArchitectureExample',
    category: 'UI',
    module: require('../examples/NewArchitecture/NewArchitectureExample'),
  },
  {
    key: 'FabricInteropLayer',
    category: 'UI',
    module: require('../examples/FabricInteropLayer/FabricInteropLayer'),
  },
  {
    key: 'PerformanceComparisonExample',
    category: 'Basic',
    module: require('../examples/Performance/PerformanceComparisonExample'),
  },
  ...RNTesterListFbInternal.Components,
];

const APIs: Array<RNTesterModuleInfo> = ([
  {
    key: 'TVEventHandlerExample',
    category: 'TV',
    module: require('../examples/TVEventHandler/TVEventHandlerExample'),
    supportsTVOS: true,
  },
  {
    key: 'TVDirectionalNextFocusExample',
    category: 'TV',
    module: require('../examples/DirectionalNextFocus/DirectionalNextFocusExample'),
    supportsTVOS: true,
  },
  {
    key: 'TVDynamicDirectionalNextFocusExample',
    category: 'TV',
    module: require('../examples/DirectionalNextFocus/DynamicDirectionalNextFocusExample'),
    supportsTVOS: true,
  },
  {
    key: 'TVFocusGuideExample',
    category: 'TV',
    module: require('../examples/TVFocusGuide/TVFocusGuideExample'),
    supportsTVOS: true,
  },
  {
    key: 'TVFocusGuideAutoFocusExample',
    category: 'TV',
    module: require('../examples/TVFocusGuide/TVFocusGuideAutoFocusExample'),
    supportsTVOS: true,
  },
  {
    key: 'AccessibilityExample',
    module: require('../examples/Accessibility/AccessibilityExample'),
  },
  {
    key: 'AccessibilityIOSExample',
    module: require('../examples/Accessibility/AccessibilityIOSExample'),
    category: 'iOS',
  },
  {
    key: 'ActionSheetIOSExample',
    module: require('../examples/ActionSheetIOS/ActionSheetIOSExample'),
    category: 'iOS',
  },
  {
    key: 'AlertExample',
    module: require('../examples/Alert/AlertExample').default,
    category: 'UI',
  },
  {
    key: 'AnimatedIndex',
    module: require('../examples/Animated/AnimatedIndex').default,
  },
  {
    key: 'AnExApp',
    module: require('../examples/AnimatedGratuitousApp/AnExApp'),
  },
  {
    key: 'AppearanceExample',
    module: require('../examples/Appearance/AppearanceExample'),
  },
  {
    key: 'AppStateExample',
    module: require('../examples/AppState/AppStateExample'),
  },
  {
    key: 'URLExample',
    category: 'Basic',
    module: require('../examples/Urls/UrlExample'),
  },
  {
    key: 'BorderExample',
    module: require('../examples/Border/BorderExample').default,
  },
  {
    key: 'BoxShadowExample',
    module: require('../examples/BoxShadow/BoxShadowExample'),
  },
  {
    key: 'CrashExample',
    module: require('../examples/Crash/CrashExample'),
  },
  {
    key: 'CursorExample',
    module: require('../examples/Cursor/CursorExample'),
  },
  {
    key: 'DevSettings',
    module: require('../examples/DevSettings/DevSettingsExample'),
  },
  {
    key: 'Dimensions',
    module: require('../examples/Dimensions/DimensionsExample'),
  },
  {
    key: 'DisplayContentsExample',
    category: 'UI',
    module: require('../examples/DisplayContents/DisplayContentsExample')
      .default,
  },
  {
    key: 'InvalidPropsExample',
    module: require('../examples/InvalidProps/InvalidPropsExample'),
  },
  {
    key: 'Keyboard',
    module: require('../examples/Keyboard/KeyboardExample').default,
  },
  {
    key: 'LayoutAnimationExample',
    module: require('../examples/Layout/LayoutAnimationExample'),
  },
  {
    key: 'LayoutExample',
    module: require('../examples/Layout/LayoutExample'),
  },
  {
    key: 'LinkingExample',
    module: require('../examples/Linking/LinkingExample'),
  },
  {
    key: 'NativeAnimationsExample',
    module: require('../examples/NativeAnimation/NativeAnimationsExample'),
  },
  {
    key: 'OrientationChangeExample',
    module: require('../examples/OrientationChange/OrientationChangeExample'),
  },
  {
    key: 'PanResponderExample',
    module: require('../examples/PanResponder/PanResponderExample'),
  },
  {
    key: 'PlatformColorExample',
    module: require('../examples/PlatformColor/PlatformColorExample'),
  },
  {
    key: 'PixelRatio',
    module: require('../examples/PixelRatio/PixelRatioExample'),
  },
  {
    key: 'PointerEventsExample',
    module: require('../examples/PointerEvents/PointerEventsExample'),
  },
  {
    key: 'RCTRootViewIOSExample',
    module: require('../examples/RCTRootView/RCTRootViewIOSExample'),
  },
  {
    key: 'RTLExample',
    module: require('../examples/RTL/RTLExample'),
  },
  {
    key: 'ShareExample',
    module: require('../examples/Share/ShareExample'),
  },
  {
    key: 'SnapshotExample',
    module: require('../examples/Snapshot/SnapshotExample'),
  },
  {
    key: 'TimerExample',
    module: require('../examples/Timer/TimerExample'),
  },
  {
    key: 'TransformExample',
    module: require('../examples/Transform/TransformExample'),
  },
  {
    key: 'FilterExample',
    module: require('../examples/Filter/FilterExample'),
  },
  {
    key: 'LinearGradientExample',
    category: 'UI',
    module: require('../examples/LinearGradient/LinearGradientExample'),
  },
  {
    key: 'RadialGradientExample',
    category: 'UI',
    module: require('../examples/RadialGradient/RadialGradientExample'),
  },
  {
    key: 'MixBlendModeExample',
    module: require('../examples/MixBlendMode/MixBlendModeExample'),
  },
  {
    key: 'TurboModuleExample',
    module: require('../examples/TurboModule/TurboModuleExample'),
  },
  {
    key: 'LegacyModuleExample',
    module: require('../examples/TurboModule/LegacyModuleExample'),
  },
  {
    key: 'TurboCxxModuleExample',
    module: require('../examples/TurboModule/TurboCxxModuleExample'),
  },
  {
    key: 'VibrationExample',
    module: require('../examples/Vibration/VibrationExample'),
  },
  {
    key: 'WebSocketExample',
    module: require('../examples/WebSocket/WebSocketExample'),
  },
  {
    key: 'XHRExample',
    module: require('../examples/XHR/XHRExample'),
  },
  ...RNTesterListFbInternal.APIs,
]: Array<?RNTesterModuleInfo>).filter(Boolean);

const Playgrounds: Array<RNTesterModuleInfo> = [
  {
    key: 'PlaygroundExample',
    module: require('../examples/Playground/PlaygroundExample'),
  },
];

const Modules: {[key: string]: RNTesterModule} = {};

[...APIs, ...Components, ...Playgrounds].forEach(Example => {
  Modules[Example.key] = Example.module;
});

const RNTesterList = {
  APIs,
  Components,
  Modules,
};

module.exports = RNTesterList;
