#!/bin/bash

# Fail if anything errors
set -eox pipefail

if [[ "$EAS_BUILD_RUNNER" != "eas-build" ]]; then
  echo "Skip Android SDK installation on a local build."
  exit 0
fi

if [[ "$EAS_BUILD_PLATFORM" != "ios" ]]; then
  echo "Skip Android installation on Linux Android workers."
  exit 0
fi

echo "Installing OpenJDK 17..."
brew install openjdk@17
echo "Installing Android command line tools..."
brew install --cask android-commandlinetools
echo "Unpacking Android licenses..."
tar zxf $ANDROID_SDK_LICENSES -C $ANDROID_SDK_ROOT
echo "Run Android license tool..."
sdkmanager --licenses
echo "Installing platform tools..."
sdkmanager --install platform-tools
echo "Installing Android 34..."
sdkmanager --install "platforms;android-34"
echo "Installing NDK 26.1.10909125..."
sdkmanager --install "ndk;26.1.10909125"
echo "Installing CMake 3.22.1..."
sdkmanager --install "cmake;3.22.1"
echo "Installing build tools 34.0.0..."
sdkmanager --install "build-tools;34.0.0"

echo "Done."
