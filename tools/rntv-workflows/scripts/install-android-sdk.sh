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

REACT_NATIVE_DIR="$(dirname "$0")/../../../packages/react-native"
VERSIONS_TOML="$REACT_NATIVE_DIR/gradle/libs.versions.toml"
REACT_ANDROID_GRADLE="$REACT_NATIVE_DIR/ReactAndroid/build.gradle.kts"

read_version() {
  local file="$1"
  local key="$2"
  local pattern="$3"
  local value
  value="$(sed -n -E "s/$pattern/\\1/p" "$file" | head -n 1)"
  if [[ -z "$value" ]]; then
    echo "Could not read $key from $file" >&2
    exit 1
  fi
  echo "$value"
}

read_toml_version() {
  read_version "$VERSIONS_TOML" "$1" "^$1[[:space:]]*=[[:space:]]*\"([^\"]+)\".*"
}

# Gradle honors the same overrides
NDK_VERSION="${ANDROID_NDK_VERSION:-$(read_toml_version ndkVersion)}"
COMPILE_SDK="$(read_toml_version compileSdk)"
# AGP names platforms from API 37 on with a minor version, e.g. android-37.0
if [[ "$COMPILE_SDK" == *.* || "$COMPILE_SDK" -lt 37 ]]; then
  ANDROID_PLATFORM="android-$COMPILE_SDK"
else
  ANDROID_PLATFORM="android-$COMPILE_SDK.0"
fi
BUILD_TOOLS_VERSION="$(read_toml_version buildTools)"
CMAKE_VERSION="${CMAKE_VERSION:-$(read_version "$REACT_ANDROID_GRADLE" cmakeVersion \
  '^val cmakeVersion = .*\?: "([^"]+)".*')}"

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
echo "Installing platform $ANDROID_PLATFORM..."
sdkmanager --install "platforms;$ANDROID_PLATFORM"
echo "Installing NDK $NDK_VERSION..."
sdkmanager --install "ndk;$NDK_VERSION"
echo "Installing CMake $CMAKE_VERSION..."
sdkmanager --install "cmake;$CMAKE_VERSION"
echo "Installing build tools $BUILD_TOOLS_VERSION..."
sdkmanager --install "build-tools;$BUILD_TOOLS_VERSION"

echo "Done."
