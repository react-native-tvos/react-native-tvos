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

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  );
}

function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}

function _iterableToArrayLimit(arr, i) {
  var _i =
    arr == null
      ? null
      : (typeof Symbol !== 'undefined' && arr[Symbol.iterator]) ||
        arr['@@iterator'];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

const _require = require('../utils.js'),
  resolveTypeAnnotation = _require.resolveTypeAnnotation,
  getTypes = _require.getTypes,
  visit = _require.visit,
  isModuleRegistryCall = _require.isModuleRegistryCall;

const _require2 = require('./utils'),
  unwrapNullable = _require2.unwrapNullable,
  wrapNullable = _require2.wrapNullable;

const _require3 = require('./errors.js'),
  IncorrectlyParameterizedTypeScriptGenericParserError =
    _require3.IncorrectlyParameterizedTypeScriptGenericParserError,
  MisnamedModuleTypeScriptInterfaceParserError =
    _require3.MisnamedModuleTypeScriptInterfaceParserError,
  ModuleTypeScriptInterfaceNotFoundParserError =
    _require3.ModuleTypeScriptInterfaceNotFoundParserError,
  MoreThanOneModuleTypeScriptInterfaceParserError =
    _require3.MoreThanOneModuleTypeScriptInterfaceParserError,
  UnnamedFunctionParamParserError = _require3.UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError =
    _require3.UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedTypeScriptGenericParserError =
    _require3.UnsupportedTypeScriptGenericParserError,
  UnsupportedTypeScriptTypeAnnotationParserError =
    _require3.UnsupportedTypeScriptTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError =
    _require3.UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError =
    _require3.UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModulePropertyParserError =
    _require3.UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError =
    _require3.UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError =
    _require3.UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UnusedModuleTypeScriptInterfaceParserError =
    _require3.UnusedModuleTypeScriptInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError =
    _require3.MoreThanOneModuleRegistryCallsParserError,
  UntypedModuleRegistryCallParserError =
    _require3.UntypedModuleRegistryCallParserError,
  IncorrectModuleRegistryCallTypeParameterParserError =
    _require3.IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArityParserError =
    _require3.IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError =
    _require3.IncorrectModuleRegistryCallArgumentTypeParserError;

const invariant = require('invariant');

function nullGuard(fn) {
  return fn();
}

function translateTypeAnnotation(
  hasteModuleName,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeScriptTypeAnnotation,
  types,
  aliasMap,
  tryParse,
) {
  const _resolveTypeAnnotatio = resolveTypeAnnotation(
      typeScriptTypeAnnotation,
      types,
    ),
    nullable = _resolveTypeAnnotatio.nullable,
    typeAnnotation = _resolveTypeAnnotatio.typeAnnotation,
    typeAliasResolutionStatus = _resolveTypeAnnotatio.typeAliasResolutionStatus;

  switch (typeAnnotation.type) {
    case 'TSTypeReference': {
      switch (typeAnnotation.typeName.name) {
        case 'RootTag': {
          return wrapNullable(nullable, {
            type: 'ReservedTypeAnnotation',
            name: 'RootTag',
          });
        }

        case 'Promise': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
          );
          return wrapNullable(nullable, {
            type: 'PromiseTypeAnnotation',
          });
        }

        case 'Array':
        case 'ReadonlyArray': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
          );

          try {
            /**
             * TODO(T72031674): Migrate all our NativeModule specs to not use
             * invalid Array ElementTypes. Then, make the elementType a required
             * parameter.
             */
            const _unwrapNullable = unwrapNullable(
                translateTypeAnnotation(
                  hasteModuleName,
                  typeAnnotation.typeParameters.params[0],
                  types,
                  aliasMap,
                  /**
                   * TODO(T72031674): Ensure that all ParsingErrors that are thrown
                   * while parsing the array element don't get captured and collected.
                   * Why? If we detect any parsing error while parsing the element,
                   * we should default it to null down the line, here. This is
                   * the correct behaviour until we migrate all our NativeModule specs
                   * to be parseable.
                   */
                  nullGuard,
                ),
              ),
              _unwrapNullable2 = _slicedToArray(_unwrapNullable, 2),
              elementType = _unwrapNullable2[0],
              isElementTypeNullable = _unwrapNullable2[1];

            if (elementType.type === 'VoidTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'void',
              );
            }

            if (elementType.type === 'PromiseTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'Promise',
              );
            }

            if (elementType.type === 'FunctionTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'FunctionTypeAnnotation',
              );
            }

            const finalTypeAnnotation = {
              type: 'ArrayTypeAnnotation',
              elementType: wrapNullable(isElementTypeNullable, elementType),
            };
            return wrapNullable(nullable, finalTypeAnnotation);
          } catch (ex) {
            return wrapNullable(nullable, {
              type: 'ArrayTypeAnnotation',
            });
          }
        }

        case 'Readonly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
          );
          return translateTypeAnnotation(
            hasteModuleName,
            typeAnnotation.typeParameters.params[0],
            types,
            aliasMap,
            tryParse,
          );
        }

        case 'Stringish': {
          return wrapNullable(nullable, {
            type: 'StringTypeAnnotation',
          });
        }

        case 'Int32': {
          return wrapNullable(nullable, {
            type: 'Int32TypeAnnotation',
          });
        }

        case 'Double': {
          return wrapNullable(nullable, {
            type: 'DoubleTypeAnnotation',
          });
        }

        case 'Float': {
          return wrapNullable(nullable, {
            type: 'FloatTypeAnnotation',
          });
        }

        case 'UnsafeObject':
        case 'Object': {
          return wrapNullable(nullable, {
            type: 'GenericObjectTypeAnnotation',
          });
        }

        default: {
          throw new UnsupportedTypeScriptGenericParserError(
            hasteModuleName,
            typeAnnotation,
          );
        }
      }
    }

    case 'TSTypeLiteral': {
      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: typeAnnotation.members
          .map(property => {
            return tryParse(() => {
              if (property.type !== 'TSPropertySignature') {
                throw new UnsupportedObjectPropertyTypeAnnotationParserError(
                  hasteModuleName,
                  property,
                  property.type,
                );
              }

              const _property$optional = property.optional,
                optional =
                  _property$optional === void 0 ? false : _property$optional,
                key = property.key;

              const _unwrapNullable3 = unwrapNullable(
                  translateTypeAnnotation(
                    hasteModuleName,
                    property.typeAnnotation.typeAnnotation,
                    types,
                    aliasMap,
                    tryParse,
                  ),
                ),
                _unwrapNullable4 = _slicedToArray(_unwrapNullable3, 2),
                propertyTypeAnnotation = _unwrapNullable4[0],
                isPropertyNullable = _unwrapNullable4[1];

              if (propertyTypeAnnotation.type === 'FunctionTypeAnnotation') {
                throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                  hasteModuleName,
                  property.typeAnnotation.typeAnnotation,
                  property.key,
                  propertyTypeAnnotation.type,
                );
              }

              if (propertyTypeAnnotation.type === 'VoidTypeAnnotation') {
                throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                  hasteModuleName,
                  property.typeAnnotation.typeAnnotation,
                  property.key,
                  'void',
                );
              }

              if (propertyTypeAnnotation.type === 'PromiseTypeAnnotation') {
                throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                  hasteModuleName,
                  property.typeAnnotation.typeAnnotation,
                  property.key,
                  'Promise',
                );
              }

              return {
                name: key.name,
                optional,
                typeAnnotation: wrapNullable(
                  isPropertyNullable,
                  propertyTypeAnnotation,
                ),
              };
            });
          })
          .filter(Boolean),
      };

      if (!typeAliasResolutionStatus.successful) {
        return wrapNullable(nullable, objectTypeAnnotation);
      }
      /**
       * All aliases RHS are required.
       */

      aliasMap[typeAliasResolutionStatus.aliasName] = objectTypeAnnotation;
      /**
       * Nullability of type aliases is transitive.
       *
       * Consider this case:
       *
       * type Animal = ?{
       *   name: string,
       * };
       *
       * type B = Animal
       *
       * export interface Spec extends TurboModule {
       *   +greet: (animal: B) => void;
       * }
       *
       * In this case, we follow B to Animal, and then Animal to ?{name: string}.
       *
       * We:
       *   1. Replace `+greet: (animal: B) => void;` with `+greet: (animal: ?Animal) => void;`,
       *   2. Pretend that Animal = {name: string}.
       *
       * Why do we do this?
       *  1. In ObjC, we need to generate a struct called Animal, not B.
       *  2. This design is simpler than managing nullability within both the type alias usage, and the type alias RHS.
       *  3. What does it mean for a C++ struct, which is what this type alias RHS will generate, to be nullable? ¯\_(ツ)_/¯
       *     Nullability is a concept that only makes sense when talking about instances (i.e: usages) of the C++ structs.
       *     Hence, it's better to manage nullability within the actual TypeAliasTypeAnnotation nodes, and not the
       *     associated ObjectTypeAnnotations.
       */

      return wrapNullable(nullable, {
        type: 'TypeAliasTypeAnnotation',
        name: typeAliasResolutionStatus.aliasName,
      });
    }

    case 'TSBooleanKeyword': {
      return wrapNullable(nullable, {
        type: 'BooleanTypeAnnotation',
      });
    }

    case 'TSNumberKeyword': {
      return wrapNullable(nullable, {
        type: 'NumberTypeAnnotation',
      });
    }

    case 'TSVoidKeyword': {
      return wrapNullable(nullable, {
        type: 'VoidTypeAnnotation',
      });
    }

    case 'TSStringKeyword': {
      return wrapNullable(nullable, {
        type: 'StringTypeAnnotation',
      });
    }

    case 'TSFunctionType': {
      return wrapNullable(
        nullable,
        translateFunctionTypeAnnotation(
          hasteModuleName,
          typeAnnotation,
          types,
          aliasMap,
          tryParse,
        ),
      );
    }

    default: {
      throw new UnsupportedTypeScriptTypeAnnotationParserError(
        hasteModuleName,
        typeAnnotation,
      );
    }
  }
}

