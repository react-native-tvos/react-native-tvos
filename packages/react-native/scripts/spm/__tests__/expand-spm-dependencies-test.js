/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

/**
 * Red tests for the transitive dependency expander.
 *
 * Library authors declare transitive native deps in their react-native.config.js:
 *
 *   module.exports = {
 *     dependency: { platforms: { ios: {} } },
 *     spm: { dependencies: ['react-native-test-library-common'] },
 *   };
 *
 * The expander takes the directly-autolinked deps (from autolinking.json) and
 * follows each one's spm.dependencies recursively, resolving names to package
 * roots via Node module resolution. Behavior mirrors podspec `s.dependency`:
 *
 *   - Transitive deps with iOS native code → added as autolinked targets
 *   - Transitive deps without iOS native code → silently skipped
 *   - Deduped by package name (first occurrence wins)
 *   - Cycles are detected (visited set keyed on name)
 *   - Unresolvable names throw with a clear message
 *
 * I/O is injected (readConfig, resolveDep) so the tests stay pure.
 */

const {
  defaultReadConfig,
  expandSpmDependencies,
  resolveSwiftName,
} = require('../expand-spm-dependencies');
const {toSwiftName} = require('../spm-utils');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeReadConfig(configs /*: {[string]: ?Object} */) {
  return (root /*: string */) =>
    Object.prototype.hasOwnProperty.call(configs, root) ? configs[root] : null;
}

function makeResolveDep(resolutions /*: {[string]: ?string} */) {
  return (name /*: string */) =>
    Object.prototype.hasOwnProperty.call(resolutions, name)
      ? resolutions[name]
      : null;
}

// ---------------------------------------------------------------------------
// expandSpmDependencies
// ---------------------------------------------------------------------------

