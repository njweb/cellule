var isObject = function (obj) {return typeof obj === 'object';};
var isFunction = function (obj) {return typeof obj === 'function';};
var isString = function (obj) {return (typeof obj === 'string' || obj instanceof String);};
var findIndex = function (collection, predicate) {
  var index = 0, len = collection.length, location = -1;
  while (index < len && location === -1) {
    if (predicate(collection[index])) {
      location = index;
    }
  }
  return location;
};

var withTool = function (instructions, states, overrideValue, functionValue) {
  if (isFunction(functionValue)) {
    states.forEach(function (s) {
      instructions.push({
        state: s,
        override: overrideValue,
        mask: functionValue
      });
    })
  } else throw new Error('Provided argument must be a function');
};

var overrideTool = function (instructions, states, overrideValue) {
  if (isFunction(overrideValue) || isString(overrideValue)) {
    return {
      with: withTool.bind(null, instructions, states, overrideValue)
    };
  } else throw new Error('overrideValue argument must be a function or string');
};

var firstTool = function (instructions, states, alterValue, functionValue) {
  if (isFunction(functionValue)) {
    states.forEach(function (s) {
      instructions.push({
        state: s,
        alter: alterValue,
        before: functionValue
      });
    });
  } else throw new Error('Provided argument must be a function');
};

var alsoTool = function (instructions, states, alterValue, functionValue) {
  if (isFunction(functionValue)) {
    states.forEach(function (s) {
      instructions.push({
        state: s,
        alter: alterValue,
        after: functionValue
      });
    });
  } else throw new Error('Provided argument must be a function');
};

var alterTool = function (instructions, states, alterValue) {
  if (isFunction(alterValue) || isString(alterValue)) {
    return {
      firstDo: firstTool.bind(null, instructions, states, alterValue),
      alsoDo: alsoTool.bind(null, instructions, states, alterValue)
    };
  } else throw new Error('The value you are attempting to alter must be a function or string');
};

var applyMaskTool = function (instructions, states, maskObj) {
  if (isObject(maskObj)) {
    states.forEach(function (s) {
      Object.getOwnPropertyNames(maskObj).forEach(function (prop) {
        if (isFunction(maskObj[prop])) {
          instructions.push({
            state: s,
            override: prop,
            mask: maskObj[prop]
          });
        } else throw new Error('The overriding properties must be a functions');
      });
    })
  } else throw new Error('The provided argument must be an object');
};

var whenStateTool = function (instructions, stateNames) {
  var states = [];
  if (Array.isArray(stateNames)) { states = stateNames; }
  else { states = [stateNames]; }

  return {
    override: overrideTool.bind(null, instructions, states),
    alter: alterTool.bind(null, instructions, states),
    applyMask: applyMaskTool.bind(null, instructions, states)
  };
};

var constructCelluleTool = function (instructions) {

  var initialState = null;

  var overrideTool = function () {
    var instruction = instructions[instructions.length - 1];
    var tool = function (targetFunction) {
      return {
        with: function (maskFunction) {
          instruction.operations.push({
            target: targetFunction,
            mask: maskFunction
          });
          return tool;
        }
      };
    };
    return tool;
  };
  var alterTool = function () {};

  return {
    whenState: whenStateTool.bind(null, instructions),
    setInitialState: function (stateName) {
      if (isString(stateName)) {
        instructions.push({initialState: stateName});
      }
    }
  }
};

var unpackInstructions = function (instructions, maskableProperties) {
  var states = {};
  var initialState = null;
  instructions.forEach(function (i) {
    if (isFunction(i.override)) {
      var index = findIndex(maskableProperties, function (prop) { return prop.func === i.override; });
      if (index === -1) throw new Error('Attempting to override nonexistent function');
      else i.override = maskableProperties[index].propName;
    }
    else if (isFunction(i.alter)) {
      var index = findIndex(maskableProperties, function (prop) { return prop.func === i.alter; });
      if (index === -1) throw new Error('Attempting to alter nonexistent function');
      else i.alter = maskableProperties[index].propName;
    }
  });
  instructions.forEach(function (i) {
    if (states[i.state] === undefined) states[i.state] = {};
    if (isString(i.override)) {
      states[i.state][i.override] = i.mask;
    }
    else if (isString(i.alter)) {
      if (states[i.state][i.alter] === undefined) {states[i.state][i.alter] = {};}
      if (isFunction(i.before)) {
        states[i.state][i.alter].before = i.before;
      }
      else if (isFunction(i.after)) {
        states[i.state][i.alter].after = i.after;
      }
    }
    else if (isString(i.initialState)) {
      initialState = i.initialState;
    }
  });
  return {
    states: states,
    initialState: initialState
  };
};

var cellule = {
  setup: function (originalObject, setupFunction) {
    if (!isObject(originalObject)) throw new Error('Must pass in an object as the first argument');
    if (!isFunction(setupFunction)) throw new Error('Must pass in a function as the second argument');
    var celluleObject = Object.create(originalObject);

    var maskableProperties = [];
    Object.getOwnPropertyNames(originalObject).forEach(function (prop) {
      if (isFunction(originalObject[prop])) {
        maskableProperties.push({
          func: originalObject[prop],
          propName: prop
        });
      }
    });

    var instructions = [];

    setupFunction.call(celluleObject, constructCelluleTool.call(null, instructions));

    var unpacked = unpackInstructions(instructions, maskableProperties);
    celluleObject.__celluleStates = unpacked.states;
    celluleObject.__celluleCurrentState = null;

    if (isString(unpacked.initialState)) {
      cellule.transitionOverride(celluleObject, unpacked.initialState);
    }

    return celluleObject;
  },
  transition: function (celluleObject, nextState) {
    cellule.transitionOverride(celluleObject, nextState);
  },
  transitionOverride: function (celluleObject, nextState) {
    if (!celluleObject.__celluleStates)throw new Error("Must call this function on a cellule object");

    var nextStateObj = celluleObject.__celluleStates[nextState];
    if (!nextStateObj) throw new Error("Must transition to an existing state");

    Object.getOwnPropertyNames(celluleObject).forEach(function (prop) {
      if (isFunction(celluleObject[prop])) delete celluleObject[prop];
    });

    Object.getOwnPropertyNames(nextStateObj).forEach(function (prop) {

      if (isFunction(nextStateObj[prop])) { celluleObject[prop] = nextStateObj[prop]; }
      else if (isObject(nextStateObj[prop])) {
        celluleObject[prop] = function () {
          if (isFunction(nextStateObj[prop].before)) { nextStateObj[prop].before.apply(celluleObject, arguments); }
          var result = Object.getPrototypeOf(celluleObject)[prop].apply(celluleObject, arguments);
          if (isFunction(nextStateObj[prop].after)) { nextStateObj[prop].after.apply(celluleObject, arguments); }
          return result;
        }
      }
    });
  }
};

module.exports = cellule;