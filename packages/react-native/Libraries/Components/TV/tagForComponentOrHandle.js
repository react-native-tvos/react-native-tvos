/*
 * Replacement for findNodeHandle, since we need this for converting
 * components to tags when rendering nextFocus props
 * @flow
 */

import * as React from 'react';

const findNodeHandle = require('../../ReactNative/RendererProxy').findNodeHandle;

export type ComponentOrHandleType = ?(React.ElementRef<React.ElementType> | number);

export type TagForComponentOrHandleType = (
    component: ComponentOrHandleType,
  ) => ?number;

const tagForComponentOrHandle: TagForComponentOrHandleType = (
  component
) => {
  if (component === null || component === undefined) {
    return undefined;
  }
  if (typeof component === 'number') {
    return component;
  }
  // Host component refs carry their tag. Reading it directly avoids
  // findNodeHandle, which warns when a class component such as
  // TouchableOpacity calls it during render.
  // $FlowFixMe[prop-missing] __nativeTag is set on Fabric host instances.
  const nativeTag = component.__nativeTag;
  if (typeof nativeTag === 'number') {
    return nativeTag;
  }
  return findNodeHandle(component);
};

export default tagForComponentOrHandle;
