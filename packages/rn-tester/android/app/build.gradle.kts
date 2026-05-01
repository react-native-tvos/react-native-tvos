/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  id("com.facebook.react")
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.android)
}

val reactNativeDirPath = "$rootDir/packages/react-native"
val isNewArchEnabled = project.property("newArchEnabled") == "true"

// Optional artifacts-mode toggle. When `reactNativeMavenLocalPath` is set (e.g.
// `-PreactNativeMavenLocalPath=/tmp/maven-local`) RN-Tester consumes the
// `react-android` AAR from that local Maven repo and the upstream Hermes AAR
// (via the npm hermes-compiler) instead of compiling React Native from source.
// When unset, the historical source-build behavior is preserved unchanged.
val reactNativeMavenLocalPath: String? =
    project.findProperty("reactNativeMavenLocalPath")?.toString()?.takeIf { it.isNotBlank() }
val useReactNativeArtifacts: Boolean = reactNativeMavenLocalPath != null
val reactNativeArtifactVersion: String =
    project.findProperty("reactNativeArtifactVersion")?.toString() ?: "1000.0.0"
val reactNativeArtifactGroup: String =
    project.findProperty("reactNativeArtifactGroup")?.toString() ?: "io.github.react-native-tvos"

if (useReactNativeArtifacts) {
  repositories {
    maven { url = uri(file(reactNativeMavenLocalPath!!)) }
  }

  // Workspace native modules (e.g. react-native-popup-menu-android) declare a
  // project() dependency on :packages:react-native:ReactAndroid. When rn-tester
  // autolinks them, that source project rides along into the runtime classpath
  // alongside our AAR, producing duplicate classes that R8 rejects in release
  // builds. Redirect any such project reference to the published AAR coordinate
  // to keep the classpath single-sourced.
  configurations.all {
    resolutionStrategy.dependencySubstitution {
      substitute(project(":packages:react-native:ReactAndroid"))
          .using(module("$reactNativeArtifactGroup:react-android:$reactNativeArtifactVersion"))
          .because("artifacts-mode: source ReactAndroid -> published AAR")
    }
  }
}

/**
 * This is the configuration block to customize your React Native Android app. By default you don't
 * need to apply any configuration, just uncomment the lines you need.
 */
react {
  /* Folders */
  //   The root of your project, i.e. where "package.json" lives. Default is '..'
  root = file("../../")
  //   The folder where the react-native NPM package is. Default is ../node_modules/react-native
  reactNativeDir = file(reactNativeDirPath)
  //   The folder where the react-native Codegen package is. Default is
  // ../node_modules/@react-native/codegen
  codegenDir = file("$rootDir/node_modules/@react-native/codegen")
  //   The cli.js file which is the React Native CLI entrypoint. Default is
  // ../node_modules/react-native/cli.js
  cliFile = file("$reactNativeDirPath/cli.js")

  /* Variants */
  //   The list of variants to that are debuggable. For those we're going to
  //   skip the bundling of the JS bundle and the assets. By default is just 'debug'.
  //   If you add flavors like lite, prod, etc. you'll have to list your debuggableVariants.
  // debuggableVariants = listOf("debug")

  /* Bundling */
  //   A list containing the node command and its flags. Default is just 'node'.
  // nodeExecutableAndArgs = ["node"]
  //
  //   The command to run when bundling. By default is 'bundle'
  // bundleCommand = "ram-bundle"
  //
  //   The path to the CLI configuration file. Default is empty.
  // bundleConfig = file(../rn-cli.config.js)
  //
  //   The name of the generated asset file containing your JS bundle
  bundleAssetName = "RNTesterApp.android.bundle"
  //
  //   The entry file for bundle generation. Default is 'index.android.js' or 'index.js'
  entryFile = file("../../js/RNTesterApp.android.js")
  //
  //   A list of extra flags to pass to the 'bundle' commands.
  //   See https://github.com/react-native-community/cli/blob/main/docs/commands.md#bundle
  // extraPackagerArgs = []

  /* Hermes Commands */
  //   The hermes compiler command to run. By default it is 'hermesc'
  hermesCommand =
      if (
          useReactNativeArtifacts ||
              project.findProperty("react.internal.useHermesStable")?.toString()?.toBoolean() == true ||
              project.findProperty("react.internal.useHermesNightly")?.toString()?.toBoolean() ==
                  true
      )
          "$rootDir/node_modules/hermes-compiler/hermesc/%OS-BIN%/hermesc"
      else "$reactNativeDirPath/ReactAndroid/hermes-engine/build/hermes/bin/hermesc"

  autolinkLibrariesWithApp()
}

/** Run Proguard to shrink the Java bytecode in release builds. */
val enableProguardInReleaseBuilds = true

/** This allows to customized the CMake version used for compiling RN Tester. */
val cmakeVersion =
    if (useReactNativeArtifacts) {
      // Match ReactAndroid/build.gradle.kts default; avoids referencing the source project.
      System.getenv("CMAKE_VERSION") ?: "3.30.5"
    } else {
      project(":packages:react-native:ReactAndroid").properties["cmake_version"].toString()
    }

