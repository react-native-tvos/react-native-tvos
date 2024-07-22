# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../new_architecture.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/SpecMock.rb"
require_relative "./test_utils/FileMock.rb"

class NewArchitectureTests < Test::Unit::TestCase
    def teardown
        Pod::UI.reset()
        FileMock.reset()
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
    end

    # ============================= #
    # Test - Set Clang Cxx Lang Std #
    # ============================= #

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsPresent
        installer = prepare_mocked_installer_with_react_core
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path2.xcproj"])
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsNotPresent
        installer = prepare_mocked_installer_without_react_core
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], nil)
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], nil)
        assert_equal(installer.pods_project.targets[0].received_resolved_build_setting_parameters, [])
        assert_equal(Pod::UI.collected_messages, [])
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenThereAreDifferentValuesForLanguageStandard_takesTheFirstValue
        installer = prepare_mocked_installer_with_react_core_and_different_language_standards
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path2.xcproj"])
    end

    # =================== #
    # Test - Modify Flags #
    # =================== #
    def test_modifyFlagsForNewArch_whenOnOldArch_doNothing
        # Arrange
        first_xcconfig = prepare_xcconfig("First")
        second_xcconfig = prepare_xcconfig("Second")
        react_core_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        react_core_release_config = prepare_CXX_Flags_build_configuration("Release")
        yoga_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        yoga_release_config = prepare_CXX_Flags_build_configuration("Release")

        installer = prepare_installer_for_cpp_flags(
            [ first_xcconfig, second_xcconfig ],
            {
                "React-Core" => [ react_core_debug_config, react_core_release_config ],
                "Yoga" => [ yoga_debug_config, yoga_release_config ],
            }
        )
        # Act
        NewArchitectureHelper.modify_flags_for_new_architecture(installer, false)

        # Assert
        assert_equal(first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(first_xcconfig.save_as_invocation, [])
        assert_equal(second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(second_xcconfig.save_as_invocation, [])
        assert_equal(react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
    end

    def test_modifyFlagsForNewArch_whenOnNewArchAndIsRelease_updateFlags
        # Arrange
        first_xcconfig = prepare_xcconfig("First")
        second_xcconfig = prepare_xcconfig("Second")
        react_core_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        react_core_release_config = prepare_CXX_Flags_build_configuration("Release")
        yoga_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        yoga_release_config = prepare_CXX_Flags_build_configuration("Release")

        installer = prepare_installer_for_cpp_flags(
            [ first_xcconfig, second_xcconfig ],
            {
                "React-Core" => [ react_core_debug_config, react_core_release_config ],
                "Yoga" => [ yoga_debug_config, yoga_release_config ],
            }
        )
        # Act
        NewArchitectureHelper.modify_flags_for_new_architecture(installer, true)

        # Assert
        assert_equal(first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1")
        assert_nil(first_xcconfig.attributes["OTHER_CFLAGS"])
        assert_equal(first_xcconfig.save_as_invocation, ["a/path/First.xcconfig"])
        assert_equal(second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1")
        assert_nil(second_xcconfig.attributes["OTHER_CFLAGS"])
        assert_equal(second_xcconfig.save_as_invocation, ["a/path/Second.xcconfig"])
        assert_equal(react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1")
        assert_nil(react_core_debug_config.build_settings["OTHER_CFLAGS"])
        assert_equal(react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DNDEBUG")
        assert_equal(react_core_release_config.build_settings["OTHER_CFLAGS"], "$(inherited) -DNDEBUG")
        assert_equal(yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_nil(yoga_debug_config.build_settings["OTHER_CFLAGS"])
        assert_equal(yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DNDEBUG")
        assert_equal(yoga_release_config.build_settings["OTHER_CFLAGS"], "$(inherited) -DNDEBUG")
    end

    # =================================== #
    # Test - install Modules Dependencies #
    # =================================== #
    def test_installModulesDependencies_whenNewArchEnabledAndNewArchAndNoSearchPathsNorCompilerFlagsArePresent_itInstallDependencies
        #  Arrange
        spec = SpecMock.new

        # Act
        NewArchitectureHelper.install_modules_dependencies(spec, true, '2022.05.16.00')

        # Assert
        expected_flags = "$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -Wno-comma -Wno-shorten-64-to-32 -DRCT_NEW_ARCH_ENABLED=1"
        assert_equal(spec.compiler_flags, expected_flags)
        assert_equal(spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"], "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/Headers/Private/Yoga\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-FabricImage/React_FabricImage.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-ImageManager/React_ImageManager.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererdebug/React_rendererdebug.framework/Headers\"")
        assert_equal(spec.pod_target_xcconfig["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(spec.pod_target_xcconfig["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1")
        assert_equal(
            spec.dependencies,
            [
                { :dependency_name => "React-Core" },
                { :dependency_name => "RCT-Folly", "version"=>"2022.05.16.00" },
                { :dependency_name => "glog" },
                { :dependency_name => "React-RCTFabric" },
                { :dependency_name => "React-Codegen" },
                { :dependency_name => "RCTRequired" },
                { :dependency_name => "RCTTypeSafety" },
                { :dependency_name => "ReactCommon/turbomodule/bridging" },
                { :dependency_name => "ReactCommon/turbomodule/core" },
                { :dependency_name => "React-NativeModulesApple" },
                { :dependency_name => "Yoga" },
                { :dependency_name => "React-Fabric" },
                { :dependency_name => "React-graphics" },
                { :dependency_name => "React-utils" },
                { :dependency_name => "React-debug" },
                { :dependency_name => "React-ImageManager" },
                { :dependency_name => "React-rendererdebug" },
                { :dependency_name => "hermes-engine" }
        ])
    end

    def test_installModulesDependencies_whenNewArchDisabledAndSearchPathsAndCompilerFlagsArePresent_itInstallDependenciesAndPreserveOtherSettings
        #  Arrange
        spec = SpecMock.new
        spec.compiler_flags = '-Wno-nullability-completeness'
        other_flags = "\"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/boost\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Codegen/React_Codegen.framework/Headers\""
        spec.pod_target_xcconfig = {
            "HEADER_SEARCH_PATHS" => other_flags
        }

        # Act
        NewArchitectureHelper.install_modules_dependencies(spec, false, '2022.05.16.00')

        # Assert
        assert_equal(spec.compiler_flags, "$(inherited) -Wno-nullability-completeness #{NewArchitectureHelper.folly_compiler_flags}")
        assert_equal(spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"], "#{other_flags} \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/Headers/Private/Yoga\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-FabricImage/React_FabricImage.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-ImageManager/React_ImageManager.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererdebug/React_rendererdebug.framework/Headers\"")
        assert_equal(spec.pod_target_xcconfig["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(
            spec.dependencies,
            [
                { :dependency_name => "React-Core" },
                { :dependency_name => "RCT-Folly", "version"=>"2022.05.16.00" },
                { :dependency_name => "glog" }
            ]
        )
    end

    # =============================== #
    # Test - Compute New Arch Enabled #
    # =============================== #

    def test_computeNewArchEnabled_whenOnMainAndFlagTrue_returnTrue
        version = '1000.0.0'
        new_arch_enabled = true

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOnMainAndFlagFalse_returnFalse
        version = '1000.0.0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
    end

    def test_computeNewArchEnabled_whenOnStableAndFlagTrue_returnTrue
        version = '0.73.0'
        new_arch_enabled = true

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOnStableAndFlagFalse_returnFalse
        version = '0.73.0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
    end

    def test_computeNewArchEnabled_whenOn100AndFlagTrue_returnTrue
        version = '1.0.0-prealpha.0'
        new_arch_enabled = true

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOn100PrealphaWithDotsAndFlagFalse_returnTrue
        version = '1.0.0-prealpha.0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOn100PrealphaWithDashAndFlagFalse_returnTrue
        version = '1.0.0-prealpha-0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOn100PrealphaOnlyWordsAndFlagFalse_returnTrue
        version = '1.0.0-prealpha0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOnGreaterThan100AndFlagFalse_returnTrue
        version = '3.2.1'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    # =================================== #
    # Test - Extract React Native Version #
    # =================================== #
    def test_extractReactNativeVersion_whenFileDoesNotExists_raiseError()
        react_native_path = './node_modules/react-native/'

        exception = assert_raise(RuntimeError) do
            NewArchitectureHelper.extract_react_native_version(react_native_path, :file_manager => FileMock)
        end

        assert_equal("Couldn't find the React Native package.json file at ./node_modules/react-native/package.json", exception.message)
    end

    def test_extractReactNativeVersion_whenFileExists_returnTheRightVersion()
        react_native_path = "./node_modules/react-native/"
        full_path = File.join(react_native_path, "package.json")
        json = "{\"version\": \"1.0.0-prealpha.0\"}"
        FileMock.mocked_existing_files([full_path])
        FileMock.files_to_read({
            full_path => json
        })

        version = NewArchitectureHelper.extract_react_native_version(react_native_path, :file_manager => FileMock)

        assert_equal("1.0.0-prealpha.0", version)
    end

    # =============================== #
    # Test - New Architecture Enabled #
    # =============================== #
    def test_newArchEnabled_whenRCTNewArchEnabledIsSetTo1_returnTrue
        ENV["RCT_NEW_ARCH_ENABLED"] = "1"
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_true(is_enabled)
    end

    def test_newArchEnabled_whenRCTNewArchEnabledIsSetTo0_returnFalse
        ENV["RCT_NEW_ARCH_ENABLED"] = "0"
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_false(is_enabled)
    end

    def test_newArchEnabled_whenRCTNewArchEnabledIsNotSet_returnFalse
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_false(is_enabled)
    end


end

# ================ #
# Test - Utilities #
# ================ #
def prepare_mocked_installer_with_react_core
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                ),
                TargetMock.new(
                    "React-Core",
                    [
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_mocked_installer_with_react_core_and_different_language_standards
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                ),
                TargetMock.new(
                    "React-Core",
                    [
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "new" }),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_mocked_installer_without_react_core
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_xcconfig(name)
    return XCConfigMock.new(name, :attributes => {"OTHER_CPLUSPLUSFLAGS" => "$(inherited)"})
end

def prepare_CXX_Flags_build_configuration(name)
    return BuildConfigurationMock.new(name, {
        "OTHER_CPLUSPLUSFLAGS" => "$(inherited)"
    })
end

def prepare_pod_target_installation_results_mock(name, configs)
    target = TargetMock.new(name, configs)
    return TargetInstallationResultMock.new(target, target)
end

def prepare_installer_for_cpp_flags(xcconfigs, build_configs)
    xcconfigs_map = {}
    xcconfigs.each do |config|
        xcconfigs_map[config.name.to_s] = config
    end

    pod_target_installation_results_map = {}
    build_configs.each do |name, build_configs|
        pod_target_installation_results_map[name.to_s] = prepare_pod_target_installation_results_mock(
            name.to_s, build_configs
        )
    end

    return InstallerMock.new(
        PodsProjectMock.new,
        [
            AggregatedProjectMock.new(:xcconfigs => xcconfigs_map, :base_path => "a/path/")
        ],
        :pod_target_installation_results => pod_target_installation_results_map
    )
end
