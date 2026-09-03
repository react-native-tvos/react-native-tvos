/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScrollAnimationEasing} from './ScrollView';

type CubicBezierControlPoints = [number, number, number, number];

// The native side only understands cubic-bezier control points, so the CSS easing
// keywords are resolved to the control points those keywords are defined as.
const SCROLL_ANIMATION_EASING_KEYWORDS: Readonly<{
  linear: CubicBezierControlPoints,
  ease: CubicBezierControlPoints,
  'ease-in': CubicBezierControlPoints,
  'ease-out': CubicBezierControlPoints,
  'ease-in-out': CubicBezierControlPoints,
}> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

function processScrollAnimationEasing(
  easing: ScrollAnimationEasing,
): CubicBezierControlPoints {
  if (typeof easing === 'string') {
    return SCROLL_ANIMATION_EASING_KEYWORDS[easing];
  }
  return easing;
}

export default processScrollAnimationEasing;
