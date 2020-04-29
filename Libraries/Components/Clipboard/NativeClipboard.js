/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

import Platform from '../../Utilities/Platform';

export interface Spec extends TurboModule {
  +getConstants: () => {...};
  +getString: () => Promise<string>;
  +setString: (content: string) => void;
}

const Placeholder = {
  getConstants: () => {
    return {};
  },
  getString: () => new Promise<string>((resolve, reject) => resolve('')),
  setString: (content: string) => {},
};

const NativeClipboard: Spec = Platform.isTVOS
  ? (Placeholder: Spec)
  : (TurboModuleRegistry.getEnforcing<Spec>('Clipboard'): Spec);

export default NativeClipboard;
