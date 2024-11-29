#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

if [ "$CI" ]; then
  set -x
fi
set -e

# Given a specific target, retrieve the right architecture for it
# $1 the target you want to build. Allowed values: iphoneos, iphonesimulator, catalyst, xros, xrsimulator
function get_architecture {
    if [[ $1 == "iphoneos" || $1 == "xros" ]]; then
      echo "arm64"
    elif [[ $1 == "iphonesimulator" || $1 == "xrsimulator" ]]; then
      echo "x86_64;arm64"
    elif [[ $1 == "appletvos" ]]; then
      echo "arm64"
    elif [[ $1 == "appletvsimulator" ]]; then
      echo "x86_64;arm64"
    elif [[ $1 == "catalyst" ]]; then
      echo "x86_64;arm64"
    else
      echo "Error: unknown architecture passed $1"
      exit 1
    fi
}

function get_deployment_target {
    if [[ $1 == "xros" || $1 == "xrsimulator" ]]; then
      echo "$(get_visionos_deployment_target)"
    elif [[ $1 == "appletvos" || $1 == "appletvsimulator" ]]; then
      echo "$(get_tvos_deployment_target)"
    else
      echo "$(get_ios_deployment_target)"
    fi
}

# build a single framework
# $1 is the target to build
function build_framework {
  if [ ! -d destroot/Library/Frameworks/universal/hermes.xcframework ]; then
    deployment_target=$(get_deployment_target "$1")

    architecture=$(get_architecture "$1")

    build_apple_framework "$1" "$architecture" "$deployment_target"
  else
    echo "Skipping; Clean \"destroot\" to rebuild".
  fi
}

# Allows RNTV CI to optionally build Vision OS framework
function set_include_vision {
    if [[ "$INCLUDE_VISION_OS" == "0" || "$INCLUDE_VISION_OS" == "false" || "$INCLUDE_VISION_OS" == "FALSE" ]]; then
        include_vision=0
    else
        include_vision=1
    fi
}

# group the frameworks together to create a universal framework
function build_universal_framework {
    if [ ! -d destroot/Library/Frameworks/universal/hermes.xcframework ]; then
        set_include_vision
        if [[ $include_vision == 1 ]]; then
            create_universal_framework "iphoneos" "iphonesimulator" "catalyst" "xros" "xrsimulator" "appletvos" "appletvsimulator"
        else
            create_universal_framework "iphoneos" "iphonesimulator" "catalyst" "appletvos" "appletvsimulator"
        fi
    else
        echo "Skipping; Clean \"destroot\" to rebuild".
    fi
}

# single function that builds sequentially iphoneos, iphonesimulator and catalyst
# this is used to preserve backward compatibility
function create_framework {
    if [ ! -d destroot/Library/Frameworks/universal/hermes.xcframework ]; then
        set_include_vision

        build_framework "iphoneos"
        build_framework "iphonesimulator"
        build_framework "appletvos"
        build_framework "appletvsimulator"
        build_framework "catalyst"
        if [[ $include_vision == 1 ]]; then
            build_framework "xros"
            build_framework "xrsimulator"
        fi
        build_universal_framework
    else
        echo "Skipping; Clean \"destroot\" to rebuild".
    fi
}


CURR_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=xplat/js/react-native-github/sdks/hermes-engine/utils/build-apple-framework.sh
. "${CURR_SCRIPT_DIR}/build-apple-framework.sh"

if [[ -z $1 ]]; then
  create_framework
elif [[ $1 == "build_framework" ]]; then
  build_universal_framework
else
  build_framework "$1"
fi
