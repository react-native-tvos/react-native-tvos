'use strict';

/**
 * The tvOS fork publishes two packages under names that differ from the
 * workspace names yarn installs, and the monorepo needs both spellings of each
 * to resolve:
 *
 * - `react-native` is published as `react-native-tvos`. On a release branch
 *   the workspace is renamed to match (see
 *   monorepoUtils.rewritePackageNamesIfNeeded), so yarn hoists it as
 *   `node_modules/react-native-tvos` and the bare `react-native` specifier
 *   that upstream code uses internally stops resolving. Consumer apps get that
 *   name back from the `"react-native": "npm:react-native-tvos@..."` alias in
 *   their own package.json.
 *
 * - `@react-native/virtualized-lists` is published as
 *   `@react-native-tvos/virtualized-lists`. The fork's checked-in Libraries/
 *   sources already import the tvOS name, but the checked-in package.json
 *   files still declare the upstream one, so nothing under Libraries/Lists
 *   resolves in a plain checkout.
 *
 * Linking every name to its workspace makes both the checked-in tree and a
 * renamed release tree resolve, so internal flows (jest, lint, Metro) no
 * longer need rename-virtualized-lists.sh to be run before `yarn install`.
 * Each link is a no-op when yarn already created it. Run from the root
 * `postinstall`.
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const nodeModulesPath = path.join(repoRoot, 'node_modules');

const ALIASES: ReadonlyArray<{moduleName: string; workspace: string}> = [
  {moduleName: 'react-native', workspace: 'react-native'},
  {
    moduleName: '@react-native/virtualized-lists',
    workspace: 'virtualized-lists',
  },
  {
    moduleName: '@react-native-tvos/virtualized-lists',
    workspace: 'virtualized-lists',
  },
];

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

/**
 * Points node_modules/<moduleName> at packages/<workspace>. Returns whether
 * the link had to be created.
 */
function ensureLink(moduleName: string, workspace: string): boolean {
  const linkPath = path.join(nodeModulesPath, moduleName);
  const targetPath = path.join(repoRoot, 'packages', workspace);
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
      return false;
    }
    fs.unlinkSync(linkPath);
  }

  // Scoped names need their scope directory to exist first.
  fs.mkdirSync(path.dirname(linkPath), {recursive: true});
  fs.symlinkSync(
    path.relative(path.dirname(linkPath), targetPath),
    linkPath,
    'dir',
  );
  return true;
}

function executeScript(): void {
  if (!fs.existsSync(nodeModulesPath)) {
    return;
  }

  for (const {moduleName, workspace} of ALIASES) {
    if (ensureLink(moduleName, workspace)) {
      console.log(
        `Linked node_modules/${moduleName} -> packages/${workspace} (tvOS package name alias).`,
      );
    }
  }
}

executeScript();
