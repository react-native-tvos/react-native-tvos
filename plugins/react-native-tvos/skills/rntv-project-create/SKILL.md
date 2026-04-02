---
name: rntv-project-create
description: Use when creating a new React Native TV project for Apple TV or Android TV, setting up package.json for react-native-tvos, or choosing between Expo and Community CLI for TV development.
version: 1.0.0
license: MIT
---

# TV Project Setup

## When to Use

- Creating a new React Native project targeting Apple TV or Android TV
- Configuring `package.json` to use `react-native-tvos` instead of core `react-native`
- Choosing between Expo and Community CLI for a TV project
- Setting up an existing project for TV support

## When NOT to Use

- Building a mobile-only (phone/tablet) React Native app — use standard React Native or Expo setup instead

## Package Configuration

To use this package, change your `package.json` to alias `react-native` to `react-native-tvos`:

```json
{
  "dependencies": {
    "react-native": "npm:react-native-tvos@latest"
  }
}
```

You **cannot** use this package and the core `react-native` package simultaneously in a project.

## Versioning

Releases follow the `0.xx.x-y` format:
- `x` digits correspond to the upstream React Native core release (e.g., `0.81.0`)
- `y` is the additional version number from this repo (e.g., `0.81.0-0`)

Latest versions: https://www.npmjs.com/package/react-native-tvos?activeTab=versions

## Option 1: Expo (Recommended)

As of React Native 0.75.x, the core team recommends Expo for new projects. Using Expo's [continuous native generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/) model, projects can build either mobile or TV apps from the same codebase.

To create a new project with Expo Router (similar to a project created from Expo's default new project template), use the `with-router-tv` template from the Expo examples repository:

```
yarn create expo TVProject -e with-router-tv
```

Similar commands can be used for new projects with other package managers, as described in Expo documentation.

For more details on Expo projects for TV, see the [Building Expo apps for TV](https://docs.expo.dev/guides/building-for-tv/) guide.

## Option 2: Community CLI

Use the [template-tv](https://github.com/react-native-tvos/template-tv) template, which extends the Community CLI with `run-tvos`, `build-tvos`, and `log-tvos` commands.

> This template only supports Apple TV and Android TV. Multiple platform targets are no longer supported in React Native app Podfiles.

### Quick Start

```sh
# Initialize a new app (run outside any existing node project)
npx @react-native-community/cli@latest init TVTest --template @react-native-tvos/template-tv

cd TVTest

# Build and run on tvOS Simulator (macOS only, requires Apple TV simulator)
npx react-native run-tvos --simulator "Apple TV"

# Build and run on Android TV emulator
npx react-native run-android --device tv_api_31
```

> **Warning:** Do not globally install `react-native` or `react-native-tvos`. This may cause errors like `ld: library not found for -lPods-TestApp-tvOS`.

We strongly recommend [Yarn](https://classic.yarnpkg.com/en/docs/install) as the package manager.

## Minimum OS Versions

| Platform | Minimum Version |
|---|---|
| iPhone and iPad | iOS 15.1 |
| Apple TV | tvOS 15.1 |
| Android / Android TV (0.77 releases) | API level 22 |
| Android / Android TV (0.78+) | API level 24 |
