#!/bin/bash

sed -i '' 's/\"react-native\"/\"react-native-tvos\"/;' ../react-native/sdks/hermes-engine/hermes-engine.podspec
sed -i '' 's/\"react-native\"/\"react-native-tvos\"/;' ../react-native/third-party-podspecs/ReactNativeDependencies.podspec
