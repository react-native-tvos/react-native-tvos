#!/bin/bash

# Fail if anything errors
set -eox pipefail

./tools/rntv-workflows/rename-virtualized-lists.sh
yarn
yarn --cwd packages/react-native featureflags-check
yarn lint
yarn --cwd packages/react-native-codegen build
yarn --cwd packages/react-native-codegen-typescript-test build
yarn test-typescript
npx jest packages/react-native -u
yarn build-types
