#!/usr/bin/env bash
#
# Generate GitHub-style "What's Changed" release notes for PRs merged into the
# react-native-tvos repo between two refs (branches or tags).
#
# Filters out merge commits, version bumps, and Podfile.lock bumps. To exclude
# upstream React Native commits brought in via a merge, pass the corresponding
# upstream-tracking ref as the third argument: anything reachable from that ref
# is dropped from the changelog. As a fallback when no exclude-ref is provided,
# 5+ digit PR numbers (assumed to be facebook/react-native) are filtered out.
#
# Authors are resolved to GitHub usernames via the `gh` CLI: PRs by
# `gh pr view`, direct-pushed commits by `gh api repos/.../commits/{sha}`.
#
# Usage:
#   ./scripts/tv-changelog.sh <base-ref> [head-ref] [exclude-ref]
#
# Examples:
#   ./scripts/tv-changelog.sh release-0.83.4-2 release-0.83.6-0
#   ./scripts/tv-changelog.sh release-0.83.4-2 release-0.83.6-0 branch-v0.83.0
#   ./scripts/tv-changelog.sh v0.85.0-0   # head defaults to HEAD

set -euo pipefail

REPO="react-native-tvos/react-native-tvos"
REPO_URL="https://github.com/${REPO}"

usage() {
  local rc=${1:-1}
  local stream=2
  [[ "$rc" -eq 0 ]] && stream=1
  sed -n '3,20p' "$0" >&"$stream"
  exit "$rc"
}

for arg in "$@"; do
  case "$arg" in
    -h|--help) usage 0 ;;
  esac
done

[[ $# -lt 1 || $# -gt 3 ]] && usage
command -v gh >/dev/null 2>&1 || { echo "error: gh CLI is required (https://cli.github.com)" >&2; exit 3; }
command -v git >/dev/null 2>&1 || { echo "error: git is required" >&2; exit 3; }

BASE="$1"
HEAD="${2:-HEAD}"
EXCLUDE="${3:-}"

git rev-parse --verify "$BASE" >/dev/null 2>&1 || { echo "error: ref not found: $BASE" >&2; exit 2; }
git rev-parse --verify "$HEAD" >/dev/null 2>&1 || { echo "error: ref not found: $HEAD" >&2; exit 2; }
[[ -n "$EXCLUDE" ]] && { git rev-parse --verify "$EXCLUDE" >/dev/null 2>&1 || { echo "error: ref not found: $EXCLUDE" >&2; exit 2; }; }

declare -A author_cache

resolve_author_by_pr() {
  local pr=$1
  local key="pr:$pr"
  if [[ -n "${author_cache[$key]:-}" ]]; then printf '%s' "${author_cache[$key]}"; return; fi
  local user
  user=$(gh pr view "$pr" --repo "$REPO" --json author -q '.author.login // empty' 2>/dev/null || true)
  author_cache[$key]=$user
  printf '%s' "$user"
}

resolve_author_by_sha() {
  local sha=$1
  local key="sha:$sha"
  if [[ -n "${author_cache[$key]:-}" ]]; then printf '%s' "${author_cache[$key]}"; return; fi
  local user
  user=$(gh api "repos/${REPO}/commits/${sha}" --jq '.author.login // empty' 2>/dev/null || true)
  author_cache[$key]=$user
  printf '%s' "$user"
}

declare -a entries=()

while IFS=$'\t' read -r sha subject author_name; do
  # Skip noise.
  case "$subject" in
    "[LOCAL] Bump Podfile.lock"*|"Bump version number"*|"Release "*) continue ;;
  esac

  # Extract trailing "(#NNNN)" PR number, if any.
  pr=""
  clean_subject="$subject"
  if [[ "$subject" =~ \(#([0-9]+)\)[[:space:]]*$ ]]; then
    pr="${BASH_REMATCH[1]}"
    clean_subject="${subject% (#*)}"
  fi

  # Skip upstream RN PRs (5+ digit numbers come from facebook/react-native).
  if [[ -n "$pr" && ${#pr} -ge 5 ]]; then
    continue
  fi

  user=""
  [[ -n "$pr" ]] && user=$(resolve_author_by_pr "$pr")
  [[ -z "$user" ]] && user=$(resolve_author_by_sha "$sha")

  if [[ -n "$pr" && -n "$user" ]]; then
    entries+=("- ${clean_subject} by [@${user}](https://github.com/${user}) in [#${pr}](${REPO_URL}/pull/${pr})")
  elif [[ -n "$user" ]]; then
    entries+=("- ${clean_subject} by [@${user}](https://github.com/${user})")
  elif [[ -n "$pr" ]]; then
    entries+=("- ${clean_subject} by ${author_name} in [#${pr}](${REPO_URL}/pull/${pr})")
  else
    entries+=("- ${clean_subject} by ${author_name}")
  fi
done < <(
  git_log_args=(--no-merges --reverse --format='%H%x09%s%x09%an' "$BASE..$HEAD")
  [[ -n "$EXCLUDE" ]] && git_log_args+=(--not "$EXCLUDE")
  git log "${git_log_args[@]}"
)

echo "## What's Changed"
echo
if [[ ${#entries[@]} -eq 0 ]]; then
  echo "_No TV-specific changes between \`${BASE}\` and \`${HEAD}\`._"
else
  printf '%s\n' "${entries[@]}"
fi
echo
echo "**Full Changelog**: [\`${BASE}...${HEAD}\`](${REPO_URL}/compare/${BASE}...${HEAD})"
