#!/bin/bash

# This script is needed when building RNTester for tvOS in release branches only.

if [[ "$RNTV_RELEASE_BUILD" == "1" ]]; then
  sed -i '' 's/\"react-native\"/\"react-native-tvos\"/;' ../react-native/sdks/hermes-engine/hermes-engine.podspec
  sed -i '' 's/\"react-native\"/\"react-native-tvos\"/;' ../react-native/third-party-podspecs/ReactNativeDependencies.podspec
fi