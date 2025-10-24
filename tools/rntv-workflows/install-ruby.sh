#!/bin/bash

# Fail if anything errors
set -eox pipefail

if [[ "$EAS_BUILD_RUNNER" != "eas-build" ]]; then
  echo "Skip Ruby installation on a local build."
  exit 0
fi

if [[ "$EAS_BUILD_PLATFORM" != "ios" ]]; then
  echo "Skip Ruby installation on Linux Android workers."
  exit 0
fi

echo "Installing Ruby..."
brew install ruby
. ./ruby-env.sh
echo "Verify Ruby path and version..."
which ruby
ruby -v
echo "Verify Gem path and version..."
which gem
gem -v
echo "Verify bundler path and version..."
which bundler
bundler -v
echo "Configure Node..."
sudo ln -s $(which node) /usr/local/bin/node
echo "Done."
