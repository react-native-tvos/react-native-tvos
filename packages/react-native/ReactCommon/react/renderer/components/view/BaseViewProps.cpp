/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseViewProps.h"

#include <algorithm>

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

namespace {

std::array<float, 3> getTranslateForTransformOrigin(
    float viewWidth,
    float viewHeight,
    TransformOrigin transformOrigin) {
  float viewCenterX = viewWidth / 2;
  float viewCenterY = viewHeight / 2;

  std::array<float, 3> origin = {viewCenterX, viewCenterY, transformOrigin.z};

  for (size_t i = 0; i < transformOrigin.xy.size(); ++i) {
    auto& currentOrigin = transformOrigin.xy[i];
    if (currentOrigin.unit == UnitType::Point) {
      origin[i] = currentOrigin.value;
    } else if (currentOrigin.unit == UnitType::Percent) {
      origin[i] =
          ((i == 0) ? viewWidth : viewHeight) * currentOrigin.value / 100.0f;
    }
  }

  float newTranslateX = -viewCenterX + origin[0];
  float newTranslateY = -viewCenterY + origin[1];
  float newTranslateZ = origin[2];

  return std::array{newTranslateX, newTranslateY, newTranslateZ};
}

} // namespace

BaseViewProps::BaseViewProps(
    const PropsParserContext& context,
    const BaseViewProps& sourceProps,
    const RawProps& rawProps)
    : YogaStylableProps(context, sourceProps, rawProps),
      AccessibilityProps(context, sourceProps, rawProps),
#if TARGET_OS_TV
      isTVSelectable(CoreFeatures::enablePropIteratorSetter ? sourceProps.isTVSelectable : convertRawProp(
          context,
          rawProps,
          "isTVSelectable",
          sourceProps.isTVSelectable,
          false)),
      hasTVPreferredFocus(CoreFeatures::enablePropIteratorSetter ? sourceProps.hasTVPreferredFocus : convertRawProp(
          context,
          rawProps,
          "hasTVPreferredFocus",
          sourceProps.hasTVPreferredFocus,
          false)),
      tvParallaxProperties(CoreFeatures::enablePropIteratorSetter ? sourceProps.tvParallaxProperties : convertRawProp(
          context,
          rawProps,
          "tvParallaxProperties",
          sourceProps.tvParallaxProperties,
          {})),
      nextFocusUp(CoreFeatures::enablePropIteratorSetter ? sourceProps.nextFocusUp : convertRawProp(
          context,
          rawProps,
          "nextFocusUp",
          sourceProps.nextFocusUp,
          {})),
      nextFocusDown(CoreFeatures::enablePropIteratorSetter ? sourceProps.nextFocusDown : convertRawProp(
          context,
          rawProps,
          "nextFocusDown",
          sourceProps.nextFocusDown,
          {})),
      nextFocusLeft(CoreFeatures::enablePropIteratorSetter ? sourceProps.nextFocusLeft : convertRawProp(
          context,
          rawProps,
          "nextFocusLeft",
          sourceProps.nextFocusLeft,
          {})),
      nextFocusRight(CoreFeatures::enablePropIteratorSetter ? sourceProps.nextFocusRight : convertRawProp(
          context,
          rawProps,
          "nextFocusRight",
          sourceProps.nextFocusRight,
          {})),
      autoFocus(CoreFeatures::enablePropIteratorSetter ? sourceProps.autoFocus : convertRawProp(
          context,
          rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          false)),
      trapFocusUp(CoreFeatures::enablePropIteratorSetter ? sourceProps.trapFocusUp : convertRawProp(
          context,
          rawProps,
          "trapFocusUp",
          sourceProps.trapFocusUp,
          false)),
      trapFocusDown(CoreFeatures::enablePropIteratorSetter ? sourceProps.trapFocusDown : convertRawProp(
          context,
          rawProps,
          "trapFocusDown",
          sourceProps.trapFocusDown,
          false)),
      trapFocusLeft(CoreFeatures::enablePropIteratorSetter ? sourceProps.trapFocusLeft : convertRawProp(
          context,
          rawProps,
          "trapFocusLeft",
          sourceProps.trapFocusLeft,
          false)),
      trapFocusRight(CoreFeatures::enablePropIteratorSetter ? sourceProps.trapFocusRight : convertRawProp(
          context,
          rawProps,
          "trapFocusRight",
          sourceProps.trapFocusRight,
          false)),
