/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from './ViewPropTypes';

import ViewNativeComponent from './ViewNativeComponent';
import TextAncestor from '../../Text/TextAncestor';
import * as React from 'react';
import {Commands} from './ViewNativeComponent';

import setAndForwardRef from '../../Utilities/setAndForwardRef';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view
 */
type ViewImperativeMethods = $ReadOnly<{
  requestTVFocus: () => void,
}>;

const View: React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof ViewNativeComponent> & ViewImperativeMethods,
> = React.forwardRef((props: ViewProps, forwardedRef) => {
  const viewRef = React.useRef<?React.ElementRef<typeof View>>(null);

  const requestTVFocus = React.useCallback(() => {
    if (viewRef.current) {
      Commands.requestTVFocus(viewRef.current);
    }
  }, []);

  const _setNativeRef = setAndForwardRef({
    getForwardedRef: () => forwardedRef,
    setLocalRef: ref => {
      viewRef.current = ref;

      // This is a hack. Ideally we would forwardRef to the underlying
      // host component. However, since TVFocusGuide has its own methods that can be
      // called as well, if we used the standard forwardRef then these
      // methods wouldn't be accessible
      //
      // Here we mutate the ref, so that the user can use the standart native
      // methods like `measureLayout()` etc. while also having access to
      // imperative methods of this component like `requestTVFocus()`.
      if (ref) {
        ref.requestTVFocus = requestTVFocus;
      }
    },
  });

  return (
    <TextAncestor.Provider value={false}>
      <ViewNativeComponent {...props} ref={_setNativeRef} />
    </TextAncestor.Provider>
  );
});

View.displayName = 'View';

module.exports = View;
