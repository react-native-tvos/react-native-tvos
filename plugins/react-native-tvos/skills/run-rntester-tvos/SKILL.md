---
name: run-rntester-tvos
description: Use when the user wants to build or run the RNTester app on an Apple TV simulator from source. Covers the full workflow: installing dependencies, downloading the Hermes tarball, pod install, xcodebuild, and launching the app.
version: 1.0.0
license: MIT
---

# Run RNTester for tvOS

Builds and runs the RNTester app on an Apple TV simulator from this repo's source.

## Prerequisites

- macOS with Xcode and Apple TV Simulator installed
- Ruby/Bundler: `gem install bundler`
- Node and Yarn installed
- Run from the **repo root** (`react-native-tvos/`)

## Steps

### 1. Install JS dependencies (repo root)

```sh
yarn install
```

### 2. Navigate to rn-tester

```sh
cd packages/rn-tester
```

### 3. Download the Hermes tarball

Check the expected Hermes version:

```sh
cat ../react-native/sdks/.hermesversion
```

Then download the matching tarball from Maven Central. The URL pattern is:

```
https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/<VERSION>/hermes-ios-<VERSION>-hermes-ios-debug.tar.gz
```

Example (replace `<VERSION>` with the version from `.hermesversion`):

```sh
curl -Lo /tmp/hermes-ios-debug.tar.gz \
  https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/<VERSION>/hermes-ios-<VERSION>-hermes-ios-debug.tar.gz
```

### 4. Run pod install (setup)

```sh
HERMES_ENGINE_TARBALL_PATH=/tmp/hermes-ios-debug.tar.gz yarn setup-tvos-hermes
```

This script:
- Patches the storyboard and Xcode project for tvOS
- Patches the Podfile target from `:ios` to `:tvos`
- Runs `bundle install` and `pod install` with Hermes and New Architecture enabled

### 5. Build the app

```sh
yarn build-tvos-hermes
```

Builds for `appletvsimulator` (arm64, Debug) using xcpretty output.

### 6. Run the app

Open the workspace in Xcode and run on an Apple TV Simulator:

```sh
open RNTesterPods.xcworkspace
```

Or launch the simulator manually and install the built `.app` from `build/`.

## Troubleshooting

**Version mismatch during pod install:** The Hermes tarball version must match what CocoaPods expects. Always read `../react-native/sdks/.hermesversion` first.

**Stale build artifacts:** If you previously built for iOS, run `yarn clean-ios` before setup.

**Pod install fails after a `yarn clean-ios`:** Re-run `yarn setup-tvos-hermes` with the tarball path set.
