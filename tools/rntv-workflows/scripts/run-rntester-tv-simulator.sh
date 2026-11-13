#!/usr/bin/env bash
# Runs the RNTester TV smoke test on an Apple TV or Android TV device in Expo Simulators.
#
# Usage: run-rntester-tv-simulator.sh tvos <path to RNTester.app built for appletvsimulator>
#        run-rntester-tv-simulator.sh androidtv <path to the x86_64 RNTester APK>
#
# Needs an Expo login (or EXPO_TOKEN) for an account with Expo Simulators access.
# Sessions are billed to the account that owns this EAS project.

set -euo pipefail

usage() {
  echo "Usage: $0 tvos <path to RNTester.app built for appletvsimulator>" >&2
  echo "       $0 androidtv <path to the x86_64 RNTester APK>" >&2
  exit 1
}

[[ $# -eq 2 && -e "$2" ]] || usage

case "$1" in
  tvos)
    PLATFORM=ios
    BUNDLE_ID="com.meta.RNTester.localDevelopment"
    DEVICE_ARGS=(--device "${RNTV_SIMULATOR_DEVICE:-Apple TV 4K (3rd generation)}")
    ;;
  androidtv)
    PLATFORM=android
    BUNDLE_ID="com.facebook.react.uiapp"
    DEVICE_ARGS=(--device "${RNTV_SIMULATOR_DEVICE:-tv_1080p}"
      --system-image "${RNTV_SIMULATOR_SYSTEM_IMAGE:-system-images;android-36;android-tv;x86_64}")
    ;;
  *)
    usage
    ;;
esac

APP_PATH="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="simulator/rntester-$1-smoke.ad"
EAS=(npx --yes eas-cli@latest)
AGENT_DEVICE=("${EAS[@]}" simulator:exec npx --yes agent-device@latest)
TARGET=(--platform "$PLATFORM" --target tv)

cd "$PROJECT_DIR"

if ! "${EAS[@]}" simulator:availability --json --non-interactive | grep -q '"available": *true'; then
  echo "Expo Simulators is not available for this account. It needs a paid EAS plan." >&2
  exit 1
fi

reset_dotenv() {
  printf '# managed by eas-cli\n' > .env.eas-simulator
}

stop_session() {
  "${EAS[@]}" simulator:stop --non-interactive || true
  reset_dotenv
}

reset_dotenv
"${EAS[@]}" simulator:start --platform "$PLATFORM" "${DEVICE_ARGS[@]}" --type agent-device \
  --max-duration-minutes 30 --name "RNTester $1 smoke test" --non-interactive
trap stop_session EXIT

"${AGENT_DEVICE[@]}" install "$BUNDLE_ID" "$APP_PATH" "${TARGET[@]}"
"${AGENT_DEVICE[@]}" replay "$SCRIPT" "${TARGET[@]}"
