/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {create, update} = require('../../../../jest/renderer');
const ReactNativeFeatureFlags = require('../../../../src/private/featureflags/ReactNativeFeatureFlags');
const ReactNative = require('../../../ReactNative/RendererProxy');
const {
  enter,
  expectRendersMatchingSnapshot,
} = require('../../../Utilities/ReactNativeTestTools');
const TextInput = require('../TextInput').default;
const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

jest.unmock('../TextInput');

[
  {useRefsForTextInputState: true, useTextChildren: true},
  {useRefsForTextInputState: false, useTextChildren: true},
  {useRefsForTextInputState: true, useTextChildren: false},
  {useRefsForTextInputState: false, useTextChildren: false},
].forEach(testCase => {
  const {useRefsForTextInputState, useTextChildren} = testCase;
  describe(`TextInput tests (useRefsForTextInputState = ${useRefsForTextInputState}) useTextChildren = ${useTextChildren}`, () => {
    let input;
    let inputRef;
    let onChangeListener;
    let onChangeTextListener;
    const initialValue = 'initialValue';
    beforeEach(async () => {
      jest.resetModules();
      ReactNativeFeatureFlags.override({
        useRefsForTextInputState: () => useRefsForTextInputState,
      });

      inputRef = React.createRef(null);
      onChangeListener = jest.fn();
      onChangeTextListener = jest.fn();

      function TextInputWrapper() {
        const [state, setState] = React.useState({text: initialValue});

        return (
          <TextInput
            ref={inputRef}
            value={useTextChildren ? undefined : state.text}
            onChangeText={text => {
              onChangeTextListener(text);
              setState({text});
            }}
            onChange={event => {
              onChangeListener(event);
            }}>
            {useTextChildren ? state.text : undefined}
          </TextInput>
        );
      }
      const renderTree = await create(<TextInputWrapper />);
      input = renderTree.root.findByType(TextInput);
    });

    it('has expected instance functions', () => {
      expect(inputRef.current.isFocused).toBeInstanceOf(Function); // Would have prevented S168585
      expect(inputRef.current.clear).toBeInstanceOf(Function);
      expect(inputRef.current.focus).toBeInstanceOf(jest.fn().constructor);
      expect(inputRef.current.blur).toBeInstanceOf(jest.fn().constructor);
      expect(inputRef.current.setNativeProps).toBeInstanceOf(
        jest.fn().constructor,
      );
      expect(inputRef.current.measure).toBeInstanceOf(jest.fn().constructor);
      expect(inputRef.current.measureInWindow).toBeInstanceOf(
        jest.fn().constructor,
      );
      expect(inputRef.current.measureLayout).toBeInstanceOf(
        jest.fn().constructor,
      );
    });
    it('calls onChange callbacks', () => {
      if (!useTextChildren) {
        expect(input.props.value).toBe(initialValue);
      } else {
        expect(input.props.children).toBe(initialValue);
      }
      const message = 'This is a test message';
      ReactTestRenderer.act(() => {
        enter(input, message);
      });
      if (!useTextChildren) {
        expect(input.props.value).toBe(message);
      } else {
        expect(input.props.children).toBe(message);
      }
      expect(onChangeTextListener).toHaveBeenCalledWith(message);
      expect(onChangeListener).toHaveBeenCalledWith({
        nativeEvent: {text: message},
      });
    });

    async function createTextInput(extraProps) {
      const textInputRef = React.createRef(null);
      await create(
        <TextInput
          ref={textInputRef}
          value={useTextChildren ? undefined : 'value1'}
          {...extraProps}>
          {useTextChildren ? 'value1' : undefined}
        </TextInput>,
      );
      return textInputRef;
    }

    it('focus() should not do anything if the TextInput is not editable', async () => {
      const textInputRef = await createTextInput({editable: false});
      textInputRef.current.currentProps = textInputRef.current.props;
      expect(textInputRef.current.isFocused()).toBe(false);

      TextInput.State.focusTextInput(textInputRef.current);
      expect(textInputRef.current.isFocused()).toBe(false);
    });

    it('should have support for being focused and blurred', async () => {
      const textInputRef = await createTextInput();

      expect(textInputRef.current.isFocused()).toBe(false);
      ReactNative.findNodeHandle = jest.fn().mockImplementation(ref => {
        if (ref == null) {
          return null;
        }

        if (
          ref === textInputRef.current ||
          ref === textInputRef.current.getNativeRef()
        ) {
          return 1;
        }

        return 2;
      });

      TextInput.State.focusTextInput(textInputRef.current);
      expect(textInputRef.current.isFocused()).toBe(true);
      expect(TextInput.State.currentlyFocusedInput()).toBe(
        textInputRef.current,
      );

      TextInput.State.blurTextInput(textInputRef.current);
      expect(textInputRef.current.isFocused()).toBe(false);
      expect(TextInput.State.currentlyFocusedInput()).toBe(null);
    });

    it('change selection keeps content', async () => {
      const defaultValue = 'value1';
      // create content
      let renderTree = await create(
        <TextInput
          value={useTextChildren ? undefined : defaultValue}
          position={{start: 1, end: 1}}>
          {useTextChildren ? defaultValue : undefined}
        </TextInput>,
      );
      input = renderTree.root.findByType(TextInput);
      expect(
        useTextChildren ? input.children[0].props.children : input.props.value,
      ).toBe(defaultValue);
      expect(input.props.position.start).toBe(1);
      expect(input.props.position.end).toBe(1);

      // update position
      renderTree = await update(
        renderTree,
        <TextInput
          value={useTextChildren ? undefined : defaultValue}
          position={{start: 2, end: 2}}>
          {useTextChildren ? defaultValue : undefined}
        </TextInput>,
      );
      expect(
        useTextChildren ? input.children[0].props.children : input.props.value,
      ).toBe(defaultValue);
      expect(input.props.position.start).toBe(2);
      expect(input.props.position.end).toBe(2);
    });

    it('should unfocus when other TextInput is focused', async () => {
      const textInputRe1 = React.createRef(null);
      const textInputRe2 = React.createRef(null);

      await create(
        <>
          <TextInput
            ref={textInputRe1}
            value={useTextChildren ? undefined : 'value1'}>
            {useTextChildren ? 'value1' : undefined}
          </TextInput>
          <TextInput
            ref={textInputRe2}
            value={useTextChildren ? undefined : 'value2'}>
            {useTextChildren ? 'value2' : undefined}
          </TextInput>
        </>,
      );
      ReactNative.findNodeHandle = jest.fn().mockImplementation(ref => {
        if (
          ref === textInputRe1.current ||
          ref === textInputRe1.current.getNativeRef()
        ) {
          return 1;
        }

        if (
          ref === textInputRe2.current ||
          ref === textInputRe2.current.getNativeRef()
        ) {
          return 2;
        }

        return 3;
      });

      expect(textInputRe1.current.isFocused()).toBe(false);
      expect(textInputRe2.current.isFocused()).toBe(false);

      TextInput.State.focusTextInput(textInputRe1.current);

      expect(textInputRe1.current.isFocused()).toBe(true);
      expect(textInputRe2.current.isFocused()).toBe(false);
      expect(TextInput.State.currentlyFocusedInput()).toBe(
        textInputRe1.current,
      );

      TextInput.State.focusTextInput(textInputRe2.current);

      expect(textInputRe1.current.isFocused()).toBe(false);
      expect(textInputRe2.current.isFocused()).toBe(true);
      expect(TextInput.State.currentlyFocusedInput()).toBe(
        textInputRe2.current,
      );
    });

    it('should give precedence to `textContentType` when set', async () => {
      const instance = await create(
        <TextInput autoComplete="tel" textContentType="emailAddress" />,
      );

      expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onClick={[Function]}
        onFocus={[Function]}
        onPressIn={[Function]}
        onPressOut={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        submitBehavior="blurAndSubmit"
        textContentType="emailAddress"
        underlineColorAndroid="transparent"
      />
    `);
    });

    it('should render as expected', async () => {
      await expectRendersMatchingSnapshot(
        'TextInput',
        () => <TextInput />,
        () => {
          jest.dontMock('../TextInput');
        },
      );
    });
  });

  describe('TextInput', () => {
    it('default render', async () => {
      const instance = await create(<TextInput />);

      expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onClick={[Function]}
        onFocus={[Function]}
        onPressIn={[Function]}
        onPressOut={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        submitBehavior="blurAndSubmit"
        underlineColorAndroid="transparent"
      />
    `);
    });

    it('has displayName', () => {
      expect(TextInput.displayName).toEqual('TextInput');
    });
  });

  describe('TextInput compat with web', () => {
    it('renders core props', async () => {
      const props = {
        id: 'id',
        tabIndex: 0,
        testID: 'testID',
      };

      const instance = await create(<TextInput {...props} />);

      expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        nativeID="id"
        onBlur={[Function]}
        onChange={[Function]}
        onClick={[Function]}
        onFocus={[Function]}
        onPressIn={[Function]}
        onPressOut={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        submitBehavior="blurAndSubmit"
        testID="testID"
        underlineColorAndroid="transparent"
      />
    `);
    });

    it('renders "aria-*" props', async () => {
      const props = {
        'aria-activedescendant': 'activedescendant',
        'aria-atomic': true,
        'aria-autocomplete': 'list',
        'aria-busy': true,
        'aria-checked': true,
        'aria-columncount': 5,
        'aria-columnindex': 3,
        'aria-columnspan': 2,
        'aria-controls': 'controls',
        'aria-current': 'current',
        'aria-describedby': 'describedby',
        'aria-details': 'details',
        'aria-disabled': true,
        'aria-errormessage': 'errormessage',
        'aria-expanded': true,
        'aria-flowto': 'flowto',
        'aria-haspopup': true,
        'aria-hidden': true,
        'aria-invalid': true,
        'aria-keyshortcuts': 'Cmd+S',
        'aria-label': 'label',
        'aria-labelledby': 'labelledby',
        'aria-level': 3,
        'aria-live': 'polite',
        'aria-modal': true,
        'aria-multiline': true,
        'aria-multiselectable': true,
        'aria-orientation': 'portrait',
        'aria-owns': 'owns',
        'aria-placeholder': 'placeholder',
        'aria-posinset': 5,
        'aria-pressed': true,
        'aria-readonly': true,
        'aria-required': true,
        role: 'main',
        'aria-roledescription': 'roledescription',
        'aria-rowcount': 5,
        'aria-rowindex': 3,
        'aria-rowspan': 3,
        'aria-selected': true,
        'aria-setsize': 5,
        'aria-sort': 'ascending',
        'aria-valuemax': 5,
        'aria-valuemin': 0,
        'aria-valuenow': 3,
        'aria-valuetext': '3',
      };

      const instance = await create(<TextInput {...props} />);

      expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessibilityState={
          Object {
            "busy": true,
            "checked": true,
            "disabled": true,
            "expanded": true,
            "selected": true,
          }
        }
        accessible={true}
        allowFontScaling={true}
        aria-activedescendant="activedescendant"
        aria-atomic={true}
        aria-autocomplete="list"
        aria-columncount={5}
        aria-columnindex={3}
        aria-columnspan={2}
        aria-controls="controls"
        aria-current="current"
        aria-describedby="describedby"
        aria-details="details"
        aria-errormessage="errormessage"
        aria-flowto="flowto"
        aria-haspopup={true}
        aria-hidden={true}
        aria-invalid={true}
        aria-keyshortcuts="Cmd+S"
        aria-label="label"
        aria-labelledby="labelledby"
        aria-level={3}
        aria-live="polite"
        aria-modal={true}
        aria-multiline={true}
        aria-multiselectable={true}
        aria-orientation="portrait"
        aria-owns="owns"
        aria-placeholder="placeholder"
        aria-posinset={5}
        aria-pressed={true}
        aria-readonly={true}
        aria-required={true}
        aria-roledescription="roledescription"
        aria-rowcount={5}
        aria-rowindex={3}
        aria-rowspan={3}
        aria-setsize={5}
        aria-sort="ascending"
        aria-valuemax={5}
        aria-valuemin={0}
        aria-valuenow={3}
        aria-valuetext="3"
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onClick={[Function]}
        onFocus={[Function]}
        onPressIn={[Function]}
        onPressOut={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        role="main"
        selection={null}
        submitBehavior="blurAndSubmit"
        underlineColorAndroid="transparent"
      />
    `);
    });

    it('renders styles', async () => {
      const style = {
        display: 'flex',
        flex: 1,
        backgroundColor: 'white',
        marginInlineStart: 10,
        userSelect: 'none',
        verticalAlign: 'middle',
      };

      const instance = await create(<TextInput style={style} />);

      expect(instance.toJSON()).toMatchInlineSnapshot(`
      <RCTSinglelineTextInputView
        accessible={true}
        allowFontScaling={true}
        focusable={true}
        forwardedRef={null}
        mostRecentEventCount={0}
        onBlur={[Function]}
        onChange={[Function]}
        onClick={[Function]}
        onFocus={[Function]}
        onPressIn={[Function]}
        onPressOut={[Function]}
        onResponderGrant={[Function]}
        onResponderMove={[Function]}
        onResponderRelease={[Function]}
        onResponderTerminate={[Function]}
        onResponderTerminationRequest={[Function]}
        onScroll={[Function]}
        onSelectionChange={[Function]}
        onSelectionChangeShouldSetResponder={[Function]}
        onStartShouldSetResponder={[Function]}
        rejectResponderTermination={true}
        selection={null}
        style={
          Array [
            Object {
              "backgroundColor": "white",
              "display": "flex",
              "flex": 1,
              "marginInlineStart": 10,
              "userSelect": "none",
              "verticalAlign": "middle",
            },
            Object {
              "textAlignVertical": "center",
              "verticalAlign": undefined,
            },
          ]
        }
        submitBehavior="blurAndSubmit"
        underlineColorAndroid="transparent"
      />
    `);
    });
  });
});