#endif
      opacity(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.opacity
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "opacity",
                                                       sourceProps.opacity,
                                                       (Float)1.0)),
      backgroundColor(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.backgroundColor
              : convertRawProp(
                    context,
                    rawProps,
                    "backgroundColor",
                    sourceProps.backgroundColor,
                    {})),
      borderRadii(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.borderRadii
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "border",
                                                       "Radius",
                                                       sourceProps.borderRadii,
                                                       {})),
      borderColors(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.borderColors
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "border",
                                                       "Color",
                                                       sourceProps.borderColors,
                                                       {})),
      borderCurves(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.borderCurves
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "border",
                                                       "Curve",
                                                       sourceProps.borderCurves,
                                                       {})),
      borderStyles(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.borderStyles
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "border",
                                                       "Style",
                                                       sourceProps.borderStyles,
                                                       {})),
      shadowColor(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.shadowColor
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "shadowColor",
                                                       sourceProps.shadowColor,
                                                       {})),
      shadowOffset(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.shadowOffset
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "shadowOffset",
                                                       sourceProps.shadowOffset,
                                                       {})),
      shadowOpacity(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.shadowOpacity
              : convertRawProp(
                    context,
                    rawProps,
                    "shadowOpacity",
                    sourceProps.shadowOpacity,
                    {})),
      shadowRadius(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.shadowRadius
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "shadowRadius",
                                                       sourceProps.shadowRadius,
                                                       {})),
      cursor(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.cursor
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "cursor",
                                                       sourceProps.cursor,
                                                       {})),
      boxShadow(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.boxShadow
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "boxShadow",
                                                       sourceProps.boxShadow,
                                                       {})),
      filter(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.filter
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "filter",
                                                       sourceProps.filter,
                                                       {})),
      backgroundImage(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.backgroundImage
              : convertRawProp(
                    context,
                    rawProps,
                    "experimental_backgroundImage",
                    sourceProps.backgroundImage,
                    {})),
      mixBlendMode(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.mixBlendMode
              : convertRawProp(
                    context,
                    rawProps,
                    "experimental_mixBlendMode",
                    sourceProps.mixBlendMode,
                    {})),
      isolation(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.isolation
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "isolation",
                                                       sourceProps.isolation,
                                                       {})),
      transform(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.transform
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "transform",
                                                       sourceProps.transform,
                                                       {})),
      transformOrigin(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.transformOrigin
              : convertRawProp(
                    context,
                    rawProps,
                    "transformOrigin",
                    sourceProps.transformOrigin,
                    {})),
      backfaceVisibility(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.backfaceVisibility
              : convertRawProp(
                    context,
                    rawProps,
                    "backfaceVisibility",
                    sourceProps.backfaceVisibility,
                    {})),
      shouldRasterize(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.shouldRasterize
              : convertRawProp(
                    context,
                    rawProps,
                    "shouldRasterize",
                    sourceProps.shouldRasterize,
                    {})),
      zIndex(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.zIndex
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "zIndex",
                                                       sourceProps.zIndex,
                                                       {})),
      pointerEvents(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.pointerEvents
              : convertRawProp(
                    context,
                    rawProps,
                    "pointerEvents",
                    sourceProps.pointerEvents,
                    {})),
      hitSlop(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.hitSlop
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "hitSlop",
                                                       sourceProps.hitSlop,
                                                       {})),
      onLayout(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.onLayout
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "onLayout",
                                                       sourceProps.onLayout,
                                                       {})),
      events(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.events
              : convertRawProp(context, rawProps, sourceProps.events, {})),
      collapsable(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.collapsable
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "collapsable",
                                                       sourceProps.collapsable,
                                                       true)),
      collapsableChildren(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.collapsableChildren
              : convertRawProp(
                    context,
                    rawProps,
                    "collapsableChildren",
                    sourceProps.collapsableChildren,
                    true)),
      removeClippedSubviews(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.removeClippedSubviews
              : convertRawProp(
                    context,
                    rawProps,
                    "removeClippedSubviews",
                    sourceProps.removeClippedSubviews,
                    false)),
      experimental_layoutConformance(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.experimental_layoutConformance
              : convertRawProp(
                    context,
                    rawProps,
                    "experimental_layoutConformance",
                    sourceProps.experimental_layoutConformance,
                    {})) {}

