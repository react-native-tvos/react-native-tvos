/**
 * Copyright (c) Douglas Lowder.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

const React = require('react');
const ScrollView = require('../ScrollView/ScrollView');
const TVEventHandler = require('./TVEventHandler');
const findNodeHandle = require('../../Renderer/shims/ReactNative')
  .findNodeHandle;

import typeof Props from '../ScrollView/ScrollView';

/**
 * Convenience wrapper to create a scroll view that will scroll correctly
 * using swipe gestures on tvOS, even if the scroll view has no focusable
 * subviews.
 *
 * The main use case would be when a large scrolling block of text needs
 * to be presented to the user.
 *
 * Props:
 *
 */

class TVTextScrollView extends React.Component<{
  ...Props,
  /**
   * The duration of the scroll animation when a swipe is detected.
   * Default value is 0.3 s
   */
  scrollDuration?: number,
  /**
   * Scrolling distance when a swipe is detected
   * Default value is half the visible height (vertical scroller)
   * or width (horizontal scroller)
   */
  pageSize?: number,
  /**
   * If true, will scroll to start when focus moves out past the beginning
   * of the scroller
   * Defaults to true
   */
  snapToStart?: boolean,
  /**
   * If true, will scroll to end when focus moves out past the end of the
   * scroller
   * Defaults to true
   */
  snapToEnd?: boolean,
  /**
   * Called when the scroller comes into focus (e.g. for highlighting)
   */
  onFocus?: (evt: Event) => void,
  /**
   * Called when the scroller goes out of focus
   */
  onBlur?: (evt: Event) => void,
}> {
  _tvEventHandler: ?TVEventHandler;

  componentDidMount() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      const myTag = findNodeHandle(cmp);
      evt.dispatchConfig = {};
      if (myTag === evt.tag) {
        if (evt.eventType === 'focus') {
          cmp.props.onFocus && cmp.props.onFocus(evt);
        } else if (evt.eventType === 'blur') {
          cmp.props.onBlur && cmp.props.onBlur(evt);
        }
      }
    });
  }

  componentWillUnmount() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  }

  render(): React.Node | React.Element<string> {
    const props: $FlowFixMe = {
      ...this.props,
      tvParallaxProperties: {
        pressDuration: this.props.scrollDuration || 0.0,
      },
      isTVSelectable: true,
      snapToInterval: this.props.pageSize || 0.0,
      removeClippedSubviews: false,
      automaticallyAdjustContentInsets: false,
    };
    return <ScrollView {...props}>{this.props.children}</ScrollView>;
  }
}

module.exports = TVTextScrollView;
