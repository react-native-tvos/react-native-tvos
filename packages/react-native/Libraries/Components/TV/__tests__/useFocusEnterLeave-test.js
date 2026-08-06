/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const useFocusEnterLeave = require('../useFocusEnterLeave').default;
const {create, unmount} = require('@react-native/jest-preset/jest/renderer');
const React = require('react');

// Drives the capture handlers the hook injects. The native focus engine
// delivers focus/blur down the capture path; here we call them directly.
let handlers: $FlowFixMe = null;

function Harness(props: $FlowFixMe): null {
  handlers = useFocusEnterLeave(
    props.onFocusEnter,
    props.onFocusLeave,
    props.onFocusCapture,
    props.onBlurCapture,
  );
  return null;
}

const event: $FlowFixMe = {nativeEvent: {target: 1}};

describe('useFocusEnterLeave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    handlers = null;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires onFocusEnter once on entry and onFocusLeave once on exit', async () => {
    const onFocusEnter = jest.fn();
    const onFocusLeave = jest.fn();
    await create(
      <Harness onFocusEnter={onFocusEnter} onFocusLeave={onFocusLeave} />,
    );

    handlers.handleFocusCapture(event);
    expect(onFocusEnter).toHaveBeenCalledTimes(1);
    expect(onFocusLeave).toHaveBeenCalledTimes(0);

    handlers.handleBlurCapture(event);
    jest.runAllTimers();
    expect(onFocusLeave).toHaveBeenCalledTimes(1);
    expect(onFocusEnter).toHaveBeenCalledTimes(1);
  });

  it('does not re-fire when focus moves between descendants', async () => {
    const onFocusEnter = jest.fn();
    const onFocusLeave = jest.fn();
    await create(
      <Harness onFocusEnter={onFocusEnter} onFocusLeave={onFocusLeave} />,
    );

    handlers.handleFocusCapture(event); // focus enters child A
    expect(onFocusEnter).toHaveBeenCalledTimes(1);

    // child A -> child B in the same tick: blur then focus, no timer flush in
    // between. The incoming focus must cancel the pending leave.
    handlers.handleBlurCapture(event);
    handlers.handleFocusCapture(event);
    jest.runAllTimers();

    expect(onFocusEnter).toHaveBeenCalledTimes(1); // no second enter
    expect(onFocusLeave).toHaveBeenCalledTimes(0); // leave cancelled
  });

  it('re-fires onFocusEnter after a real leave', async () => {
    const onFocusEnter = jest.fn();
    const onFocusLeave = jest.fn();
    await create(
      <Harness onFocusEnter={onFocusEnter} onFocusLeave={onFocusLeave} />,
    );

    handlers.handleFocusCapture(event);
    handlers.handleBlurCapture(event);
    jest.runAllTimers();
    handlers.handleFocusCapture(event);

    expect(onFocusEnter).toHaveBeenCalledTimes(2);
    expect(onFocusLeave).toHaveBeenCalledTimes(1);
  });

  it('still calls user-provided onFocusCapture / onBlurCapture', async () => {
    const userFocusCapture = jest.fn();
    const userBlurCapture = jest.fn();
    await create(
      <Harness
        onFocusEnter={jest.fn()}
        onFocusCapture={userFocusCapture}
        onBlurCapture={userBlurCapture}
      />,
    );

    handlers.handleFocusCapture(event);
    handlers.handleBlurCapture(event);
    expect(userFocusCapture).toHaveBeenCalledTimes(1);
    expect(userBlurCapture).toHaveBeenCalledTimes(1);
  });

  it('clears a pending leave on unmount (state resets)', async () => {
    const onFocusLeave = jest.fn();
    const component = await create(
      <Harness onFocusEnter={jest.fn()} onFocusLeave={onFocusLeave} />,
    );

    handlers.handleFocusCapture(event);
    handlers.handleBlurCapture(event); // schedules a deferred leave
    await unmount(component);
    jest.runAllTimers();

    expect(onFocusLeave).toHaveBeenCalledTimes(0); // no leave after unmount
  });
});
