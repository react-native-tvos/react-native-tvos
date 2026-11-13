#!/usr/bin/env bash
# Runs the RNTester TV smoke test on an Apple TV or Android TV device in Expo Simulators.
#
# Usage: run-rntester-tv-simulator.sh tvos <path to RNTester.app built for appletvsimulator> [output dir]
#        run-rntester-tv-simulator.sh androidtv <path to the x86_64 RNTester APK> [output dir]
#
# The output dir (default: simulator/output/<platform>) receives the runner log, screenshots,
# agent-device diagnostics and, on tvOS, the app logs from the session.
#
# Needs an Expo login (or EXPO_TOKEN) for an account with Expo Simulators access.
# Sessions are billed to the account that owns this EAS project.

set -euo pipefail

usage() {
  echo "Usage: $0 tvos <path to RNTester.app built for appletvsimulator> [output dir]" >&2
  echo "       $0 androidtv <path to the x86_64 RNTester APK> [output dir]" >&2
  exit 1
}

[[ ($# -eq 2 || $# -eq 3) && -e "$2" ]] || usage

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
OUTPUT_DIR="${3:-$PROJECT_DIR/simulator/output/$1}"
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"
SCRIPT="simulator/rntester-$1-smoke.ad"
EAS=(npx --yes eas-cli@latest)
AGENT_DEVICE=("${EAS[@]}" simulator:exec npx --yes agent-device@latest)
TARGET=(--platform "$PLATFORM" --target tv)
DIAGNOSTICS_DIR="$HOME/.agent-device/remote-diagnostics"
SESSION_ID=""
STARTED_MARKER="$(mktemp)"
PARTS_DIR="$(mktemp -d)"

cd "$PROJECT_DIR"
exec > >(tee -a "$OUTPUT_DIR/runner.log") 2>&1

if ! "${EAS[@]}" simulator:availability --json --non-interactive | grep -q '"available": *true'; then
  echo "Expo Simulators is not available for this account. It needs a paid EAS plan." >&2
  exit 1
fi

reset_dotenv() {
  printf '# managed by eas-cli\n' > .env.eas-simulator
}

collect_diagnostics() {
  [[ -d "$DIAGNOSTICS_DIR" ]] || return 0
  local file
  find "$DIAGNOSTICS_DIR" -type f -newer "$STARTED_MARKER" | while read -r file; do
    mkdir -p "$OUTPUT_DIR/agent-device-diagnostics"
    cp "$file" "$OUTPUT_DIR/agent-device-diagnostics/"
  done
}

stop_session() {
  "${EAS[@]}" simulator:stop --non-interactive || true
  reset_dotenv
  if [[ "$PLATFORM" == "ios" && -n "$SESSION_ID" ]]; then
    download_app_logs
  fi
  collect_diagnostics
}

# The app logs of a stopped session become available a short time after it stops.
download_app_logs() {
  local attempt
  for attempt in 1 2 3 4 5 6; do
    sleep 20
    if "${EAS[@]}" simulator:logs --id "$SESSION_ID" --output "$OUTPUT_DIR/app-logs.ndjson" \
      --non-interactive; then
      return 0
    fi
  done
  echo "The app logs of session $SESSION_ID were not available after $((attempt * 20))s." >&2
}

# Splits the script at "# screenshot <name>" lines. Each part starts with the script's context
# line, and replays in the same agent-device session as the part before it.
split_script() {
  awk -v dir="$PARTS_DIR" '
    NR == 1 { header = $0; part = 1; print header > (dir "/part-1.ad"); next }
    /^# screenshot / {
      print $3 > (dir "/screenshots")
      part++
      print header > (dir "/part-" part ".ad")
      next
    }
    { print > (dir "/part-" part ".ad") }
  ' "$SCRIPT"
}

reset_dotenv
"${EAS[@]}" simulator:start --platform "$PLATFORM" "${DEVICE_ARGS[@]}" --type agent-device \
  --max-duration-minutes 30 --name "RNTester $1 smoke test" --non-interactive
trap stop_session EXIT
SESSION_ID="$("${EAS[@]}" simulator:get --json --non-interactive |
  node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => console.log(JSON.parse(s).id ?? ""))')"

"${AGENT_DEVICE[@]}" install "$BUNDLE_ID" "$APP_PATH" "${TARGET[@]}"

# Screenshots are taken between replays, because a screenshot step inside a remote replay saves
# its file on the daemon host.
split_script
part=1
while [[ -f "$PARTS_DIR/part-$part.ad" ]]; do
  if ! "${AGENT_DEVICE[@]}" replay "$PARTS_DIR/part-$part.ad" "${TARGET[@]}"; then
    "${AGENT_DEVICE[@]}" screenshot "$OUTPUT_DIR/failure.png" "${TARGET[@]}" || true
    exit 1
  fi
  screenshot_name="$(sed -n "${part}p" "$PARTS_DIR/screenshots" 2> /dev/null || true)"
  if [[ -n "$screenshot_name" ]]; then
    "${AGENT_DEVICE[@]}" screenshot "$OUTPUT_DIR/$screenshot_name.png" "${TARGET[@]}"
  fi
  part=$((part + 1))
done