#define VIEW_EVENT_CASE(eventType)                      \
  case CONSTEXPR_RAW_PROPS_KEY_HASH("on" #eventType): { \
    const auto offset = ViewEvents::Offset::eventType;  \
    ViewEvents defaultViewEvents{};                     \
    bool res = defaultViewEvents[offset];               \
    if (value.hasValue()) {                             \
      fromRawValue(context, value, res);                \
    }                                                   \
    events[offset] = res;                               \
    return;                                             \
  }

void BaseViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  YogaStylableProps::setProp(context, hash, propName, value);
  AccessibilityProps::setProp(context, hash, propName, value);

  static auto defaults = BaseViewProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(opacity);
    RAW_SET_PROP_SWITCH_CASE_BASIC(backgroundColor);
    RAW_SET_PROP_SWITCH_CASE(backgroundImage, "experimental_backgroundImage");
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowOffset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowOpacity);
    RAW_SET_PROP_SWITCH_CASE_BASIC(shadowRadius);
    RAW_SET_PROP_SWITCH_CASE_BASIC(transform);
    RAW_SET_PROP_SWITCH_CASE_BASIC(backfaceVisibility);
    RAW_SET_PROP_SWITCH_CASE_BASIC(shouldRasterize);
    RAW_SET_PROP_SWITCH_CASE_BASIC(zIndex);
    RAW_SET_PROP_SWITCH_CASE_BASIC(pointerEvents);
    RAW_SET_PROP_SWITCH_CASE_BASIC(isolation);
    RAW_SET_PROP_SWITCH_CASE_BASIC(hitSlop);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onLayout);
    RAW_SET_PROP_SWITCH_CASE_BASIC(collapsable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(collapsableChildren);
    RAW_SET_PROP_SWITCH_CASE_BASIC(removeClippedSubviews);
    RAW_SET_PROP_SWITCH_CASE_BASIC(experimental_layoutConformance);
    RAW_SET_PROP_SWITCH_CASE_BASIC(cursor);
    RAW_SET_PROP_SWITCH_CASE(filter, "filter");
    RAW_SET_PROP_SWITCH_CASE(boxShadow, "boxShadow");
#if TARGET_OS_TV
      RAW_SET_PROP_SWITCH_CASE_BASIC(isTVSelectable);
      RAW_SET_PROP_SWITCH_CASE_BASIC(hasTVPreferredFocus);
      RAW_SET_PROP_SWITCH_CASE_BASIC(tvParallaxProperties);
      RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusUp);
      RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusDown);
      RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusLeft);
      RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusRight);
      RAW_SET_PROP_SWITCH_CASE_BASIC(autoFocus);
      RAW_SET_PROP_SWITCH_CASE_BASIC(trapFocusUp);
      RAW_SET_PROP_SWITCH_CASE_BASIC(trapFocusDown);
      RAW_SET_PROP_SWITCH_CASE_BASIC(trapFocusLeft);
      RAW_SET_PROP_SWITCH_CASE_BASIC(trapFocusRight);
