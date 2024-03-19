// Replacement for findNodeHandle, since we need this for converting
// components to tags when rendering nextFocus props
// @flow

// TODO: make this work for Fabric

const findNodeHandle = require('../../ReactNative/RendererProxy').findNodeHandle;

type TagForComponentOrHandleType = (
    component: ?(
      | {_nativeTag: ?number, canonical: ?{_nativeTag: ?number}}
      | number
    ),
  ) => ?number;

const tagForComponentOrHandle: TagForComponentOrHandleType = (
  component: ?(
    | {_nativeTag: ?number, canonical: ?{_nativeTag: ?number}}
    | number
  ),
): ?number => {
  if (component === null || component === undefined) {
    return undefined;
  }
  return findNodeHandle(component, true); // suppress warning
/*
  if (typeof component === 'number') {
    return component;
  }
  if (typeof component?._nativeTag === 'number') {
    return component?._nativeTag;
  }
  if (typeof component?.canonical?._nativeTag === 'number') {
    return component?.canonical?._nativeTag;
  }
  return undefined;
 */
};

export default tagForComponentOrHandle;
