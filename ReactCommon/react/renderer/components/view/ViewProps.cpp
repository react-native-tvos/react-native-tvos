/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewProps.h"

#include <algorithm>

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/renderer/graphics/conversions.h>

namespace facebook {
namespace react {

ViewProps::ViewProps(
    const PropsParserContext &context,
    ViewProps const &sourceProps,
    RawProps const &rawProps,
    bool shouldSetRawProps)
    : YogaStylableProps(context, sourceProps, rawProps, shouldSetRawProps),
      AccessibilityProps(context, sourceProps, rawProps),
#if TARGET_OS_TV
      isTVSelectable(
          Props::enablePropIteratorSetter ? sourceProps.isTVSelectable
                                          : convertRawProp(
          context,
          rawProps,
          "isTVSelectable",
          sourceProps.isTVSelectable,
          (Boolean)false)),
      hasTVPreferredFocus(
          Props::enablePropIteratorSetter ? sourceProps.hasTVPreferredFocus
                                          : convertRawProp(
          context,
          rawProps,
          "hasTVPreferredFocus",
          sourceProps.hasTVPreferredFocus,
          (Boolean)false)),
      tvParallaxProperties(
          Props::enablePropIteratorSetter ? sourceProps.tvParallaxProperties
                                          : convertRawProp(
          context,
          rawProps,
          "tvParallaxProperties",
          sourceProps.tvParallaxProperties,
          {})),
      nextFocusUp(
          Props::enablePropIteratorSetter ? sourceProps.nextFocusUp
                                          : convertRawProp(context, rawProps, "nextFocusUp", sourceProps.nextFocusUp, {})),
      nextFocusDown(
          Props::enablePropIteratorSetter ? sourceProps.nextFocusDown
                                          : convertRawProp(context, rawProps, "nextFocusDown", sourceProps.nextFocusDown, {})),
      nextFocusLeft(
          Props::enablePropIteratorSetter ? sourceProps.nextFocusLeft
                                          : convertRawProp(context, rawProps, "nextFocusLeft", sourceProps.nextFocusLeft, {})),
      nextFocusRight(
          Props::enablePropIteratorSetter ? sourceProps.nextFocusRight
                                          : convertRawProp(context, rawProps, "nextFocusRight", sourceProps.nextFocusRight, {})),
#endif
      opacity(
          Props::enablePropIteratorSetter ? sourceProps.opacity
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "opacity",
                                                sourceProps.opacity,
                                                (Float)1.0)),
      foregroundColor(
          Props::enablePropIteratorSetter ? sourceProps.foregroundColor
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "foregroundColor",
                                                sourceProps.foregroundColor,
                                                {})),
      backgroundColor(
          Props::enablePropIteratorSetter ? sourceProps.backgroundColor
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "backgroundColor",
                                                sourceProps.backgroundColor,
                                                {})),
      borderRadii(
          Props::enablePropIteratorSetter ? sourceProps.borderRadii
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "border",
                                                "Radius",
                                                sourceProps.borderRadii,
                                                {})),
      borderColors(
          Props::enablePropIteratorSetter ? sourceProps.borderColors
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "border",
                                                "Color",
                                                sourceProps.borderColors,
                                                {})),
      borderStyles(
          Props::enablePropIteratorSetter ? sourceProps.borderStyles
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "border",
                                                "Style",
                                                sourceProps.borderStyles,
                                                {})),
      shadowColor(
          Props::enablePropIteratorSetter ? sourceProps.shadowColor
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowColor",
                                                sourceProps.shadowColor,
                                                {})),
      shadowOffset(
          Props::enablePropIteratorSetter ? sourceProps.shadowOffset
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowOffset",
                                                sourceProps.shadowOffset,
                                                {})),
      shadowOpacity(
          Props::enablePropIteratorSetter ? sourceProps.shadowOpacity
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowOpacity",
                                                sourceProps.shadowOpacity,
                                                {})),
      shadowRadius(
          Props::enablePropIteratorSetter ? sourceProps.shadowRadius
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shadowRadius",
                                                sourceProps.shadowRadius,
                                                {})),
      transform(
          Props::enablePropIteratorSetter ? sourceProps.transform
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "transform",
                                                sourceProps.transform,
                                                {})),
      backfaceVisibility(
          Props::enablePropIteratorSetter ? sourceProps.backfaceVisibility
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "backfaceVisibility",
                                                sourceProps.backfaceVisibility,
                                                {})),
      shouldRasterize(
          Props::enablePropIteratorSetter ? sourceProps.shouldRasterize
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "shouldRasterize",
                                                sourceProps.shouldRasterize,
                                                {})),
      zIndex(
          Props::enablePropIteratorSetter ? sourceProps.zIndex
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "zIndex",
                                                sourceProps.zIndex,
                                                {})),
      pointerEvents(
          Props::enablePropIteratorSetter ? sourceProps.pointerEvents
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "pointerEvents",
                                                sourceProps.pointerEvents,
                                                {})),
      hitSlop(
          Props::enablePropIteratorSetter ? sourceProps.hitSlop
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "hitSlop",
                                                sourceProps.hitSlop,
                                                {})),
      onLayout(
          Props::enablePropIteratorSetter ? sourceProps.onLayout
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "onLayout",
                                                sourceProps.onLayout,
                                                {})),
      events(
          Props::enablePropIteratorSetter
              ? sourceProps.events
              : convertRawProp(context, rawProps, sourceProps.events, {})),
      collapsable(
          Props::enablePropIteratorSetter ? sourceProps.collapsable
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "collapsable",
                                                sourceProps.collapsable,
                                                true)),
      removeClippedSubviews(
          Props::enablePropIteratorSetter
              ? sourceProps.removeClippedSubviews
              : convertRawProp(
                    context,
                    rawProps,
                    "removeClippedSubviews",
                    sourceProps.removeClippedSubviews,
                    false))
