/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */
'use strict';

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly &&
      (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })),
      keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2
      ? ownKeys(Object(source), !0).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(
          target,
          Object.getOwnPropertyDescriptors(source),
        )
      : ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(
            target,
            key,
            Object.getOwnPropertyDescriptor(source, key),
          );
        });
  }
  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

const _require = require('./commands'),
  getCommands = _require.getCommands;

const _require2 = require('./events'),
  getEvents = _require2.getEvents;

const _require3 = require('./props'),
  getProps = _require3.getProps,
  getPropProperties = _require3.getPropProperties;

const _require4 = require('./options'),
  getCommandOptions = _require4.getCommandOptions,
  getOptions = _require4.getOptions;

const _require5 = require('./extends'),
  getExtendsProps = _require5.getExtendsProps,
  removeKnownExtends = _require5.removeKnownExtends;

const _require6 = require('../utils'),
  getTypes = _require6.getTypes;

function findComponentConfig(ast) {
  const foundConfigs = [];
  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );
  defaultExports.forEach(statement => {
    let declaration = statement.declaration; // codegenNativeComponent can be nested inside a cast
    // expression so we need to go one level deeper

    if (declaration.type === 'TSAsExpression') {
      declaration = declaration.expression;
    }

    try {
      if (declaration.callee.name === 'codegenNativeComponent') {
        const typeArgumentParams = declaration.typeParameters.params;
        const funcArgumentParams = declaration.arguments;
        const nativeComponentType = {};
        nativeComponentType.propsTypeName = typeArgumentParams[0].typeName.name;
        nativeComponentType.componentName = funcArgumentParams[0].value;

        if (funcArgumentParams.length > 1) {
          nativeComponentType.optionsExpression = funcArgumentParams[1];
        }

        foundConfigs.push(nativeComponentType);
      }
    } catch (e) {
      // ignore
    }
  });

  if (foundConfigs.length === 0) {
    throw new Error('Could not find component config for native component');
  }

  if (foundConfigs.length > 1) {
    throw new Error('Only one component is supported per file');
  }

  const foundConfig = foundConfigs[0];
  const namedExports = ast.body.filter(
    node => node.type === 'ExportNamedDeclaration',
  );
  const commandsTypeNames = namedExports
    .map(statement => {
      let callExpression;
      let calleeName;

      try {
        callExpression = statement.declaration.declarations[0].init;
        calleeName = callExpression.callee.name;
      } catch (e) {
        return;
      }

      if (calleeName !== 'codegenNativeCommands') {
        return;
      } // const statement.declaration.declarations[0].init

      if (callExpression.arguments.length !== 1) {
        throw new Error(
          'codegenNativeCommands must be passed options including the supported commands',
        );
      }

      const typeArgumentParam = callExpression.typeParameters.params[0];

      if (typeArgumentParam.type !== 'TSTypeReference') {
        throw new Error(
          "codegenNativeCommands doesn't support inline definitions. Specify a file local type alias",
        );
      }

      return {
        commandTypeName: typeArgumentParam.typeName.name,
        commandOptionsExpression: callExpression.arguments[0],
      };
    })
    .filter(Boolean);

  if (commandsTypeNames.length > 1) {
    throw new Error('codegenNativeCommands may only be called once in a file');
  }

  return _objectSpread(
    _objectSpread({}, foundConfig),
    {},
    {
      commandTypeName:
        commandsTypeNames[0] == null
          ? null
          : commandsTypeNames[0].commandTypeName,
      commandOptionsExpression:
        commandsTypeNames[0] == null
          ? null
          : commandsTypeNames[0].commandOptionsExpression,
    },
  );
}

function getCommandProperties(commandTypeName, types, commandOptions) {
  if (commandTypeName == null) {
    return [];
  }

  const typeAlias = types[commandTypeName];

  if (typeAlias.type !== 'TSInterfaceDeclaration') {
    throw new Error(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  }

  let properties;

  try {
    properties = typeAlias.body.body;
  } catch (e) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen typescript file`,
    );
  }

  const typeScriptPropertyNames = properties
    .map(property => property && property.key && property.key.name)
    .filter(Boolean);

  if (commandOptions == null || commandOptions.supportedCommands == null) {
    throw new Error(
      'codegenNativeCommands must be given an options object with supportedCommands array',
    );
  }

  if (
    commandOptions.supportedCommands.length !==
      typeScriptPropertyNames.length ||
    !commandOptions.supportedCommands.every(supportedCommand =>
      typeScriptPropertyNames.includes(supportedCommand),
    )
  ) {
    throw new Error(
      `codegenNativeCommands expected the same supportedCommands specified in the ${commandTypeName} interface: ${typeScriptPropertyNames.join(
        ', ',
      )}`,
    );
  }

  return properties;
} // $FlowFixMe[signature-verification-failure] TODO(T108222691): Use flow-types for @babel/parser

function buildComponentSchema(ast) {
  const _findComponentConfig = findComponentConfig(ast),
    componentName = _findComponentConfig.componentName,
    propsTypeName = _findComponentConfig.propsTypeName,
    commandTypeName = _findComponentConfig.commandTypeName,
    commandOptionsExpression = _findComponentConfig.commandOptionsExpression,
    optionsExpression = _findComponentConfig.optionsExpression;

  const types = getTypes(ast);
  const propProperties = getPropProperties(propsTypeName, types);
  const commandOptions = getCommandOptions(commandOptionsExpression);
  const commandProperties = getCommandProperties(
    commandTypeName,
    types,
    commandOptions,
  );
  const extendsProps = getExtendsProps(propProperties, types);
  const options = getOptions(optionsExpression);
  const nonExtendsProps = removeKnownExtends(propProperties, types);
  const props = getProps(nonExtendsProps, types);
  const events = getEvents(propProperties, types);
  const commands = getCommands(commandProperties, types);
  return {
    filename: componentName,
    componentName,
    options,
    extendsProps,
    events,
    props,
    commands,
  };
}

module.exports = {
  buildComponentSchema,
};