#endif
    // events field
    VIEW_EVENT_CASE(PointerEnter);
    VIEW_EVENT_CASE(PointerEnterCapture);
    VIEW_EVENT_CASE(PointerMove);
    VIEW_EVENT_CASE(PointerMoveCapture);
    VIEW_EVENT_CASE(PointerLeave);
    VIEW_EVENT_CASE(PointerLeaveCapture);
    VIEW_EVENT_CASE(PointerOver);
    VIEW_EVENT_CASE(PointerOut);
    VIEW_EVENT_CASE(MoveShouldSetResponder);
    VIEW_EVENT_CASE(MoveShouldSetResponderCapture);
    VIEW_EVENT_CASE(StartShouldSetResponder);
    VIEW_EVENT_CASE(StartShouldSetResponderCapture);
    VIEW_EVENT_CASE(ResponderGrant);
    VIEW_EVENT_CASE(ResponderReject);
    VIEW_EVENT_CASE(ResponderStart);
    VIEW_EVENT_CASE(ResponderEnd);
    VIEW_EVENT_CASE(ResponderRelease);
    VIEW_EVENT_CASE(ResponderMove);
    VIEW_EVENT_CASE(ResponderTerminate);
    VIEW_EVENT_CASE(ResponderTerminationRequest);
    VIEW_EVENT_CASE(ShouldBlockNativeResponder);
    VIEW_EVENT_CASE(TouchStart);
    VIEW_EVENT_CASE(TouchMove);
    VIEW_EVENT_CASE(TouchEnd);
    VIEW_EVENT_CASE(TouchCancel);
    // BorderRadii
    SET_CASCADED_RECTANGLE_CORNERS(borderRadii, "border", "Radius", value);
    SET_CASCADED_RECTANGLE_EDGES(borderColors, "border", "Color", value);
    SET_CASCADED_RECTANGLE_EDGES(borderStyles, "border", "Style", value);
  }
}

#pragma mark - Convenience Methods

static BorderRadii ensureNoOverlap(const BorderRadii& radii, const Size& size) {
  // "Corner curves must not overlap: When the sum of any two adjacent border
  // radii exceeds the size of the border box, UAs must proportionally reduce
  // the used values of all border radii until none of them overlap."
  // Source: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap

  auto insets = EdgeInsets{
      .left = radii.topLeft.horizontal + radii.bottomLeft.horizontal,
      .top = radii.topLeft.vertical + radii.topRight.vertical,
      .right = radii.topRight.horizontal + radii.bottomRight.horizontal,
      .bottom = radii.bottomLeft.vertical + radii.bottomRight.vertical,
  };

  auto insetsScale = EdgeInsets{
      .left =
          insets.left > 0 ? std::min((Float)1.0, size.height / insets.left) : 0,
      .top = insets.top > 0 ? std::min((Float)1.0, size.width / insets.top) : 0,
      .right = insets.right > 0
          ? std::min((Float)1.0, size.height / insets.right)
          : 0,
      .bottom = insets.bottom > 0
          ? std::min((Float)1.0, size.width / insets.bottom)
          : 0,
  };

  return BorderRadii{
      .topLeft =
          {static_cast<float>(
               radii.topLeft.horizontal *
               std::min(insetsScale.top, insetsScale.left)),
           static_cast<float>(
               radii.topLeft.vertical *
               std::min(insetsScale.top, insetsScale.left))},
      .topRight =
          {static_cast<float>(
               radii.topRight.horizontal *
               std::min(insetsScale.top, insetsScale.right)),
           static_cast<float>(
               radii.topRight.vertical *
               std::min(insetsScale.top, insetsScale.right))},
      .bottomLeft =
          {static_cast<float>(
               radii.bottomLeft.horizontal *
               std::min(insetsScale.bottom, insetsScale.left)),
           static_cast<float>(
               radii.bottomLeft.vertical *
               std::min(insetsScale.bottom, insetsScale.left))},
      .bottomRight =
          {static_cast<float>(
               radii.bottomRight.horizontal *
               std::min(insetsScale.bottom, insetsScale.right)),
           static_cast<float>(
               radii.bottomRight.vertical *
               std::min(insetsScale.bottom, insetsScale.right))},
  };
}

