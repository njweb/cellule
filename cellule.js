( function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(function () {
      return factory(root);
    });
  } else if (typeof module === "object" && module.exports) {
    // Node, or CommonJS-Like environments
    module.exports = factory(this);
  } else {
    // Browser globals
    root.cellule = factory(root);
  }
}(this, function (gobal, undefined) {

  var isObject = function (obj) {return typeof obj === 'object';};
  var isFunc = function (obj) {return typeof obj === 'function';};
  var isString = function (obj) {return (typeof obj === 'string' || obj instanceof String);};

  var isState = function (obj) {throw new Error('todo: implement')};
  var isInput = function (obj) {throw new Error('todo: implement')};

  var initPlaceholderFunctions = {
    transition: function () {
      throw new Error('Don\'t call transition during cellule object construction')
    },
    overrideTransition: function () {
      throw new Error('Don\'t call overrideTransition during cellule object construction');
    },
    input: function () {
      throw new Error('Don\'t call input during cellule object construction')
    }
  };

  var validateAsFunction = function (value) {
    if (!isFunc(value)) throw new Error('Value must be a function');
  };
  var validateAsFunctionOrString = function (value) {
    if (!isFunc(value) && !isString(value)) { throw new Error('Value must be a function or a string');}
  };
  var definePropertyIfUndefined = function (obj, propertyName, value, objName) {
    if (obj[propertyName] !== undefined) throw new Error(['Cannot redefine', propertyName, 'on', objName].join(' '));
    obj[propertyName] = value;
  };
  var buildForConstructorObject = function () {
    var stateConstructorArray = [];
    var inputConstructorArray = [];

    var statesProperty = {};
    var inputsProperty = {};

    var initialState = null;

    var forState = function (stateName) {
      var stateConstructionData = [{name: stateName, handlers: []}];
      stateConstructorArray.push([stateConstructionData]);
      return {
        and: function (stateName) {
          stateConstructionData.push({name: stateName, handlers: []});
          return this;
        },
        onEnter: function (func) {
          stateConstructionData.forEach(function (state) {state.onEnter = func;});
          return this;
        },
        onExit: function (func) {
          stateConstructionData.forEach(function (state) {state.onExit = func;});
          return this;
        },
        defaultHandler: function (func) {
          stateConstructionData.forEach(function (state) {state.default = func;});
          return this;
        },
        handle: function (inputName) {
          var self = this;
          var handlers = [{input: inputName}];
          return {
            and: function (inputName) {
              handlers.push({input: inputName});
              return this;
            },
            with: function (op) {
              handlers.forEach(function (handler) {
                handler.op = op;
                stateConstructionData.forEach(function (state) {
                  state.handlers.push(handler);
                });
              });
              return self;
            }
          };
        },
        setAsInitialState: function () {
          if (stateConstructionData.length > 1) throw new Error('Cannot set two states as the initial state');
          if (initialState !== null) throw new Error('Initial state has already been set');
          initialState = stateConstructionData[0].name;
        }
      }
    };
    var forInput = function (inputName) {
      var inputConstructionData = [{name: inputName}];
      inputConstructorArray.push(inputConstructionData);
      return {
        and: function (inputName) {
          inputConstructionData.push({name: inputName});
          return this;
        },
        shouldActivate: function (func) {
          inputConstructionData.forEach(function (input) {
            definePropertyIfUndefined(input, 'shouldActivate', func, 'input: ' + input.name);
          });
          return this;
        },
        onActivate: function (func) {
          inputConstructionData.forEach(function (input) {
            definePropertyIfUndefined(input, 'onActivate', func, 'input: ' + input.name);
          });
          return this;
        }
      };
    };
    var unpackConstructorArrays = function () {
      stateConstructorArray.forEach(function (nestedA) {
        nestedA.forEach(function (nestedB) {
          nestedB.forEach(function (partialState) {
            if (statesProperty[partialState.name] === undefined) {
              statesProperty[partialState.name] = {name: partialState.name, handlers: {}};
            }
            var state = statesProperty[partialState.name];
            if (partialState.default !== undefined) {
              definePropertyIfUndefined(
                state,
                'default',
                partialState.default,
                'state: ' + partialState.name
              );
            }
            if (partialState.onEnter !== undefined) {
              definePropertyIfUndefined(
                state,
                'onEnter',
                partialState.onEnter,
                'state: ' + partialState.name
              );
            }
            if (partialState.onExit !== undefined) {
              definePropertyIfUndefined(
                state,
                'onExit',
                partialState.onExit,
                'state: ' + partialState.name
              );
            }
            partialState.handlers.forEach(function (handler) {
              statesProperty[partialState.name].handlers[handler.input] = handler.op;
              if (inputsProperty[handler.input] === undefined) inputsProperty[handler.input] = {name: handler.input};
            });
          });
        });
      });
      inputConstructorArray.forEach(function (nested) {
        nested.forEach(function (partialInput) {
          if (inputsProperty[partialInput.name] === undefined) {
            inputsProperty[partialInput.name] = {name: partialInput.name};
          }
          var input = inputsProperty[partialInput.name];
          if (partialInput.shouldActivate !== undefined) {
            if (input.shouldActivate !== undefined) {
              throw new Error('Cannot redefine "shouldActivate" handler on input: ' + partialInput.name);
            }
            input.shouldActivate = partialInput.shouldActivate;
          }
          if (partialInput.onActivate !== undefined) {
            if (inputs.onActivate !== undefined) {
              throw new Error('Cannot redefine "onActivate" handler on input: ' + partialInput.name);
            }
            input.onActivate = partialInput.onActivate;
          }
        });
      });
      if (!isObject(statesProperty[initialState])) throw new Error('An initial state must be declared');


      return {
        states: statesProperty,
        inputs: inputsProperty,
        initialState: statesProperty[initialState]
      };
    };
    return {
      forState: forState,
      forInput: forInput,
      unpackConstructorArrays: unpackConstructorArrays
    };
  };

  var validateInitializedCelluleObject = function (celluleObject) {
    if (celluleObject._states !== undefined) throw new Error('');
    if (celluleObject._inputs !== undefined) throw new Error('');
    if (celluleObject.on !== undefined) throw new Error('');

    if (celluleObject.transition !== initPlaceholderFunctions.transition) throw new Error('');
    if (celluleObject.overrideTransition !== initPlaceholderFunctions.overrideTransition) throw new Error('');
    if (celluleObject.input !== initPlaceholderFunctions.input) throw new Error('');

    var defaultHandler = celluleObject.defaultHandler;
    if (defaultHandler !== undefined && !isFunc(defaultHandler)) throw new Error('');

    var beforeTransition = celluleObject.beforeTransition;
    if (beforeTransition !== undefined && !isFunc(beforeTransition)) throw new Error('');
  };

  var cellule = {
    create: function (params) {
      if (!isObject(params)) throw new Error('Must provide a params object as the first argument');
      if (params.init === undefined) throw new Error('Must provide an initializer function as property "init"');
      if (!isFunc(params.init)) throw new Error('Init property must be a function');

      var constructor = buildForConstructorObject();
      var _for = {
        state: constructor.forState,
        input: constructor.forInput
      };

      var celluleObject = {

        transition: initPlaceholderFunctions.transition,
        overrideTransition: initPlaceholderFunctions.overrideTransition,
        input: initPlaceholderFunctions.input,

        for: _for
      };

      params.init.call(celluleObject);

      validateInitializedCelluleObject(celluleObject);

      celluleObject.input = function (inputName, message) {
        var msg = message;
        var input = celluleObject._inputs[inputName];
        if (input !== undefined) {
          if (input.shouldActivate !== undefined) {
            if (!input.shouldActivate(msg)) return;
          }
          if (input.onActivate !== undefined) {
            input.onActivate(msg);
          }
        }

        var handler = celluleObject._currentState.handlers[inputName];
        var _default = celluleObject._currentState.default;
        if (handler !== undefined) {
          if (isFunc(handler)) { return handler(msg);}
          else if (isString(handler)) {return celluleObject.transition(handler);}
        } else if (_default !== undefined) {
          return _default(msg);
        }
      };

      celluleObject.transition = function (stateName) {
        if (celluleObject._states[stateName] !== undefined) {
          var oldState = celluleObject._currentState;
          celluleObject._currentState = celluleObject._states[stateName];
          if (celluleObject._currentState.onEnter !== undefined) {
            celluleObject._currentState.onEnter();
          }
          if (oldState.onExit !== undefined) {
            oldState.onExit();
          }
          return celluleObject._currentState.name;
        }
        return undefined;
      };

      var constructedProperties = constructor.unpackConstructorArrays();
      celluleObject._currentState = constructedProperties.initialState;
      celluleObject._states = constructedProperties.states;
      celluleObject._inputs = constructedProperties.inputs;

      celluleObject.on = {};
      for (var prop in celluleObject._inputs) {
        celluleObject.on[prop] = function (msg) {
          celluleObject.input(prop, msg);
        }
      }

      return celluleObject;
    },
    hasState: function (celluleObject, stateName) {
      if (!isObject(celluleObject) || !isObject(celluleObject._states)) {
        throw new Error('Must provide a cellule object');
      }
      if (!isString(stateName)) {
        throw new Error('Must provide a state name');
      }
      return celluleObject._states[stateName] !== undefined;
    },
    hasInput: function (celluleObject, inputName) {
      if (!isObject(celluleObject) || !isObject(celluleObject._states)) {
        throw new Error('Must provide a cellule object');
      }
      if (!isString(inputName)) {
        throw new Error('Must provide a state name');
      }
      return celluleObject._inputs[inputName] !== undefined;
    },
    getCurrentStateName: function (celluleObject) {
      return celluleObject._currentState.name;
    }
  };

  return cellule; //TODO export cellule obj...
}));