#ifdef ANDROID
      ,
      elevation(
          Props::enablePropIteratorSetter ? sourceProps.elevation
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "elevation",
                                                sourceProps.elevation,
                                                {})),
      nativeBackground(
          Props::enablePropIteratorSetter ? sourceProps.nativeBackground
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "nativeBackgroundAndroid",
                                                sourceProps.nativeBackground,
                                                {})),
      nativeForeground(
          Props::enablePropIteratorSetter ? sourceProps.nativeForeground
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "nativeForegroundAndroid",
                                                sourceProps.nativeForeground,
                                                {})),
      focusable(
          Props::enablePropIteratorSetter ? sourceProps.focusable
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "focusable",
                                                sourceProps.focusable,
                                                {})),
      hasTVPreferredFocus(
          Props::enablePropIteratorSetter ? sourceProps.hasTVPreferredFocus
                                          : convertRawProp(
                                                context,
                                                rawProps,
                                                "hasTVPreferredFocus",
                                                sourceProps.hasTVPreferredFocus,
                                                {})),
      needsOffscreenAlphaCompositing(
          Props::enablePropIteratorSetter
              ? sourceProps.needsOffscreenAlphaCompositing
              : convertRawProp(
                    context,
                    rawProps,
                    "needsOffscreenAlphaCompositing",
                    sourceProps.needsOffscreenAlphaCompositing,
                    {})),
      renderToHardwareTextureAndroid(
          Props::enablePropIteratorSetter
              ? sourceProps.renderToHardwareTextureAndroid
              : convertRawProp(
                    context,
                    rawProps,
                    "renderToHardwareTextureAndroid",
                    sourceProps.renderToHardwareTextureAndroid,
                    {}))

#endif
          {};

#pragma mark - Convenience Methods

static BorderRadii ensureNoOverlap(BorderRadii const &radii, Size const &size) {
  // "Corner curves must not overlap: When the sum of any two adjacent border
  // radii exceeds the size of the border box, UAs must proportionally reduce
  // the used values of all border radii until none of them overlap."
  // Source: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap

  auto insets = EdgeInsets{
      /* .left = */ radii.topLeft + radii.bottomLeft,
      /* .top = */ radii.topLeft + radii.topRight,
      /* .right = */ radii.topRight + radii.bottomRight,
      /* .bottom = */ radii.bottomLeft + radii.bottomRight,
  };

  auto insetsScale = EdgeInsets{
      /* .left = */
      insets.left > 0 ? std::min((Float)1.0, size.height / insets.left) : 0,
      /* .top = */
      insets.top > 0 ? std::min((Float)1.0, size.width / insets.top) : 0,
      /* .right = */
      insets.right > 0 ? std::min((Float)1.0, size.height / insets.right) : 0,
      /* .bottom = */
      insets.bottom > 0 ? std::min((Float)1.0, size.width / insets.bottom) : 0,
  };

  return BorderRadii{
      /* topLeft = */
      radii.topLeft * std::min(insetsScale.top, insetsScale.left),
      /* topRight = */
      radii.topRight * std::min(insetsScale.top, insetsScale.right),
      /* bottomLeft = */
      radii.bottomLeft * std::min(insetsScale.bottom, insetsScale.left),
      /* bottomRight = */
      radii.bottomRight * std::min(insetsScale.bottom, insetsScale.right),
  };
}

BorderMetrics ViewProps::resolveBorderMetrics(
    LayoutMetrics const &layoutMetrics) const {
  auto isRTL =
      bool{layoutMetrics.layoutDirection == LayoutDirection::RightToLeft};

  auto borderWidths = CascadedBorderWidths{
      /* .left = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeLeft]),
      /* .top = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeTop]),
      /* .right = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeRight]),
      /* .bottom = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeBottom]),
      /* .start = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeStart]),
      /* .end = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeEnd]),
      /* .horizontal = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeHorizontal]),
      /* .vertical = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeVertical]),
      /* .all = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeAll]),
  };

  return {
      /* .borderColors = */ borderColors.resolve(isRTL, {}),
      /* .borderWidths = */ borderWidths.resolve(isRTL, 0),
      /* .borderRadii = */
      ensureNoOverlap(borderRadii.resolve(isRTL, 0), layoutMetrics.frame.size),
      /* .borderStyles = */ borderStyles.resolve(isRTL, BorderStyle::Solid),
  };
}

bool ViewProps::getClipsContentToBounds() const {
  return yogaStyle.overflow() != YGOverflowVisible;
}

#ifdef ANDROID
bool ViewProps::getProbablyMoreHorizontalThanVertical_DEPRECATED() const {
  return yogaStyle.flexDirection() == YGFlexDirectionRow;
}
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  const auto &defaultViewProps = ViewProps();

  return AccessibilityProps::getDebugProps() +
      YogaStylableProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "zIndex", zIndex, defaultViewProps.zIndex.value_or(0)),
          debugStringConvertibleItem(
              "opacity", opacity, defaultViewProps.opacity),
          debugStringConvertibleItem(
              "foregroundColor",
              foregroundColor,
              defaultViewProps.foregroundColor),
          debugStringConvertibleItem(
              "backgroundColor",
              backgroundColor,
              defaultViewProps.backgroundColor),
      };
}
#endif

} // namespace react
} // namespace facebook
