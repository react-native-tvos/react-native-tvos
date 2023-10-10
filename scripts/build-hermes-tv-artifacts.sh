#!/bin/sh

# Should be run from the top of the react-native-tvos monorepo


export REACT_NATIVE_PATH=$PWD/packages/react-native
export HERMES_TV_ARCHIVE_DIR=$REACT_NATIVE_PATH/ReactAndroid/external-artifacts/artifacts
export HERMES_DSYMS_WORKING_DIR=/tmp/hermes_tmp/dSYM
export HERMES_DSYMS_DEST_DIR=/tmp/hermes/dSYM

export MAC_DEPLOYMENT_TARGET="10.13"
export IOS_DEPLOYMENT_TARGET="12.4"

export REACT_NATIVE_CI=true
export CI=true

# Prepare Hermes
rm -rf $HERMES_TV_ARCHIVE_DIR
mkdir $HERMES_TV_ARCHIVE_DIR
rm -rf $HERMES_DSYMS_WORKING_DIR
mkdir $HERMES_DSYMS_WORKING_DIR
rm -rf $HERMES_DSYMS_DEST_DIR
mkdir $HERMES_DSYMS_DEST_DIR

build_tv_artifact() {
  # Build step 1: clean and prepare Hermes directory
  (cd $REACT_NATIVE_PATH; rm -rf ./sdks/hermes ./sdks/download)
  (cd $REACT_NATIVE_PATH; node scripts/hermes/prepare-hermes-for-build.js)
  (cd $REACT_NATIVE_PATH; cp -r ./sdks/hermes-engine/utils/* ./sdks/hermes/utils)
  
  # Build step 2: build Mac binaries
  (cd $REACT_NATIVE_PATH/sdks/hermes; BUILD_TYPE=$HERMES_BUILD_TYPE ./utils/build-mac-framework.sh)

  # Build step 3: build iOS/tvOS binaries
  (cd $REACT_NATIVE_PATH/sdks/hermes; BUILD_TYPE=$HERMES_BUILD_TYPE ./utils/build-ios-framework.sh)
 
  # Build step 4: create tarballs
  (cd $REACT_NATIVE_PATH; TARBALL_OUTPUT_PATH=`node ./scripts/hermes/create-tarball.js --inputDir ./sdks/hermes --buildType "$HERMES_BUILD_TYPE" --outputDir $HERMES_TV_ARCHIVE_DIR`; echo "Build artifact for type $HERMES_BUILD_TYPE saved to $TARBALL_OUTPUT_PATH.")

  # Build step 5: create dSYM archives
  (
  WORKING_DIR="$HERMES_DSYMS_WORKING_DIR/$HERMES_BUILD_TYPE"

  mkdir -p "$WORKING_DIR/macosx"
  mkdir -p "$WORKING_DIR/catalyst"
  mkdir -p "$WORKING_DIR/iphoneos"
  mkdir -p "$WORKING_DIR/iphonesimulator"

  cd $REACT_NATIVE_PATH/sdks/hermes || exit 1

  DSYM_FILE_PATH=API/hermes/hermes.framework.dSYM
  cp -r build_macosx/$DSYM_FILE_PATH "$WORKING_DIR/macosx/"
  cp -r build_catalyst/$DSYM_FILE_PATH "$WORKING_DIR/catalyst/"
  cp -r build_iphoneos/$DSYM_FILE_PATH "$WORKING_DIR/iphoneos/"
  cp -r build_iphonesimulator/$DSYM_FILE_PATH "$WORKING_DIR/iphonesimulator/"

  DEST_DIR="$HERMES_DSYMS_DEST_DIR/$HERMES_BUILD_TYPE"
  tar -C "$WORKING_DIR" -czvf "hermes.framework.dSYM" .

  mkdir -p "$DEST_DIR"
  mv "hermes.framework.dSYM" "$DEST_DIR"
  )
}

HERMES_BUILD_TYPE=Debug
build_tv_artifact

HERMES_BUILD_TYPE=Release
build_tv_artifact

# Move dSYM archives to artifacts directory
cp $HERMES_DSYMS_DEST_DIR/Debug/hermes.framework.dSYM  $REACT_NATIVE_PATH/ReactAndroid/external-artifacts/artifacts/hermes-framework-dSYM-debug.tar.gz
cp $HERMES_DSYMS_DEST_DIR/Release/hermes.framework.dSYM  $REACT_NATIVE_PATH/ReactAndroid/external-artifacts/artifacts/hermes-framework-dSYM-release.tar.gz

# Final step: publish to local repository
echo "Artifacts are now in $HERMES_TV_ARCHIVE_DIR"
echo "You can publish them to the local (/tmp/maven-local) repository, from the top level directory:"
echo "  ./gradlew :packages:react-native:ReactAndroid:external-artifacts:publishAllPublicationsToMavenTempLocalRepository"

gpg --sign README.md
rm -f README.md.gpg
./gradlew :packages:react-native:ReactAndroid:external-artifacts:publishAllPublicationsToMavenTempLocalRepository