function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeAnnotation,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new IncorrectlyParameterizedTypeScriptGenericParserError(
      moduleName,
      typeAnnotation,
    );
  }

  invariant(
    typeAnnotation.typeParameters.type === 'TSTypeParameterInstantiation',
    "assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TSTypeParameterInstantiation'",
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new IncorrectlyParameterizedTypeScriptGenericParserError(
      moduleName,
      typeAnnotation,
    );
  }
}

function translateFunctionTypeAnnotation(
  hasteModuleName, // TODO(T108222691): Use flow-types for @babel/parser
  typescriptFunctionTypeAnnotation,
  types,
  aliasMap,
  tryParse,
) {
  const params = [];

  for (const typeScriptParam of typescriptFunctionTypeAnnotation.parameters) {
    const parsedParam = tryParse(() => {
      if (typeScriptParam.typeAnnotation == null) {
        throw new UnnamedFunctionParamParserError(
          typeScriptParam,
          hasteModuleName,
        );
      }

      const paramName = typeScriptParam.name;

      const _unwrapNullable5 = unwrapNullable(
          translateTypeAnnotation(
            hasteModuleName,
            typeScriptParam.typeAnnotation.typeAnnotation,
            types,
            aliasMap,
            tryParse,
          ),
        ),
        _unwrapNullable6 = _slicedToArray(_unwrapNullable5, 2),
        paramTypeAnnotation = _unwrapNullable6[0],
        isParamTypeAnnotationNullable = _unwrapNullable6[1];

      if (paramTypeAnnotation.type === 'VoidTypeAnnotation') {
        throw new UnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          typeScriptParam.typeAnnotation,
          paramName,
          'void',
        );
      }

      if (paramTypeAnnotation.type === 'PromiseTypeAnnotation') {
        throw new UnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          typeScriptParam.typeAnnotation,
          paramName,
          'Promise',
        );
      }

      return {
        name: typeScriptParam.name,
        optional: Boolean(typeScriptParam.optional),
        typeAnnotation: wrapNullable(
          isParamTypeAnnotationNullable,
          paramTypeAnnotation,
        ),
      };
    });

    if (parsedParam != null) {
      params.push(parsedParam);
    }
  }

  const _unwrapNullable7 = unwrapNullable(
      translateTypeAnnotation(
        hasteModuleName,
        typescriptFunctionTypeAnnotation.typeAnnotation.typeAnnotation,
        types,
        aliasMap,
        tryParse,
      ),
    ),
    _unwrapNullable8 = _slicedToArray(_unwrapNullable7, 2),
    returnTypeAnnotation = _unwrapNullable8[0],
    isReturnTypeAnnotationNullable = _unwrapNullable8[1];

  if (returnTypeAnnotation.type === 'FunctionTypeAnnotation') {
    throw new UnsupportedFunctionReturnTypeAnnotationParserError(
      hasteModuleName,
      typescriptFunctionTypeAnnotation.returnType,
      'FunctionTypeAnnotation',
    );
  }

  return {
    type: 'FunctionTypeAnnotation',
    returnTypeAnnotation: wrapNullable(
      isReturnTypeAnnotationNullable,
      returnTypeAnnotation,
    ),
    params,
  };
}

