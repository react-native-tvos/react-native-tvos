#!/bin/bash
set -euo pipefail

# Prints the JAVA_HOME of the Homebrew openjdk@17 installation.
# Usage: export JAVA_HOME="$(./openjdk17-home.sh)"

if ! command -v brew >/dev/null 2>&1; then
  echo "openjdk17-home.sh: brew not found in PATH. Install Homebrew and run 'brew install openjdk@17'." >&2
  exit 1
fi

if ! prefix=$(brew --prefix --installed openjdk@17 2>/dev/null); then
  echo "openjdk17-home.sh: openjdk@17 is not installed. Run 'brew install openjdk@17'." >&2
  exit 1
fi

java_home="$prefix/libexec/openjdk.jdk/Contents/Home"
if [[ ! -x "$java_home/bin/java" ]]; then
  echo "openjdk17-home.sh: $java_home/bin/java not found. Run 'brew reinstall openjdk@17'." >&2
  exit 1
fi

# Resolve the versioned Cellar path behind the opt symlink.
cd -P "$java_home"
pwd -P
