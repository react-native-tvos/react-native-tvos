#!/bin/bash

# Fail if anything errors
set -eox pipefail

. override-nightly-build-version.sh
echo "Hermes build from nightly build: $REACT_NATIVE_OVERRIDE_NIGHTLY_BUILD_VERSION"
export PATH=$PATH:/opt/homebrew/bin
which ruby
cd ../../packages/rn-tester
echo "Install dependencies..."
yarn
echo "Cleaning build directories..."
yarn clean-ios
echo "Setting up RNTester..."
yarn setup-ios-hermes
echo "Building RNTester..."
yarn build-ios-hermes
echo "Build completed."

