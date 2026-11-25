# react-native-tvos

This repository is a fork of React Native that adds Apple TV and Android TV support. [`AGENTS.md`](AGENTS.md) covers what the fork shares with React Native; this file covers what only the fork has.

GitHub Actions are disabled in this repository. CI, builds and releases run on EAS Workflows, from the EAS project in [`tools/rntv-workflows`](tools/rntv-workflows).

## EAS workflows

Run `eas` commands from `tools/rntv-workflows`.

| Workflow | Starts on | Does |
| --- | --- | --- |
| `run-unit-tests.yml` | Pushes to `main`, and PRs to `main` that change `packages/react-native`, the other core packages, `packages/rn-tester` or `tools/rntv-workflows` | React Native lint, format check, types and Jest; `tools/rntv-workflows` Jest and type check |
| `run-builds.yml` | The same as `run-unit-tests.yml` | Apple and Android artifacts, RNTester for Apple TV, iPhone and Android TV, the TV smoke tests, and the npm tarballs, all at version `1000.0.0` |
| `run-release-builds.yml` | Pushes to `release-*` branches | The same builds at the release version; also stages the Maven artifacts on Sonatype |
| `cut-release-branch.yml` | By hand, with the `release` input | Creates the `release-<version>` branch |
| `create-release.yml` | By hand, through `src/start-release.ts` | Creates the GitHub release and stages the npm packages |

- `eas workflow:runs --workflow <file> --limit 5 --json` lists recent runs; add `--status SUCCESS` for successful ones.
- `eas workflow:view <runId> --json --non-interactive` shows a run, its jobs and their status.
- `eas workflow:run` reads inputs from stdin when stdin is open and then waits. Run it with `< /dev/null`.
- `eas workflow:logs` can print "No logs found" for a run that has logs. The Expo MCP server's `workflow_logs` tool returns them.
- Each push to a PR branch starts `run-builds.yml`, which takes a long time. Ask the maintainer before pushing only to retest.

## Build artifacts

`src/download-workflow-artifacts.ts` downloads the tarballs of a finished build run. Run it from the repository root:

```sh
tools/rntv-workflows/src/download-workflow-artifacts.ts <runId> --include all --out <dir> --non-interactive
```

- Without `<runId>`, it shows a picker of recent `run-builds.yml` and `run-release-builds.yml` runs. `--release` limits the picker to release builds, and rejects a run ID from another workflow.
- `--non-interactive` turns the picker off, so a missing run ID is an error. Always pass it from an agent.
- `--include npm` gets the npm tarballs, `--include rntester` the RNTester builds (`rntester-<version>-{appletv,iphone,androidtv}-{debug,release}.tgz`), and `--include all` both.

## Releases

A release goes through these steps. Each one creates or publishes something, so an agent does them only when the maintainer asks, and runs the dry run first.

1. Start `cut-release-branch.yml` with `release` set to the version, such as `0.89.0-0`. It creates `release-<version>`, and the push starts `run-release-builds.yml`.
2. From `tools/rntv-workflows`, run `npx tsx src/start-release.ts <runId> --non-interactive --dry-run`, with the ID of the successful `run-release-builds.yml` run. Without `--dry-run`, it starts `create-release.yml`. Options:
   - `--latest` marks the release as the latest; it is rejected for a prerelease.
   - `--npm-tag <tag>` overrides the npm dist-tag: `next` for a prerelease, `<major>.<minor>-stable` otherwise.
   - `--draft` creates the GitHub release as a draft.
   - `--ref <branch>` runs the `create-release.yml` of another branch; the default is `main`.
   - Without `--non-interactive`, it shows a picker of recent `run-release-builds.yml` runs when there is no run ID, and asks before it stages the npm packages from an existing GitHub release. With it, a missing run ID is an error, and so is staging from an existing GitHub release, which needs the maintainer to confirm it in a terminal.
3. The maintainer finishes the release by hand, as the `create-release.yml` run prints at its end:
   - Approve the staged npm versions with 2FA, with `npm stage approve` or on npmjs.com.
   - Sign in to Sonatype and publish the staged Maven artifacts.
   - With `--latest`, add the npm `latest` tag with `npm dist-tag add`.

To create only the GitHub release from a local machine, run from the repository root:

```sh
tools/rntv-workflows/src/create-release.ts <runId> --non-interactive --dry-run
```

It downloads the run's tarballs to `build/eas-artifacts/<runId>` when that directory has none, and reuses them on a second run. `--out <dir>` sets another directory.

## RNTester on TV

TV apps move focus with a remote or D-pad, not with taps. Drive them with remote presses, and read which element has focus before each press.

### Apple TV simulator

From `packages/rn-tester`, after `yarn install` at the root:

```sh
yarn clean-ios
yarn setup-tvos-hermes
yarn build-tvos-hermes
```

- The app is `packages/rn-tester/build/Build/Products/Debug-appletvsimulator/RNTester.app`, with the bundle ID `com.meta.RNTester.localDevelopment`.
- If `pod install` fails with `Cannot find module '.../node_modules/hermes-compiler/index.js'`, `node_modules/hermes-compiler` holds only the `0.0.0` placeholder. Run `yarn install` again, then repeat `yarn clean-ios` and `yarn setup-tvos-hermes`.
- `yarn setup-tvos-hermes` and `yarn install` change the Podfiles, the Xcode project, `package.json` and `yarn.lock`. Do not commit those changes.

### Android TV emulator

- `yarn build-android-hermes` in `packages/rn-tester` builds the debug APK. The application ID is `com.facebook.react.uiapp`.
- Start Metro with `yarn start` at the root, and run `adb reverse tcp:8081 tcp:8081` so the emulator can reach it.

### Smoke tests

`run-builds.yml` and `run-release-builds.yml` run the smoke tests in `tools/rntv-workflows/simulator` (`rntester-tvos-smoke.ad`, `rntester-androidtv-smoke.ad`) on Expo Simulators. The tests assume a fresh RNTester install.

`tools/rntv-workflows/scripts/run-rntester-tv-simulator.sh tvos <RNTester.app>` (or `androidtv <APK>`) runs one from a local machine. It needs an Expo login with Expo Simulators access, and the sessions are billed to the account that owns the EAS project, so ask the maintainer before running it.

## Checks for `tools/rntv-workflows`

Run these in `tools/rntv-workflows` after changing it:

| Command | Checks |
| --- | --- |
| `yarn test` | Jest tests in `src/**/__tests__`. The root `yarn test` does not run them. |
| `yarn typecheck` | `tsc --noEmit`. `tsconfig.json` excludes `__tests__`. |
| `yarn lint` | ESLint, with `--max-warnings 0` |
| `eas workflow:validate .eas/workflows/<file>` | A changed workflow file. It does not catch every input error: each job `env` value must be a string, so wrap a boolean input in `toJSON()`. |
| `shellcheck scripts/<script>.sh` | A changed shell script |

`tools/rntv-workflows/scripts/run-tv-unit-tests.sh`, run from the repository root, runs the React Native checks of `run-unit-tests.yml`. It passes `-u` to Jest and `--update` to `featureflags-check`, so review the snapshot and feature flag changes it makes.
