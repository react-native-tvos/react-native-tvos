# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB rrc_view_SRC CONFIGURE_DEPENDS
        *.cpp
        platform/android/react/renderer/components/view/*.cpp)

add_library(rrc_view OBJECT ${rrc_view_SRC})

target_include_directories(rrc_view
        PUBLIC
          ${REACT_COMMON_DIR}
          ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
)

target_link_libraries(rrc_view
        folly_runtime
        glog
        glog_init
        jsi
        logger
        react_debug
        react_renderer_core
        react_renderer_css
        react_renderer_debug
        react_renderer_graphics
        yoga)
target_compile_reactnative_options(rrc_view PRIVATE)
target_compile_options(rrc_view PRIVATE -Wpedantic)