function buildPropertySchema(
  hasteModuleName, // TODO(T108222691): Use flow-types for @babel/parser
  property,
  types,
  aliasMap,
  tryParse,
) {
  let nullable = false;
  let key = property.key;
  let value =
    property.type === 'TSMethodSignature' ? property : property.typeAnnotation;
  const methodName = key.name;

  var _resolveTypeAnnotatio2 = resolveTypeAnnotation(value, types);

  nullable = _resolveTypeAnnotatio2.nullable;
  value = _resolveTypeAnnotatio2.typeAnnotation;

  if (value.type !== 'TSFunctionType' && value.type !== 'TSMethodSignature') {
    throw new UnsupportedModulePropertyParserError(
      hasteModuleName,
      property.value,
      property.key.name,
      value.type,
    );
  }

  return {
    name: methodName,
    optional: Boolean(property.optional),
    typeAnnotation: wrapNullable(
      nullable,
      translateFunctionTypeAnnotation(
        hasteModuleName,
        value,
        types,
        aliasMap,
        tryParse,
      ),
    ),
  };
}

function isModuleInterface(node) {
  return (
    node.type === 'TSInterfaceDeclaration' &&
    node.extends.length === 1 &&
    node.extends[0].type === 'TSExpressionWithTypeArguments' &&
    node.extends[0].expression.name === 'TurboModule'
  );
}