describe('expandSpmDependencies', () => {
  it('returns direct deps with auto-derived swiftName when none declare spm.dependencies', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({'/a': {}}),
      resolveDep: makeResolveDep({}),
    });
    expect(result).toEqual([
      {...direct[0], swiftName: toSwiftName('a'), spmDependencies: []},
    ]);
  });

  it('pulls in one transitive dep declared by a direct dep', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/apple': {spm: {dependencies: ['common']}},
        '/common': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({common: '/common'}),
    });
    expect(result.map(d => d.name)).toEqual(['apple', 'common']);
    expect(result[1].root).toBe('/common');
    expect(result[1].platforms.ios).toBeDefined();
  });

  it('recurses through a chain (A → B → C)', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/a': {spm: {dependencies: ['b']}},
        '/b': {
          dependency: {platforms: {ios: {}}},
          spm: {dependencies: ['c']},
        },
        '/c': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({b: '/b', c: '/c'}),
    });
    expect(result.map(d => d.name)).toEqual(['a', 'b', 'c']);
  });

  it('handles cycles without infinite recursion (A → B → A)', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/a': {
          dependency: {platforms: {ios: {}}},
          spm: {dependencies: ['b']},
        },
        '/b': {
          dependency: {platforms: {ios: {}}},
          spm: {dependencies: ['a']},
        },
      }),
      resolveDep: makeResolveDep({a: '/a', b: '/b'}),
    });
    expect(result.map(d => d.name).sort()).toEqual(['a', 'b']);
  });

  it('dedups a diamond (A → X, B → X) — X appears exactly once', () => {
    const direct = [
      {name: 'a', root: '/a', platforms: {ios: {}}},
      {name: 'b', root: '/b', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/a': {spm: {dependencies: ['x']}},
        '/b': {spm: {dependencies: ['x']}},
        '/x': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({x: '/x'}),
    });
    expect(result.filter(d => d.name === 'x')).toHaveLength(1);
    expect(result.map(d => d.name).sort()).toEqual(['a', 'b', 'x']);
  });

  it('throws with a clear message when a declared transitive cannot be resolved', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    expect(() =>
      expandSpmDependencies(direct, {
        readConfig: makeReadConfig({
          '/apple': {spm: {dependencies: ['ghost']}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/ghost.*apple|apple.*ghost/i);
  });

  it('silently skips transitives that have no iOS native code (matches autolinkingDepToSpmTarget behavior)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/apple': {spm: {dependencies: ['js-only']}},
        // js-only has no dependency.platforms.ios — pure JS package
        '/js-only': {},
      }),
      resolveDep: makeResolveDep({'js-only': '/js-only'}),
    });
    expect(result.map(d => d.name)).toEqual(['apple']);
  });

  it('does not re-add a transitive that is already a direct dep (first occurrence wins)', () => {
    const direct = [
      {name: 'apple', root: '/apple', platforms: {ios: {}}},
      {name: 'common', root: '/common-direct', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/apple': {spm: {dependencies: ['common']}},
        '/common-other': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({common: '/common-other'}),
    });
    expect(result.filter(d => d.name === 'common')).toHaveLength(1);
    // The direct-dep entry should be preserved, not overwritten by the transitive
    expect(result.find(d => d.name === 'common').root).toBe('/common-direct');
  });

  // -------------------------------------------------------------------------
  // spmDependencies field: each entry should carry the names of its iOS-native
  // transitive deps, so the downstream emitter can wire SPM target-level deps
  // (e.g. apple's .target(dependencies: [.target(name: "...Common")])).
  // -------------------------------------------------------------------------

  it('attaches spmDependencies: [] when the dep declares none', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const [a] = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({'/a': {}}),
      resolveDep: makeResolveDep({}),
    });
    expect(a.spmDependencies).toEqual([]);
  });

  it('attaches spmDependencies with the declared transitive names (preserving declaration order)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const [apple, common] = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/apple': {spm: {dependencies: ['common', 'extra']}},
        '/common': {dependency: {platforms: {ios: {}}}},
        '/extra': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({common: '/common', extra: '/extra'}),
    });
    expect(apple.spmDependencies).toEqual(['common', 'extra']);
    expect(common.spmDependencies).toEqual([]);
  });

  it('omits JS-only transitives from spmDependencies (only iOS-native names appear)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const [apple] = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/apple': {spm: {dependencies: ['js-only', 'common']}},
        '/js-only': {},
        '/common': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({'js-only': '/js-only', common: '/common'}),
    });
    expect(apple.spmDependencies).toEqual(['common']);
  });

  it('records spmDependencies on both sides of a diamond (A→X, B→X)', () => {
    const direct = [
      {name: 'a', root: '/a', platforms: {ios: {}}},
      {name: 'b', root: '/b', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/a': {spm: {dependencies: ['x']}},
        '/b': {spm: {dependencies: ['x']}},
        '/x': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({x: '/x'}),
    });
    const a = result.find(d => d.name === 'a');
    const b = result.find(d => d.name === 'b');
    expect(a.spmDependencies).toEqual(['x']);
    expect(b.spmDependencies).toEqual(['x']);
  });

  it('passes the declaring dep root as the second argument to resolveDep (for Node resolution paths)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    let receivedFromRoot /*: ?string */ = null;
    expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/apple': {spm: {dependencies: ['common']}},
        '/common': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: (name, fromRoot) => {
        if (name === 'common') {
          receivedFromRoot = fromRoot;
          return '/common';
        }
        return null;
      },
    });
    expect(receivedFromRoot).toBe('/apple');
  });

  // -------------------------------------------------------------------------
  // swiftName resolution: each dep gets a Swift target name on the way out.
  // Default is toSwiftName(npmName); the dep's react-native.config.js
  // `spm.name` overrides it. Required for libraries whose import prefix
  // differs from the auto-derived name (e.g. `react-native-worklets`
  // publishes headers under `<worklets/...>`).
  // -------------------------------------------------------------------------

  it('populates swiftName via toSwiftName when no spm.name override is set', () => {
    const direct = [
      {name: 'react-native-foo', root: '/foo', platforms: {ios: {}}},
    ];
    const [foo] = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({'/foo': {}}),
      resolveDep: makeResolveDep({}),
    });
    expect(foo.swiftName).toBe(toSwiftName('react-native-foo'));
    expect(foo.swiftName).toBe('ReactNativeFoo');
  });

  it('uses spm.name as swiftName when the direct dep declares one', () => {
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
    ];
    const [w] = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({'/w': {spm: {name: 'worklets'}}}),
      resolveDep: makeResolveDep({}),
    });
    expect(w.swiftName).toBe('worklets');
  });

  it('applies spm.name override to transitive deps too', () => {
    const direct = [
      {name: 'react-native-reanimated', root: '/r', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      readConfig: makeReadConfig({
        '/r': {
          dependency: {platforms: {ios: {}}},
          spm: {name: 'reanimated', dependencies: ['react-native-worklets']},
        },
        '/w': {
          dependency: {platforms: {ios: {}}},
          spm: {name: 'worklets'},
        },
      }),
      resolveDep: makeResolveDep({'react-native-worklets': '/w'}),
    });
    const reanimated = result.find(d => d.name === 'react-native-reanimated');
    const worklets = result.find(d => d.name === 'react-native-worklets');
    expect(reanimated.swiftName).toBe('reanimated');
    expect(worklets.swiftName).toBe('worklets');
  });

  it('throws on swiftName collision between two deps (override vs auto-derived)', () => {
    // 'react-native-worklets' would auto-derive to 'ReactNativeWorklets', but
    // here a second dep overrides its spm.name to that same value.
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
      {name: 'other-package', root: '/o', platforms: {ios: {}}},
    ];
    expect(() =>
      expandSpmDependencies(direct, {
        readConfig: makeReadConfig({
          '/w': {},
          '/o': {spm: {name: 'ReactNativeWorklets'}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/ReactNativeWorklets/);
  });

  it('throws on a CASE-INSENSITIVE swiftName collision (worklets vs Worklets)', () => {
    // Distinct as exact strings, but collide as directories on the default
    // case-insensitive macOS filesystem.
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
      {name: 'other-worklets', root: '/o', platforms: {ios: {}}},
    ];
    expect(() =>
      expandSpmDependencies(direct, {
        readConfig: makeReadConfig({
          '/w': {spm: {name: 'worklets'}},
          '/o': {spm: {name: 'Worklets'}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/case/i);
  });

  it('rejects empty-string spm.name with a clear error citing the npm name', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    expect(() =>
      expandSpmDependencies(direct, {
        readConfig: makeReadConfig({'/a': {spm: {name: ''}}}),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/'a' has an invalid 'spm.name'/);
  });

  it('rejects non-string spm.name (e.g. number, object) with a clear error', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    expect(() =>
      expandSpmDependencies(direct, {
        readConfig: makeReadConfig({'/a': {spm: {name: 42}}}),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/invalid 'spm.name'/);
  });

  it('rejects spm.name with disallowed characters (spaces, slashes, dots)', () => {
    expect(() => resolveSwiftName('a', {spm: {name: 'foo bar'}})).toThrow(
      /invalid 'spm.name'/,
    );
    expect(() => resolveSwiftName('a', {spm: {name: 'foo/bar'}})).toThrow(
      /invalid 'spm.name'/,
    );
    expect(() => resolveSwiftName('a', {spm: {name: 'foo.bar'}})).toThrow(
      /invalid 'spm.name'/,
    );
  });

  it('accepts lowercase-with-hyphen and CamelCase spm.name values', () => {
    expect(resolveSwiftName('a', {spm: {name: 'reanimated'}})).toBe(
      'reanimated',
    );
    expect(resolveSwiftName('a', {spm: {name: 'hermes-engine'}})).toBe(
      'hermes-engine',
    );
    expect(resolveSwiftName('a', {spm: {name: 'RNWorklets'}})).toBe(
      'RNWorklets',
    );
    expect(resolveSwiftName('a', {spm: {name: 'react_native_foo'}})).toBe(
      'react_native_foo',
    );
  });
});

// ---------------------------------------------------------------------------
// defaultReadConfig
//
// The community CLI's own loaders disagree — sync reads named exports, async
// reads the default one — so a config that sets only `export default` must not
// be invisible here. Fixtures are transpiled by babel, so they present the
// `__esModule`/`default` interop shape; a Node namespace object from
// `require(ESM)` has no `__esModule` but exposes `.default` alongside
// enumerable named keys the same way, which is what the merge reads.
// ---------------------------------------------------------------------------

describe('defaultReadConfig', () => {
  let tmpRoot;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'spm-read-config-'),
    );
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, {recursive: true, force: true});
  });

  function writeConfig(name, source) {
    const root = path.join(tmpRoot, name);
    fs.mkdirSync(root, {recursive: true});
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({name}));
    fs.writeFileSync(path.join(root, 'react-native.config.js'), source);
    return root;
  }

  it('returns null when the library ships no config', () => {
    const root = path.join(tmpRoot, 'no-config');
    fs.mkdirSync(root, {recursive: true});
    expect(defaultReadConfig(root)).toBeNull();
  });

  it('reads a CommonJS config', () => {
    const root = writeConfig('cjs', "module.exports = {spm: {name: 'Cjs'}};\n");
    expect(defaultReadConfig(root).spm.name).toBe('Cjs');
  });

  it('unwraps an ESM config that only has a default export', () => {
    const root = writeConfig(
      'esm-default',
      "export default {spm: {name: 'EsmDefault'}};\n",
    );
    expect(defaultReadConfig(root).spm.name).toBe('EsmDefault');
  });

  it('reads an ESM config that only has named exports', () => {
    const root = writeConfig(
      'esm-named',
      "export const spm = {name: 'EsmNamed'};\n",
    );
    expect(defaultReadConfig(root).spm.name).toBe('EsmNamed');
  });

  it('prefers the named export when a config ships both (the PowerSync shape)', () => {
    const root = writeConfig(
      'esm-both',
      "export const spm = {name: 'Named'};\n" +
        "export default {spm: {name: 'Default'}, dependency: {platforms: {ios: {}}}};\n",
    );
    const config = defaultReadConfig(root);
    expect(config.spm.name).toBe('Named');
    // Only the merge satisfies this: `dependency` exists on the default export
    // alone, so reading the module raw would miss it.
    expect(config.dependency.platforms.ios).toEqual({});
  });

  it('keeps sibling keys of the default export (dependency.platforms.ios)', () => {
    const root = writeConfig(
      'esm-siblings',
      "export default {dependency: {platforms: {ios: {}}}, spm: {name: 'Siblings'}};\n",
    );
    const config = defaultReadConfig(root);
    expect(config.dependency.platforms.ios).toEqual({});
    expect(config.spm.name).toBe('Siblings');
  });

  it('passes a function-style config through unchanged (module.exports = () => ({...}))', () => {
    const root = writeConfig(
      'fn-style',
      "module.exports = () => ({spm: {name: 'FnStyle'}});\n",
    );
    const config = defaultReadConfig(root);
    expect(typeof config).toBe('function');
    expect(config().spm.name).toBe('FnStyle');
  });

  it('warns with the config path and the reason when the config fails to load, and returns null', () => {
    const root = writeConfig(
      'broken',
      "require('a-dev-dependency-that-is-not-installed');\n",
    );
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(defaultReadConfig(root)).toBeNull();
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).toContain(path.join(root, 'react-native.config.js'));
      expect(message).toContain('a-dev-dependency-that-is-not-installed');
    } finally {
      warnSpy.mockRestore();
    }
  });
});
