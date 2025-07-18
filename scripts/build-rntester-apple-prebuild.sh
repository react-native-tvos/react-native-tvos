#!/usr/bin/env bash

# Build the RNCore framework locally

######### Setup #########

# Set the location for the RNCore framework tarball
export REACT_NATIVE_ROOT_DIR=$PWD
echo "REACT_NATIVE_ROOT_DIR: $REACT_NATIVE_ROOT_DIR"

export RCT_TESTONLY_RNCORE_TARBALL_PATH=$REACT_NATIVE_ROOT_DIR/packages/rn-tester/react-native-core-framework.tar.gz
echo "RCT_TESTONLY_RNCORE_TARBALL_PATH: $RCT_TESTONLY_RNCORE_TARBALL_PATH"

# Get the version of the latest nightly build
. ./tools/rntv-workflows/override-nightly-build-version.sh
echo "REACT_NATIVE_OVERRIDE_NIGHTLY_BUILD_VERSION: $REACT_NATIVE_OVERRIDE_NIGHTLY_BUILD_VERSION"

######### Build the RNCore framework ############

cd $REACT_NATIVE_ROOT_DIR/packages/react-native

echo "Execute RNCore prebuild setup..."
node scripts/ios-prebuild -s -f Debug

echo "Execute RNCore prebuild Debug build for required platforms..."

# For RNTester for tvOS, we only need the tvos-simulator build, but you can uncomment
# the other lines if you want to try building an iOS app, e.g.

#node scripts/ios-prebuild.js -b -f Debug -p ios
#node scripts/ios-prebuild.js -b -f Debug -p ios-simulator
#node scripts/ios-prebuild.js -b -f Debug -p tvos
node scripts/ios-prebuild.js -b -f Debug -p tvos-simulator
#node scripts/ios-prebuild.js -b -f Debug -p mac-catalyst

echo "Execute RNCore prebuild framework compose..."
node scripts/ios-prebuild.js -c -f Debug

echo "Package RNCore prebuild tarball..."

cd $REACT_NATIVE_ROOT_DIR/packages/react-native/.build/output/xcframeworks/Debug
tar zcf $RCT_TESTONLY_RNCORE_TARBALL_PATH React.xcframework

######### Build the RNTester app using RNCore framework from above

cd $REACT_NATIVE_ROOT_DIR/packages/rn-tester
echo "Set the env variable to use prebuilt RNCore for this step..."
export RCT_USE_PREBUILT_RNCORE=1
echo "Building RNTester..."
echo "Cleaning build directories..."
yarn clean-ios
echo "Setting up RNTester..."
yarn setup-ios-hermes
echo "Building RNTester..."
yarn build-ios-hermes
echo "Build completed."