/** Architectures to build native code for. */
fun reactNativeArchitectures(): List<String> {
  val value = project.properties["reactNativeArchitectures"]
  return value?.toString()?.split(",") ?: listOf("armeabi-v7a", "x86", "x86_64", "arm64-v8a")
}

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.react.uiapp"

  // Used to override the NDK path/version on internal CI or by allowing
  // users to customize the NDK path/version from their root project (e.g. for Apple Silicon
  // support)
  if (rootProject.hasProperty("ndkPath") && rootProject.properties["ndkPath"] != null) {
    ndkPath = rootProject.properties["ndkPath"].toString()
  }
  if (rootProject.hasProperty("ndkVersion") && rootProject.properties["ndkVersion"] != null) {
    ndkVersion = rootProject.properties["ndkVersion"].toString()
  }

  defaultConfig {
    applicationId = "com.facebook.react.uiapp"
    minSdk = libs.versions.minSdk.get().toInt()
    targetSdk = libs.versions.targetSdk.get().toInt()
    versionCode = 1
    versionName = "1.0"
    testBuildType =
        System.getProperty(
            "testBuildType",
            "debug",
        ) // This will later be used to control the test apk build type
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    buildConfigField("String", "JS_MAIN_MODULE_NAME", "\"js/RNTesterApp.android\"")
    buildConfigField("String", "BUNDLE_ASSET_NAME", "\"RNTesterApp.android.bundle\"")
    buildConfigField("Boolean", "IS_INTERNAL_BUILD", "false")
  }
  externalNativeBuild { cmake { version = cmakeVersion } }
  splits {
    abi {
      isEnable = true
      isUniversalApk = false
      reset()
      include(*reactNativeArchitectures().toTypedArray())
    }
  }
  buildTypes {
    release {
      isMinifyEnabled = enableProguardInReleaseBuilds
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
      signingConfig = signingConfigs.getByName("debug")
    }
  }
  sourceSets.named("main") {
    // SampleTurboModule.
    java.srcDirs(
        "$reactNativeDirPath/ReactCommon/react/nativemodule/samples/platform/android",
    )
    res.setSrcDirs(
        listOf(
            "src/main/res",
            "src/main/public_res",
        )
    )
  }
}

dependencies {
  if (useReactNativeArtifacts) {
    // Consume the prebuilt React Native AAR from the local Maven repo. Hermes is
    // pulled transitively via the upstream `hermes-android` AAR.
    implementation("$reactNativeArtifactGroup:react-android:$reactNativeArtifactVersion")
  } else {
    // Build React Native from source
    implementation(project(":packages:react-native:ReactAndroid"))
    // Consume Hermes as built from source.
    implementation(project(":packages:react-native:ReactAndroid:hermes-engine"))
  }

  testImplementation(libs.junit)
  implementation(libs.androidx.profileinstaller)
}

android {
  externalNativeBuild {
    cmake {
      // RN Tester is doing custom linking of C++ libraries therefore needs
      // a dedicated CMakeLists.txt file.
      if (isNewArchEnabled) {
        path("src/main/jni/CMakeLists.txt")
      }
    }
  }
}

kotlin { explicitApi() }

tasks.withType<JavaCompile>().configureEach {
  options.compilerArgs.add("-Xlint:deprecation,unchecked")
  options.compilerArgs.add("-Werror")
}

tasks.withType<KotlinCompile>().configureEach {
  compilerOptions {
    allWarningsAsErrors =
        project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false
  }
}

afterEvaluate {
  if (
      !useReactNativeArtifacts &&
          (project.findProperty("react.internal.useHermesNightly") == null ||
              project.findProperty("react.internal.useHermesNightly").toString() == "false") &&
          (project.findProperty("react.internal.useHermesStable") == null ||
              project.findProperty("react.internal.useHermesStable").toString() == "false")
  ) {
    // As we're consuming Hermes from source, we want to make sure
    // `hermesc` is built before we actually invoke the `emit*HermesResource` task.
    // In artifacts mode, hermesc comes from `node_modules/hermes-compiler` and the
    // libhermes.so runtime ships in the upstream hermes-android AAR, so this is a
    // no-op there.
    tasks
        .getByName("createBundleReleaseJsAndAssets")
        .dependsOn(":packages:react-native:ReactAndroid:hermes-engine:buildHermesC")
  }

  // The codegen JS lib (`node_modules/@react-native/codegen/lib/`) is required even in
  // artifacts mode: the `react-android` AAR doesn't ship it, and Yarn workspaces resolve
  // `@react-native/codegen` to the workspace package via a symlink, which skips the npm
  // `prepare` step that would normally pre-build `lib/`. The buildCodegenCLI task runs
  // the codegen package's build script and is the canonical way to produce that output.
  tasks
      .getByName("generateCodegenSchemaFromJavaScript")
      .dependsOn(":packages:react-native:ReactAndroid:buildCodegenCLI")
  tasks
      .getByName("createBundleReleaseJsAndAssets")
      .dependsOn(":packages:react-native:ReactAndroid:buildCodegenCLI")
}
