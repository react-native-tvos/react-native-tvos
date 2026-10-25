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
JAVA_HOME="$("$(dirname "$0")/openjdk17-home.sh")"
export JAVA_HOME
echo "JAVA_HOME=$JAVA_HOME"
echo "Installing Android command line tools..."
brew install --cask android-commandlinetools
echo "Unpacking Android licenses..."
tar zxf "$ANDROID_SDK_LICENSES" -C "$ANDROID_SDK_ROOT"
echo "Run Android license tool..."
sdkmanager --licenses
echo "Installing platform tools..."
sdkmanager --install platform-tools
echo "Installing Android 37.0..."
sdkmanager --install "platforms;android-37.0"
echo "Installing NDK 28.2.13676358..."
sdkmanager --install "ndk;28.2.13676358"
echo "Installing CMake 3.30.5..."
sdkmanager --install "cmake;3.30.5"
echo "Installing build tools 37.0.0..."
sdkmanager --install "build-tools;37.0.0"

echo "Done."
