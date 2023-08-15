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

import flattenStyle from '../../StyleSheet/flattenStyle';
import TextAncestor from '../../Text/TextAncestor';
import {getAccessibilityRoleFromRole} from '../../Utilities/AcessibilityMapping';
import ViewNativeComponent from './ViewNativeComponent';
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
  React.ElementRef<typeof ViewNativeComponent>,
> = React.forwardRef(
  (
    {
      accessibilityElementsHidden,
      accessibilityLabel,
      accessibilityLabelledBy,
      accessibilityLiveRegion,
      accessibilityRole,
      accessibilityState,
      accessibilityValue,
      'aria-busy': ariaBusy,
      'aria-checked': ariaChecked,
      'aria-disabled': ariaDisabled,
      'aria-expanded': ariaExpanded,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-live': ariaLive,
      'aria-selected': ariaSelected,
      'aria-valuemax': ariaValueMax,
      'aria-valuemin': ariaValueMin,
      'aria-valuenow': ariaValueNow,
      'aria-valuetext': ariaValueText,
      focusable,
      id,
      importantForAccessibility,
      nativeID,
      pointerEvents,
      role,
      tabIndex,
      ...otherProps
    }: ViewProps,
    forwardedRef,
  ) => {
    const _accessibilityLabelledBy =
      ariaLabelledBy?.split(/\s*,\s*/g) ?? accessibilityLabelledBy;

    let _accessibilityState;
    if (
      accessibilityState != null ||
      ariaBusy != null ||
      ariaChecked != null ||
      ariaDisabled != null ||
      ariaExpanded != null ||
      ariaSelected != null
    ) {
      _accessibilityState = {
        busy: ariaBusy ?? accessibilityState?.busy,
        checked: ariaChecked ?? accessibilityState?.checked,
        disabled: ariaDisabled ?? accessibilityState?.disabled,
        expanded: ariaExpanded ?? accessibilityState?.expanded,
        selected: ariaSelected ?? accessibilityState?.selected,
      };
    }
    let _accessibilityValue;
    if (
      accessibilityValue != null ||
      ariaValueMax != null ||
      ariaValueMin != null ||
      ariaValueNow != null ||
      ariaValueText != null
    ) {
      _accessibilityValue = {
        max: ariaValueMax ?? accessibilityValue?.max,
        min: ariaValueMin ?? accessibilityValue?.min,
        now: ariaValueNow ?? accessibilityValue?.now,
        text: ariaValueText ?? accessibilityValue?.text,
      };
    }

    // $FlowFixMe[underconstrained-implicit-instantiation]
    let style = flattenStyle(otherProps.style);

    const newPointerEvents = style?.pointerEvents || pointerEvents;

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
        <ViewNativeComponent
          {...otherProps}
          accessibilityLiveRegion={
            ariaLive === 'off' ? 'none' : ariaLive ?? accessibilityLiveRegion
          }
          accessibilityLabel={ariaLabel ?? accessibilityLabel}
          focusable={tabIndex !== undefined ? !tabIndex : focusable}
          accessibilityState={_accessibilityState}
          accessibilityRole={
            role ? getAccessibilityRoleFromRole(role) : accessibilityRole
          }
          accessibilityElementsHidden={
            ariaHidden ?? accessibilityElementsHidden
          }
          accessibilityLabelledBy={_accessibilityLabelledBy}
          accessibilityValue={_accessibilityValue}
          importantForAccessibility={
            ariaHidden === true
              ? 'no-hide-descendants'
              : importantForAccessibility
          }
          nativeID={id ?? nativeID}
          style={style}
          pointerEvents={newPointerEvents}
          ref={_setNativeRef}
        />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
