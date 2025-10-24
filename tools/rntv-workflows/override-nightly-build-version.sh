export REACT_NATIVE_OVERRIDE_NIGHTLY_BUILD_VERSION=`npm pack --dry-run react-native@nightly 2>/dev/null | sed  's/react-native-\(.*\)\.tgz/\1/;'`
