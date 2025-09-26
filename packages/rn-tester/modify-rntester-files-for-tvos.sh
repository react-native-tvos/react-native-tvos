#!/usr/bin/env bash

# Modify RNTester project for tvOS

echo "Modifying storyboard..."

sed -i '' 's/com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB/com.apple.InterfaceBuilder.AppleTV.Storyboard/g;' RNTester/LaunchScreen.storyboard
sed -i '' 's/iOS.CocoaTouch/AppleTV/g;' RNTester/LaunchScreen.storyboard
sed -i '' 's/retina4_7/AppleTV/g;' RNTester/LaunchScreen.storyboard

echo "Modifying Xcode project..."

sed -i '' 's/\"1,2\"/3/g;' RNTesterPods.xcodeproj/project.pbxproj
sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET/TVOS_DEPLOYMENT_TARGET/g;' RNTesterPods.xcodeproj/project.pbxproj
sed -i '' 's/iphoneos/appletvos/g;' RNTesterPods.xcodeproj/project.pbxproj
sed -i '' 's/ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon/ASSETCATALOG_COMPILER_APPICON_NAME = TVAppIcon/;' RNTesterPods.xcodeproj/project.pbxproj

echo "Modifying Podfile..."

sed -i '' 's/:ios/:tvos/g;' Podfile
