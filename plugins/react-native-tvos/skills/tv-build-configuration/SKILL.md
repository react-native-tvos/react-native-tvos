---
name: tv-build-configuration
description: Use when configuring build settings for React Native TV apps, including New Architecture (Fabric) setup, Hermes JS engine, Apple TV Podfile configuration, Android TV Maven artifacts, or the precompiled iOS/tvOS framework.
version: 1.0.0
license: MIT
---

# TV Build Configuration

## When to Use

- Configuring the New Architecture (Fabric) for TV
- Understanding Hermes JS engine support on TV
- Setting up Podfiles for Apple TV builds
- Configuring Android TV Maven dependencies
- Using the precompiled React Native framework for iOS/tvOS

## When NOT to Use

- Creating a new project from scratch — use the `tv-project-setup` skill instead

## Hermes JS Engine

Hermes is fully working on both Apple TV and Android TV and is **enabled by default**.

## New Architecture (Fabric)

React Native TV fully implements the New Architecture identically to the core repo. See [The New Architecture Is Here](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here).

### Opting Out of New Architecture

If needed, you can disable the New Architecture:

**Expo apps:**
See [Expo's documentation](https://docs.expo.dev/guides/new-architecture/#disable-the-new-architecture-in-an-existing-project).

**Apple TV:**

```sh
RCT_NEW_ARCH_ENABLED=0 bundle exec pod install
```

**Android TV:**

Edit `android/gradle.properties`:

```diff
-newArchEnabled=true
+newArchEnabled=false
```

Then do a clean rebuild.

## Apple TV Podfile Configuration

React Native podspecs (0.73+) require that your application `Podfile` only have **one target**. This repo supports either an iOS target or a tvOS target, not both simultaneously.

The RNTester app's `Podfile` and `RNTesterPods.xcodeproj` have been modified to work for tvOS and serve as reference examples.

## Android TV Maven Artifacts

In 0.71+ releases, React Native Android prebuilt archives are published to Maven. For this repo:

- Maven group: `io.github.react-native-tvos` (instead of `com.facebook.react`)
- The `@react-native/gradle-plugin` module detects Android dependencies correctly during build

## Precompiled iOS/tvOS Framework

Starting with 0.81.0-0, a precompiled framework for the React Native core library is available for iOS and tvOS:

- Built using [Swift Package Manager](https://www.swift.org/package-manager/)
- Available for both debug and release builds
- Available for both iOS and tvOS
- Published as a Maven artifact in the `io.github.react-native-tvos` group

### Dependencies

Builds using the precompiled framework also require:
- **ReactNativeDependencies framework** — built automatically for iOS and tvOS, included in releases
- **Hermes engine framework** — built automatically for iOS and tvOS, included in releases

Both are included in React Native core releases and are not separately distributed.

## Accessibility

An additional `accessibilityFocus` [accessibility action](https://reactnative.dev/docs/accessibility#accessibility-actions) is available on Android for detecting focus changes on every accessible element (like `Text`) when TalkBack is enabled.

## LogBox

The LogBox error/warning display works on TV platforms, with adjustments to make controls accessible to the focus engine.