static BorderRadii radiiPercentToPoint(
    const RectangleCorners<ValueUnit>& radii,
    const Size& size) {
  return BorderRadii{
      .topLeft =
          {radii.topLeft.resolve(size.width),
           radii.topLeft.resolve(size.height)},
      .topRight =
          {radii.topRight.resolve(size.width),
           radii.topRight.resolve(size.height)},
      .bottomLeft =
          {radii.bottomLeft.resolve(size.width),
           radii.bottomLeft.resolve(size.height)},
      .bottomRight =
          {radii.bottomRight.resolve(size.width),
           radii.bottomRight.resolve(size.height)},
  };
}

CascadedBorderWidths BaseViewProps::getBorderWidths() const {
  return CascadedBorderWidths{
      .left = optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Left)),
      .top = optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Top)),
      .right = optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Right)),
      .bottom =
          optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Bottom)),
      .start = optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Start)),
      .end = optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::End)),
      .horizontal =
          optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Horizontal)),
      .vertical =
          optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::Vertical)),
      .all = optionalFloatFromYogaValue(yogaStyle.border(yoga::Edge::All)),
  };
}

BorderMetrics BaseViewProps::resolveBorderMetrics(
    const LayoutMetrics& layoutMetrics) const {
  auto isRTL =
      bool{layoutMetrics.layoutDirection == LayoutDirection::RightToLeft};

  auto borderWidths = getBorderWidths();

  BorderRadii radii = radiiPercentToPoint(
      borderRadii.resolve(isRTL, ValueUnit{0.0f, UnitType::Point}),
      layoutMetrics.frame.size);

  return {
      .borderColors = borderColors.resolve(isRTL, {}),
      .borderWidths = borderWidths.resolve(isRTL, 0),
      .borderRadii = ensureNoOverlap(radii, layoutMetrics.frame.size),
      .borderCurves = borderCurves.resolve(isRTL, BorderCurve::Circular),
      .borderStyles = borderStyles.resolve(isRTL, BorderStyle::Solid),
  };
}

Transform BaseViewProps::resolveTransform(
    const LayoutMetrics& layoutMetrics) const {
  const auto& frameSize = layoutMetrics.frame.size;
  auto transformMatrix = Transform{};
  if (frameSize.width == 0 && frameSize.height == 0) {
    return transformMatrix;
  }

  // transform is matrix
  if (transform.operations.size() == 1 &&
      transform.operations[0].type == TransformOperationType::Arbitrary) {
    transformMatrix = transform;
  } else {
    for (const auto& operation : transform.operations) {
      transformMatrix = transformMatrix *
          Transform::FromTransformOperation(
                            operation, layoutMetrics.frame.size);
    }
  }

  if (transformOrigin.isSet()) {
    std::array<float, 3> translateOffsets = getTranslateForTransformOrigin(
        frameSize.width, frameSize.height, transformOrigin);
    transformMatrix =
        Transform::Translate(
            translateOffsets[0], translateOffsets[1], translateOffsets[2]) *
        transformMatrix *
        Transform::Translate(
            -translateOffsets[0], -translateOffsets[1], -translateOffsets[2]);
  }

  return transformMatrix;
}

bool BaseViewProps::getClipsContentToBounds() const {
  return yogaStyle.overflow() != yoga::Overflow::Visible;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseViewProps::getDebugProps() const {
  const auto& defaultBaseViewProps = BaseViewProps();

  return AccessibilityProps::getDebugProps() +
      YogaStylableProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "opacity", opacity, defaultBaseViewProps.opacity),
          debugStringConvertibleItem(
              "backgroundColor",
              backgroundColor,
              defaultBaseViewProps.backgroundColor),
          debugStringConvertibleItem(
              "zIndex", zIndex, defaultBaseViewProps.zIndex.value_or(0)),
      };
}
#endif

} // namespace facebook::react