function buildModuleSchema(
  hasteModuleName,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  ast,
  tryParse,
) {
  const types = getTypes(ast);
  const moduleSpecs = Object.values(types).filter(isModuleInterface);

  if (moduleSpecs.length === 0) {
    throw new ModuleTypeScriptInterfaceNotFoundParserError(
      hasteModuleName,
      ast,
    );
  }

  if (moduleSpecs.length > 1) {
    throw new MoreThanOneModuleTypeScriptInterfaceParserError(
      hasteModuleName,
      moduleSpecs,
      moduleSpecs.map(node => node.id.name),
    );
  }

  const _moduleSpecs = _slicedToArray(moduleSpecs, 1),
    moduleSpec = _moduleSpecs[0];

  if (moduleSpec.id.name !== 'Spec') {
    throw new MisnamedModuleTypeScriptInterfaceParserError(
      hasteModuleName,
      moduleSpec.id,
    );
  } // Parse Module Names

  const moduleName = tryParse(() => {
    const callExpressions = [];
    visit(ast, {
      CallExpression(node) {
        if (isModuleRegistryCall(node)) {
          callExpressions.push(node);
        }
      },
    });

    if (callExpressions.length === 0) {
      throw new UnusedModuleTypeScriptInterfaceParserError(
        hasteModuleName,
        moduleSpec,
      );
    }

    if (callExpressions.length > 1) {
      throw new MoreThanOneModuleRegistryCallsParserError(
        hasteModuleName,
        callExpressions,
        callExpressions.length,
      );
    }

    const callExpression = callExpressions[0];
    const typeParameters = callExpression.typeParameters;
    const methodName = callExpression.callee.property.name;

    if (callExpression.arguments.length !== 1) {
      throw new IncorrectModuleRegistryCallArityParserError(
        hasteModuleName,
        callExpression,
        methodName,
        callExpression.arguments.length,
      );
    }

    if (callExpression.arguments[0].type !== 'StringLiteral') {
      const type = callExpression.arguments[0].type;
      throw new IncorrectModuleRegistryCallArgumentTypeParserError(
        hasteModuleName,
        callExpression.arguments[0],
        methodName,
        type,
      );
    }

    const $moduleName = callExpression.arguments[0].value;

    if (typeParameters == null) {
      throw new UntypedModuleRegistryCallParserError(
        hasteModuleName,
        callExpression,
        methodName,
        $moduleName,
      );
    }

    if (
      typeParameters.type !== 'TSTypeParameterInstantiation' ||
      typeParameters.params.length !== 1 ||
      typeParameters.params[0].type !== 'TSTypeReference' ||
      typeParameters.params[0].typeName.name !== 'Spec'
    ) {
      throw new IncorrectModuleRegistryCallTypeParameterParserError(
        hasteModuleName,
        typeParameters,
        methodName,
        $moduleName,
      );
    }

    return $moduleName;
  });
  const moduleNames = moduleName == null ? [] : [moduleName]; // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.

  const excludedPlatforms = [];
  const namesToValidate = [...moduleNames, hasteModuleName];
  namesToValidate.forEach(name => {
    if (name.endsWith('Android')) {
      excludedPlatforms.push('iOS');
    } else if (name.endsWith('IOS')) {
      excludedPlatforms.push('android');
    }
  }); // $FlowFixMe[missing-type-arg]

  return moduleSpec.body.body
    .filter(
      property =>
        property.type === 'TSMethodSignature' ||
        property.type === 'TSPropertySignature',
    )
    .map(property => {
      const aliasMap = {};
      return tryParse(() => ({
        aliasMap: aliasMap,
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          tryParse,
        ),
      }));
    })
    .filter(Boolean)
    .reduce(
      (moduleSchema, {aliasMap, propertyShape}) => {
        return {
          type: 'NativeModule',
          aliases: _objectSpread(
            _objectSpread({}, moduleSchema.aliases),
            aliasMap,
          ),
          spec: {
            properties: [...moduleSchema.spec.properties, propertyShape],
          },
          moduleNames: moduleSchema.moduleNames,
          excludedPlatforms: moduleSchema.excludedPlatforms,
        };
      },
      {
        type: 'NativeModule',
        aliases: {},
        spec: {
          properties: [],
        },
        moduleNames: moduleNames,
        excludedPlatforms:
          excludedPlatforms.length !== 0 ? [...excludedPlatforms] : undefined,
      },
    );
}

module.exports = {
  buildModuleSchema,
};
