---
name: tv-platform-detection
description: Use when detecting if an app is running on a TV platform, using Platform.isTV or Platform.isTVOS, or configuring TV-specific file extensions in Metro for platform-specific code.
version: 1.0.0
license: MIT
---

# TV Platform Detection

## When to Use

- Detecting whether the app is running on a TV device
- Writing platform-specific code for TV vs. mobile
- Configuring Metro for TV-specific file extensions
- Branching logic based on Apple TV vs. Android TV

## Platform API

```javascript
import { Platform } from 'react-native';

// Detect any TV device (Apple TV or Android TV)
const isTV = Platform.isTV;

// Detect specifically Apple TV (tvOS), excluding Android TV
const isAppleTV = Platform.isTVOS;
```

## TV-Specific File Extensions

The [template-tv Metro configuration](https://github.com/react-native-tvos/react-native-template-typescript-tv/blob/main/template/metro.config.js) allows Metro to resolve TV-specific source files using special file extensions:

### Resolution Order

When enabled, Metro resolves files in this order (example for `.tsx`):

1. `file.ios.tv.tsx` or `file.android.tv.tsx`
2. `file.tv.tsx`
3. `file.ios.tsx` or `file.android.tsx`
4. `file.tsx`

This works the same way for all standard extensions (`.js`, `.ts`, `.jsx`, etc.) as documented in [Metro docs](https://metrobundler.dev/docs/configuration/#sourceexts).

### Setup

This config is **not enabled by default** since it impacts bundling performance. It is available for developers who need platform-specific TV code at the file level.

To enable it, see the Metro config example in the [template-tv repository](https://github.com/react-native-tvos/react-native-template-typescript-tv/blob/main/template/metro.config.js).

## Common Patterns

### Conditional Rendering

```jsx
import { Platform, View, Text } from 'react-native';

const MyComponent = () => (
  <View>
    {Platform.isTV ? (
      <Text>TV-optimized layout</Text>
    ) : (
      <Text>Mobile layout</Text>
    )}
  </View>
);
```

### Platform-Specific Styles

```javascript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: Platform.isTV ? 40 : 16,
    fontSize: Platform.isTV ? 24 : 14,
  },
});
```

## Typescript

Typescript types for TV-specific components and APIs are available in `types/public`.
