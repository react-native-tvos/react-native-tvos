#!/bin/bash

# Fail if anything errors
set -eox pipefail

# Print some environment variables
echo "JAVA_HOME: $JAVA_HOME"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
# Check that sdkmanager is in the path
which sdkmanager
# Set custom sdkmanager path for Android build
export ANDROID_CUSTOM_SDKMANAGER_PATH=`which sdkmanager`
# Change directory
cd ../../packages/rn-tester
echo "Cleaning build directories..."
yarn clean-android
echo "Building RNTester..."
yarn build-android-hermes
echo "Build completed."

