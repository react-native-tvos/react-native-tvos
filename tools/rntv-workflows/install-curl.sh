#!/bin/bash

# Fail if anything errors
set -eox pipefail

if [[ "$EAS_BUILD_RUNNER" != "eas-build" ]]; then
  echo "Skip curl installation on a local build."
  exit 0
fi

if [[ "$EAS_BUILD_PLATFORM" != "ios" ]]; then
  echo "Skip curl installation on Linux Android workers."
  exit 0
fi

echo "Installing curl..."
brew install curl 
echo "Set environment..."
. ./curl-env.sh
echo "Verify curl path and version..."
which curl
curl --version
