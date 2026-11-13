#!/usr/bin/env bash
# Runs the RNTester tvOS smoke test on an Apple TV in Expo Simulators.
#
# Usage: run-rntester-tvos-simulator.sh <path to RNTester.app built for appletvsimulator>
#
# Needs an Expo login (or EXPO_TOKEN) for an account with Expo Simulators access.
# Sessions are billed to the account that owns this EAS project.

set -euo pipefail

if [[ $# -ne 1 || ! -d "$1" ]]; then
  echo "Usage: $0 <path to RNTester.app built for appletvsimulator>" >&2
  exit 1
fi

APP_PATH="$(cd "$1" && pwd)"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_ID="com.meta.RNTester.localDevelopment"
DEVICE="${RNTV_SIMULATOR_DEVICE:-Apple TV 4K (3rd generation)}"
EAS=(npx --yes eas-cli@latest)
AGENT_DEVICE=("${EAS[@]}" simulator:exec npx --yes agent-device@latest)
TARGET=(--platform ios --target tv)

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
"${EAS[@]}" simulator:start --platform ios --device "$DEVICE" --type agent-device \
  --max-duration-minutes 30 --name "RNTester tvOS smoke test" --non-interactive
trap stop_session EXIT

"${AGENT_DEVICE[@]}" install "$BUNDLE_ID" "$APP_PATH" "${TARGET[@]}"
"${AGENT_DEVICE[@]}" replay simulator/rntester-tvos-smoke.ad "${TARGET[@]}"
