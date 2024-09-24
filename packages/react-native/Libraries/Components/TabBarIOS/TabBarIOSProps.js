/*
 * @flow
 */

import type { ViewProps } from '../View/ViewPropTypes';

export type TabBarIOSProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * Color of text on unselected tabs
   */
  unselectedTintColor?: string,

  /**
   * Color of the currently selected tab icon
   */
  tintColor?: string,

  /**
   * Color of unselected tab icons. Available since iOS 10.
   */
  unselectedItemTintColor?: string,

  /**
   * Background color of the tab bar
   */
  barTintColor?: string,

  /**
   * The style of the tab bar. Supported values are 'default', 'black'.
   * Use 'black' instead of setting `barTintColor` to black. This produces
   * a tab bar with the native iOS style with higher translucency.
   */
  barStyle?: ?('default' | 'black'),

  /**
   * A Boolean value that indicates whether the tab bar is translucent
   */
  translucent?: ?boolean,

  /**
   * Specifies tab bar item positioning. Available values are:
   * - fill - distributes items across the entire width of the tab bar
   * - center - centers item in the available tab bar space
   * - auto (default) - distributes items dynamically according to the
   * user interface idiom. In a horizontally compact environment (e.g. iPhone 5)
   * this value defaults to `fill`, in a horizontally regular one (e.g. iPad)
   * it defaults to center.
   */
  itemPositioning?: ?('fill' | 'center' | 'auto'),
|}>;
