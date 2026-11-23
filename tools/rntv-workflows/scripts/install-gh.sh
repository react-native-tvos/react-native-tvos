#!/usr/bin/env bash
# Install a pinned GitHub CLI to ~/.local/bin on a Linux EAS worker, which
# has no gh.
set -euo pipefail

gh_version=2.103.3
gh_archive="gh_${gh_version}_linux_amd64.tar.gz"
gh_sha256=4c806978ffce1cec70853302a56d70ac6da4f19bae7adca4e1a8ab00633dd91d

cd "$(mktemp -d)"
curl -fsSLO "https://github.com/cli/cli/releases/download/v${gh_version}/${gh_archive}"
echo "${gh_sha256}  ${gh_archive}" | sha256sum --check
tar -xzf "$gh_archive"
mkdir -p "$HOME/.local/bin"
mv "gh_${gh_version}_linux_amd64/bin/gh" "$HOME/.local/bin/gh"
