/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  HostComponent,
  InternalInstanceHandle,
  Node,
} from '../Renderer/shims/ReactNativeTypes';
import type ReactFabricHostComponent from './ReactFabricPublicInstance/ReactFabricHostComponent';
import type {ElementRef, ElementType} from 'react';

import {
  onCaughtError,
  onRecoverableError,
  onUncaughtError,
} from '../../src/private/renderer/errorhandling/ErrorHandlers';
import {type RootTag} from './RootTag';
export function renderElement({
  element,
  rootTag,
  useFabric,
  useConcurrentRoot,
}: {
  element: React.MixedElement,
  rootTag: number,
  useFabric: boolean,
  useConcurrentRoot: boolean,
}): void {
  if (useFabric) {
    require('../Renderer/shims/ReactFabric').render(
      element,
      rootTag,
      null,
      useConcurrentRoot,
      {
        onCaughtError,
        onUncaughtError,
        onRecoverableError,
      },
    );
  } else {
    require('../Renderer/shims/ReactNative').render(
      element,
      rootTag,
      undefined,
      {
        onCaughtError,
        onUncaughtError,
        onRecoverableError,
      },
    );
  }
}

export function findHostInstance_DEPRECATED<TElementType: ElementType>(
  componentOrHandle: ?(ElementRef<TElementType> | number),
): ?ElementRef<HostComponent<mixed>> {
  return require('../Renderer/shims/ReactNative').findHostInstance_DEPRECATED(
    componentOrHandle,
  );
}

export function findNodeHandle<TElementType: ElementType>(
  componentOrHandle: ?(ElementRef<TElementType> | number),
  suppressWarning: ?boolean,
): ?number {
  return require('../Renderer/shims/ReactNative').findNodeHandle(
    componentOrHandle,
    suppressWarning ?? false,
  );
}

export function dispatchCommand(
  handle: ElementRef<HostComponent<mixed>>,
  command: string,
  args: Array<mixed>,
): void {
  if (global.RN$Bridgeless === true) {
    // Note: this function has the same implementation in the legacy and new renderer.
    // However, evaluating the old renderer comes with some side effects.
    return require('../Renderer/shims/ReactFabric').dispatchCommand(
      handle,
      command,
      args,
    );
  } else {
    return require('../Renderer/shims/ReactNative').dispatchCommand(
      handle,
      command,
      args,
    );
  }
}

export function sendAccessibilityEvent(
  handle: ElementRef<HostComponent<mixed>>,
  eventType: string,
): void {
  return require('../Renderer/shims/ReactNative').sendAccessibilityEvent(
    handle,
    eventType,
  );
}

/**
 * This method is used by AppRegistry to unmount a root when using the old
 * React Native renderer (Paper).
 */
export function unmountComponentAtNodeAndRemoveContainer(rootTag: RootTag) {
  // $FlowExpectedError[incompatible-type] rootTag is an opaque type so we can't really cast it as is.
  const rootTagAsNumber: number = rootTag;
  require('../Renderer/shims/ReactNative').unmountComponentAtNodeAndRemoveContainer(
    rootTagAsNumber,
  );
}

export function unstable_batchedUpdates<T>(
  fn: T => void,
  bookkeeping: T,
): void {
  // This doesn't actually do anything when batching updates for a Fabric root.
  return require('../Renderer/shims/ReactNative').unstable_batchedUpdates(
    fn,
    bookkeeping,
  );
}

export function isProfilingRenderer(): boolean {
  return Boolean(__DEV__);
}

export function isChildPublicInstance(
  parentInstance: ReactFabricHostComponent | HostComponent<mixed>,
  childInstance: ReactFabricHostComponent | HostComponent<mixed>,
): boolean {
  return require('../Renderer/shims/ReactNative').isChildPublicInstance(
    parentInstance,
    childInstance,
  );
}

export function getNodeFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): ?Node {
  // This is only available in Fabric
  return require('../Renderer/shims/ReactFabric').getNodeFromInternalInstanceHandle(
    internalInstanceHandle,
  );
}

export function getPublicInstanceFromInternalInstanceHandle(
  internalInstanceHandle: InternalInstanceHandle,
): mixed /*PublicInstance | PublicTextInstance | null*/ {
  // This is only available in Fabric
  return require('../Renderer/shims/ReactFabric').getPublicInstanceFromInternalInstanceHandle(
    internalInstanceHandle,
  );
}
