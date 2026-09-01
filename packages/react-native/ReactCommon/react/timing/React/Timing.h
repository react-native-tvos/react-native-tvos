/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/timing` module - public entry point.
//
//   #include <React/Timing.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/timing/...>` includes; only
// outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. Scoped to
// this block so later *direct* includes in the same TU are still caught.
#define RN_UMBRELLA_CONTEXT

#include <react/timing/primitives.h>

#undef RN_UMBRELLA_CONTEXT
