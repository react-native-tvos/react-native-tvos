/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/AccessibilityProps.h>
#include <react/renderer/components/view/YogaStylableProps.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Geometry.h>
#include <react/renderer/graphics/Transform.h>

#include <optional>

namespace facebook {
namespace react {

class ViewProps;

using SharedViewProps = std::shared_ptr<ViewProps const>;

class ViewProps : public YogaStylableProps, public AccessibilityProps {
 public:
  ViewProps() = default;
  ViewProps(
      const PropsParserContext &context,
      ViewProps const &sourceProps,
      RawProps const &rawProps,
      bool shouldSetRawProps = true);

#pragma mark - Props

  // Color
  Float opacity{1.0};
  SharedColor foregroundColor{};
  SharedColor backgroundColor{};

  // Borders
  CascadedBorderRadii borderRadii{};
  CascadedBorderColors borderColors{};
  CascadedBorderStyles borderStyles{};

  // Shadow
  SharedColor shadowColor{};
  Size shadowOffset{0, -3};
  Float shadowOpacity{};
  Float shadowRadius{3};

  // Transform
  Transform transform{};
  BackfaceVisibility backfaceVisibility{};
  bool shouldRasterize{};
  std::optional<int> zIndex{};

  // Events
  PointerEventsMode pointerEvents{};
  EdgeInsets hitSlop{};
  bool onLayout{};

  ViewEvents events{};

  bool collapsable{true};

  bool removeClippedSubviews{false};

#if TARGET_OS_TV
  bool isTVSelectable{false};
  bool hasTVPreferredFocus{false};
  TVParallaxProperties tvParallaxProperties;
  std::optional<int> nextFocusUp;
  std::optional<int> nextFocusDown;
  std::optional<int> nextFocusLeft;
  std::optional<int> nextFocusRight;
  bool autoFocus{false};
  bool trapFocusUp{false};
  bool trapFocusDown{false};
  bool trapFocusLeft{false};
  bool trapFocusRight{false};
#endif

  Float elevation{}; /* Android-only */

#ifdef ANDROID

  std::optional<NativeDrawable> nativeBackground{};
  std::optional<NativeDrawable> nativeForeground{};

  bool focusable{false};
  bool hasTVPreferredFocus{false};
  bool needsOffscreenAlphaCompositing{false};
  bool renderToHardwareTextureAndroid{false};
  bool autoFocus{false};
  bool trapFocusUp{false};
  bool trapFocusDown{false};
  bool trapFocusLeft{false};
  bool trapFocusRight{false};
#endif

#pragma mark - Convenience Methods

  BorderMetrics resolveBorderMetrics(LayoutMetrics const &layoutMetrics) const;
  bool getClipsContentToBounds() const;

#ifdef ANDROID
  bool getProbablyMoreHorizontalThanVertical_DEPRECATED() const;
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook
