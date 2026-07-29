'use strict';

/**
 * On a release branch the react-native workspace is renamed to
 * `react-native-tvos` (see monorepoUtils.rewritePackageNamesIfNeeded), so yarn
 * hoists it as `node_modules/react-native-tvos` and the bare `react-native`
 * specifier that upstream code uses internally no longer resolves.
 *
 * Consumer apps get that name back from the
 * `"react-native": "npm:react-native-tvos@..."` alias in their own
 * package.json. This restores the equivalent link inside the monorepo so that
 * `react-native/setup-env`, `react-native/package.json` and friends keep
 * resolving after the rename. Run from the root `postinstall`.
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const linkPath = path.join(repoRoot, 'node_modules', 'react-native');
const targetPath = path.join(repoRoot, 'packages', 'react-native');
const relativeTarget = path.join('..', 'packages', 'react-native');

function lstatOrNull(target: string): fs.Stats | null {
  try {
    return fs.lstatSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function executeScript(): void {
  if (!fs.existsSync(path.join(repoRoot, 'node_modules'))) {
    return;
  }

  const existing = lstatOrNull(linkPath);

  if (existing !== null && !existing.isSymbolicLink()) {
    throw new Error(
      `${linkPath} exists but is not a symlink. Refusing to replace a real installed package. Remove it and re-run \`yarn install\`.`,
    );
  }

  if (existing !== null) {
    // existsSync follows the link, so a dangling link falls through to be
    // replaced instead of tripping EEXIST on symlinkSync below.
    if (
      fs.existsSync(linkPath) &&
      fs.realpathSync(linkPath) === fs.realpathSync(targetPath)
    ) {
      return;
    }
    fs.unlinkSync(linkPath);
  }

  fs.symlinkSync(relativeTarget, linkPath, 'dir');
  console.log(
    'Linked node_modules/react-native -> packages/react-native (tvOS package rename alias).',
  );
}

executeScript();
