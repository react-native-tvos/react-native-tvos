/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<59fecbad8533e88844ba114d49613794>>
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

package com.facebook.react.internal.featureflags

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
public object ReactNativeFeatureFlagsCxxInterop {
  init {
    SoLoader.loadLibrary("react_featureflagsjni")
  }

  @DoNotStrip @JvmStatic public external fun commonTestFlag(): Boolean

  @DoNotStrip @JvmStatic public external fun cdpInteractionMetricsEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun cxxNativeAnimatedEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun cxxNativeAnimatedRemoveJsSync(): Boolean

  @DoNotStrip @JvmStatic public external fun disableFabricCommitInCXXAnimated(): Boolean

  @DoNotStrip @JvmStatic public external fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun disableOldAndroidAttachmentMetricsWorkarounds(): Boolean

  @DoNotStrip @JvmStatic public external fun disableTextLayoutManagerCacheAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAccessibilityOrder(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAndroidTextMeasurementOptimizations(): Boolean

  @DoNotStrip @JvmStatic public external fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableDestroyShadowTreeRevisionAsync(): Boolean

  @DoNotStrip @JvmStatic public external fun enableDoubleMeasurementFixAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableEagerMainQueueModulesOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricLogs(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricRenderer(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFixForParentTagDuringReparenting(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFontScaleChangesUpdatingLayout(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIOSTextBaselineOffsetPerLine(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImagePrefetchingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean

  @DoNotStrip @JvmStatic public external fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableMainQueueCoordinatorOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableModuleArgumentNSNullConversionIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNativeCSSParsing(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNetworkEventReporting(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNewBackgroundAndBorderDrawables(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePreparedTextLayout(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableResourceTimingAPI(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewCulling(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecycling(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForText(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForView(): Boolean

  @DoNotStrip @JvmStatic public external fun enableVirtualViewDebugFeatures(): Boolean

  @DoNotStrip @JvmStatic public external fun enableVirtualViewRenderState(): Boolean

  @DoNotStrip @JvmStatic public external fun enableVirtualViewWindowFocusDetection(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxNetworkInspectionEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun hideOffscreenVirtualViewsOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun perfMonitorV2Enabled(): Boolean

  @DoNotStrip @JvmStatic public external fun preparedTextCacheSize(): Double

  @DoNotStrip @JvmStatic public external fun preventShadowTreeCommitExhaustion(): Boolean

  @DoNotStrip @JvmStatic public external fun releaseImageDataWhenConsumed(): Boolean

  @DoNotStrip @JvmStatic public external fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean

  @DoNotStrip @JvmStatic public external fun skipActivityIdentityAssertionOnHostPause(): Boolean

  @DoNotStrip @JvmStatic public external fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean

  @DoNotStrip @JvmStatic public external fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip @JvmStatic public external fun useFabricInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeEqualsInNativeReadableArrayAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeTransformHelperAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip @JvmStatic public external fun useOptimizedEventBatchingOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useRawPropsJsiValue(): Boolean

  @DoNotStrip @JvmStatic public external fun useShadowNodeStateOnClone(): Boolean

  @DoNotStrip @JvmStatic public external fun useTurboModuleInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun useTurboModules(): Boolean

  @DoNotStrip @JvmStatic public external fun virtualViewPrerenderRatio(): Double

  @DoNotStrip @JvmStatic public external fun override(provider: Any)

  @DoNotStrip @JvmStatic public external fun dangerouslyReset()

  @DoNotStrip @JvmStatic public external fun dangerouslyForceOverride(provider: Any): String?
}
