/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<de04d72490f2c09abdcea51e6f02796c>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */

#pragma once

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

namespace facebook::react {

class NativeReactNativeFeatureFlags
    : public NativeReactNativeFeatureFlagsCxxSpecJSI {
 public:
  NativeReactNativeFeatureFlags(std::shared_ptr<CallInvoker> jsInvoker);

  static constexpr std::string_view kModuleName = "NativeReactNativeFeatureFlagsCxx";

  bool commonTestFlag(jsi::Runtime& runtime);

  bool commonTestFlagWithoutNativeImplementation(jsi::Runtime& runtime);

  bool cxxNativeAnimatedEnabled(jsi::Runtime& runtime);

  bool cxxNativeAnimatedRemoveJsSync(jsi::Runtime& runtime);

  bool disableMountItemReorderingAndroid(jsi::Runtime& runtime);

  bool disableOldAndroidAttachmentMetricsWorkarounds(jsi::Runtime& runtime);

  bool disableTextLayoutManagerCacheAndroid(jsi::Runtime& runtime);

  bool enableAccessibilityOrder(jsi::Runtime& runtime);

  bool enableAccumulatedUpdatesInRawPropsAndroid(jsi::Runtime& runtime);

  bool enableAndroidTextMeasurementOptimizations(jsi::Runtime& runtime);

  bool enableBridgelessArchitecture(jsi::Runtime& runtime);

  bool enableCppPropsIteratorSetter(jsi::Runtime& runtime);

  bool enableCustomFocusSearchOnClippedElementsAndroid(jsi::Runtime& runtime);

  bool enableDestroyShadowTreeRevisionAsync(jsi::Runtime& runtime);

  bool enableDoubleMeasurementFixAndroid(jsi::Runtime& runtime);

  bool enableEagerMainQueueModulesOnIOS(jsi::Runtime& runtime);

  bool enableEagerRootViewAttachment(jsi::Runtime& runtime);

  bool enableFabricLogs(jsi::Runtime& runtime);

  bool enableFabricRenderer(jsi::Runtime& runtime);

  bool enableFixForParentTagDuringReparenting(jsi::Runtime& runtime);

  bool enableFontScaleChangesUpdatingLayout(jsi::Runtime& runtime);

  bool enableIOSTextBaselineOffsetPerLine(jsi::Runtime& runtime);

  bool enableIOSViewClipToPaddingBox(jsi::Runtime& runtime);

  bool enableImmediateUpdateModeForContentOffsetChanges(jsi::Runtime& runtime);

  bool enableInteropViewManagerClassLookUpOptimizationIOS(jsi::Runtime& runtime);

  bool enableLayoutAnimationsOnAndroid(jsi::Runtime& runtime);

  bool enableLayoutAnimationsOnIOS(jsi::Runtime& runtime);

  bool enableMainQueueCoordinatorOnIOS(jsi::Runtime& runtime);

  bool enableModuleArgumentNSNullConversionIOS(jsi::Runtime& runtime);

  bool enableNativeCSSParsing(jsi::Runtime& runtime);

  bool enableNetworkEventReporting(jsi::Runtime& runtime);

  bool enableNewBackgroundAndBorderDrawables(jsi::Runtime& runtime);

  bool enablePreparedTextLayout(jsi::Runtime& runtime);

  bool enablePropsUpdateReconciliationAndroid(jsi::Runtime& runtime);

  bool enableResourceTimingAPI(jsi::Runtime& runtime);

  bool enableViewCulling(jsi::Runtime& runtime);

  bool enableViewRecycling(jsi::Runtime& runtime);

  bool enableViewRecyclingForText(jsi::Runtime& runtime);

  bool enableViewRecyclingForView(jsi::Runtime& runtime);

  bool enableVirtualViewDebugFeatures(jsi::Runtime& runtime);

  bool enableVirtualViewRenderState(jsi::Runtime& runtime);

  bool enableVirtualViewWindowFocusDetection(jsi::Runtime& runtime);

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact(jsi::Runtime& runtime);

  bool fuseboxEnabledRelease(jsi::Runtime& runtime);

  bool fuseboxNetworkInspectionEnabled(jsi::Runtime& runtime);

  bool hideOffscreenVirtualViewsOnIOS(jsi::Runtime& runtime);

  double preparedTextCacheSize(jsi::Runtime& runtime);

  bool preventShadowTreeCommitExhaustionWithLocking(jsi::Runtime& runtime);

  bool releaseImageDataWhenConsumed(jsi::Runtime& runtime);

  bool skipActivityIdentityAssertionOnHostPause(jsi::Runtime& runtime);

  bool traceTurboModulePromiseRejectionsOnAndroid(jsi::Runtime& runtime);

  bool updateRuntimeShadowNodeReferencesOnCommit(jsi::Runtime& runtime);

  bool useAlwaysAvailableJSErrorHandling(jsi::Runtime& runtime);

  bool useFabricInterop(jsi::Runtime& runtime);

  bool useNativeEqualsInNativeReadableArrayAndroid(jsi::Runtime& runtime);

  bool useNativeTransformHelperAndroid(jsi::Runtime& runtime);

  bool useNativeViewConfigsInBridgelessMode(jsi::Runtime& runtime);

  bool useOptimizedEventBatchingOnAndroid(jsi::Runtime& runtime);

  bool useRawPropsJsiValue(jsi::Runtime& runtime);

  bool useShadowNodeStateOnClone(jsi::Runtime& runtime);

  bool useTurboModuleInterop(jsi::Runtime& runtime);

  bool useTurboModules(jsi::Runtime& runtime);

  double virtualViewPrerenderRatio(jsi::Runtime& runtime);
};

} // namespace facebook::react
