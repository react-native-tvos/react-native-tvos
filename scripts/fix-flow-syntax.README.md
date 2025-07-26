# Flow Syntax Fix Script

## Purpose

This script fixes Flow v0.233.0 syntax that Metro bundler cannot parse in React Native 0.79.5 and later versions.

## Problem

React Native 0.79.5 upgraded to Flow v0.233.0 which introduced new syntax features:
- Mapped types: `[K in keyof Type]`
- Type assertions: `expression as Type`
- Component syntax: `component(...)`

Metro bundler's current parser cannot handle these constructs, causing build failures.

## Solution

This script automatically transforms incompatible Flow syntax to Metro-compatible equivalents.

## Usage

### Manual execution:
```bash
node scripts/fix-flow-syntax.js
```

### Automatic execution:
The script runs automatically during `yarn install` via postinstall hook.

## What it fixes

1. **Mapped type syntax**
   ```javascript
   // Before: [K in keyof TEventToArgsMap]: Set<Registration<TEventToArgsMap[K]>>
   // After:  [key: string]: Set<Registration<any>>
   ```

2. **Type assertions**
   ```javascript
   // Before: )(scrollProps) as ExactReactElement_DEPRECATED<any>,
   // After:  )(scrollProps),
   ```

3. **Component syntax**
   ```javascript
   // Before: const MyComponent: component(...) = React.forwardRef
   // After:  const MyComponent = React.forwardRef
   ```

## Files affected

- `packages/react-native/Libraries/**/*.js`
- `packages/virtualized-lists/**/*.js`

## Temporary solution

This is a temporary workaround until:
1. Metro bundler adds support for Flow v0.233.0 syntax
2. React Native migrates affected files to TypeScript
3. Flow syntax is updated in React Native core

## Contributing

If you encounter additional Flow syntax issues:
1. Add the pattern to this script
2. Test the fix thoroughly
3. Submit a PR with the enhancement