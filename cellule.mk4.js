var isFunction = function (value) {return typeof value === 'function';};
var isString = function (obj) {return (typeof obj === 'string' || obj instanceof String);};

var getOverrideTargets = function (celluleObject) {
  var originalObject = Object.getPrototypeOf(celluleObject);
  return Object.getOwnPropertyNames(originalObject).filter(function (prop) {
    return isFunction(originalObject[prop]);
  }).map(function (prop) {
    return {
      func: originalObject[prop],
      prop: prop
    };
  });
};

var resolveTargetFunctionNames = function (overrideTargets, validTargets) {
  return overrideTargets.map(function (target) {
    var result = validTargets.filter(function (valid) {
      if (isFunction(target)) return valid.func === target;
      else return valid.prop === target;
    });
    return result.length > 0 ? result[0] : null;
  }).filter(function (result) {
    return result !== null;
  });
};

var _getFunctionPropertyNames = function(sourceObject, propertyValues){
  var propertyNames = [];
  var sourceFunctionProperties = Object.getOwnPropertyNames(sourceObject).map(function(prop){
    if(isFunction(sourceObject[prop])) return {func: sourceObject[prop], prop: prop};
    else return null;
  }).filter(function(value){
    return value !== null;
  });
  propertyValues.forEach(function(prop){
    if(isFunction(prop)) {
      var result = null;
      for(var i = 0, len = sourceFunctionProperties.length; i < len; i+=1){
        if(prop === sourceFunctionProperties[i].func){ result = sourceFunctionProperties[i].prop; break;}
      }
      if(result !== null) propertyNames.push(result);
    } else if(isString(prop)){
      if(isFunction(sourceObject[prop])) propertyNames.push(prop);
    }
  });
};

var overrideTool = function (targetFunctions, overrideFunction) {
  if (!isFunction(overrideFunction)) {
    throw new Error('Must provide a function to be used to override the target functions');
  }
  if (!Array.isArray(targetFunctions)) targetFunctions = [targetFunctions];

  var resolvedTargets = resolveTargetFunctionNames(targetFunctions, getOverrideTargets(this.celluleObject));
  if (resolvedTargets.length !== targetFunctions.length) {
    throw new Error('All functions you\'re attempting to override must be on the source object');
  }

  console.log('this.targetStates: ', this.targetStates); //TODO remove
  console.log('resolved targets', resolvedTargets); //TODO remove
  var self = this;
  this.targetStates.forEach(function (state) {
    resolvedTargets.forEach(function (target) {
      if (self.celluleObject.__celluleStates[state] === undefined) {
        self.celluleObject.__celluleStates[state] = {};
      }
      self.celluleObject.__celluleStates[state][target.prop] = overrideFunction;
    });
  });
};

var bindFunctionToTool = function (configureTool, func) {
  return func.bind(null, configureTool);
};

var buildConfigureTool = function (celluleObject) {
  var configureTool = {
    celluleObject: celluleObject,
    targetStates: [],
    whenState: function (stateNames) {
      this.targetStates = this.targetStates.concat(stateNames);
      var self = this;
      return {override: overrideTool.bind(self)};
    }
  };
  return configureTool;
};

var buildCelluleObjectFromObject = function (sourceObject) {
  var celluleObject = Object.create(sourceObject);

  Object.getOwnPropertyNames(sourceObject).map(function (prop) {
    if (typeof sourceObject[prop] !== 'function') {celluleObject[prop] = sourceObject[prop];}
  });

  return celluleObject;
};

var cellule = {
  setup: function (originalObject) {
    var celluleObject = buildCelluleObjectFromObject(originalObject);
    celluleObject.__celluleStates = {};
    celluleObject.__celluleCurrentState = null;
    return celluleObject;
  },
  configure: function (celluleObject) { return buildConfigureTool(celluleObject); },
  transition: function (celluleObject, stateName) {
    console.log(celluleObject.__celluleStates); //TODO remove

    var nextState = celluleObject.__celluleStates[stateName];
    if (nextState !== undefined) {

      Object.getOwnPropertyNames(celluleObject).forEach(function (prop) {
        if (isFunction(celluleObject[prop])) delete celluleObject[prop];
      });

      Object.getOwnPropertyNames(nextState).forEach(function(prop){
        celluleObject[prop] = nextState[prop];
      });

      celluleObject.__celluleCurrentState = stateName;
    }
  }
};

module.exports = cellule;