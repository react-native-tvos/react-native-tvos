/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.jetbrains.kotlin.gradle.plugin.extraProperties

plugins { id("maven-publish") }

// group = "com.facebook.react"
// Group for the TV repo
group = "io.github.react-native-tvos"

version =
    parent?.extraProperties?.get("publishing_version")
        ?: error("publishing_version not set for external-artifacts")

configurations.maybeCreate("externalArtifacts")

// Those artifacts should be placed inside the `artifacts/hermes-ios-*.tar.gz` location.

// No Hermes artifact needed for TV (use RN core artifact)

/*
val hermesiOSDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/hermes-ios-debug.tar.gz")
val hermesiOSDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", hermesiOSDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "hermes-ios-debug"
    }
val hermesiOSReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/hermes-ios-release.tar.gz")
val hermesiOSReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", hermesiOSReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "hermes-ios-release"
    }

// Those artifacts should be placed inside the `artifacts/hermes-*.framework.dSYM` location
val hermesDSYMDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/hermes-framework-dSYM-debug.tar.gz")
val hermesDSYMDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", hermesDSYMDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "hermes-framework-dSYM-debug"
    }
val hermesDSYMReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/hermes-framework-dSYM-release.tar.gz")
val hermesDSYMReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", hermesDSYMReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "hermes-framework-dSYM-release"
    }
 */

// No React Native dependencies artifact needed for TV (use RN core artifact)

/*
// [iOS] React Native Dependencies
val reactNativeDependenciesDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesDebug.xcframework.tar.gz")
val reactNativeDependenciesDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-debug"
    }

val reactNativeDependenciesReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesRelease.xcframework.tar.gz")
val reactNativeDependenciesReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-release"
    }
val reactNativeDependenciesDebugDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesDebug.framework.dSYM.tar.gz")
val reactNativeDependenciesDebugDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesDebugDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-dSYM-debug"
    }

val reactNativeDependenciesReleaseDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactNativeDependenciesRelease.framework.dSYM.tar.gz")
val reactNativeDependenciesReleaseDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactNativeDependenciesReleaseDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-dependencies-dSYM-release"
    }
 */

// [iOS] React Native Core
val reactCoreDebugArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreDebug.xcframework.tar.gz")
val reactCoreDebugArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreDebugArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-debug"
    }

val reactCoreReleaseArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreRelease.xcframework.tar.gz")
val reactCoreReleaseArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreReleaseArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-release"
    }
val reactCoreDebugDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreDebug.framework.dSYM.tar.gz")
val reactCoreDebugDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreDebugDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-dSYM-debug"
    }

val reactCoreReleaseDSYMArtifactFile: RegularFile =
    layout.projectDirectory.file("artifacts/ReactCoreRelease.framework.dSYM.tar.gz")
val reactCoreReleaseDSYMArtifact: PublishArtifact =
    artifacts.add("externalArtifacts", reactCoreReleaseDSYMArtifactFile) {
      type = "tgz"
      extension = "tar.gz"
      classifier = "reactnative-core-dSYM-release"
    }

apply(from = "../publish.gradle")

publishing {
  publications {
    getByName("release", MavenPublication::class) {
      artifactId = "react-native-artifacts"
      /*
      artifact(hermesiOSDebugArtifact)
      artifact(hermesiOSReleaseArtifact)
      artifact(hermesDSYMDebugArtifact)
      artifact(hermesDSYMReleaseArtifact)
      artifact(reactNativeDependenciesDebugArtifact)
      artifact(reactNativeDependenciesReleaseArtifact)
      artifact(reactNativeDependenciesDebugDSYMArtifact)
      artifact(reactNativeDependenciesReleaseDSYMArtifact)
       */
      artifact(reactCoreDebugArtifact)
      artifact(reactCoreReleaseArtifact)
      artifact(reactCoreDebugDSYMArtifact)
      artifact(reactCoreReleaseDSYMArtifact)
    }
  }
}
