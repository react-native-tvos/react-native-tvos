#!/usr/bin/env bash

# This script is used to install the custom functions for the EAS build profiles
# It is run as part of the post-install step of yarn

# Fail if anything errors
set -eox pipefail

(cd .eas/build/importCodesignCerts && yarn && yarn build)
