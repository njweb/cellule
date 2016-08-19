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
  var isFunction = function (obj) {return typeof obj === 'function';};
  // var repackageArgs = function (celluleInternal, arguments) {
  //   var packedArgs = [celluleInternal];
  //   for(var i = 0, len = arguments.length; i < len; i += 1){
  //     packedArgs.push(arguments[i]);
  //   }
  //   return packedArgs;
  // };
  // var wrapFunction = function (celluleInternal, targetFunction) {
  //   return function () {
  //     return targetFunction.call(null, repackageArgs(celluleInternal, arguments));
  //   }
  // };
  // var copyFunctions = function (celluleInternal, source, target, onlyPreexisting)
  // {
  //   onlyPreexisting = onlyPreexisting === true;
  //   var propNames = Object.getOwnPropertyNames(source);
  //   for(var i = 0, len = propNames.length; i < len; i+=1){
  //     var propName = propNames[i];
  //     if(isFunction(source[propName]) && (!onlyPreexisting || target[propName] !== undefined)){
  //       target[propName] = wrapFunction(celluleInternal, source[propName]);
  //     }
  //   }
  //   return target;
  // };
  // var updateApi = function (celluleInstance, celluleInternals, destinationState) {
  //   copyFunctions(celluleInternals, celluleInternals.rootApi, celluleInstance);
  //   var masks = celluleInternals.masks;
  //   for(var i = 0, len = masks.length; i < len; i += 1){
  //     var shouldApplyMask = false;
  //     if(isFunction(masks[i].predicate)){
  //       shouldApplyMask = masks[i].predicate.call(null, destinationState);
  //     } else {
  //       shouldApplyMask = masks[i].predicate === destinationState;
  //     }
  //
  //     if(shouldApplyMask) {
  //       copyFunctions(celluleInternals, masks[i].api, celluleInstance, true);
  //     }
  //   }
  //   return celluleInstance;
  // };

  var buildArgs = function (context, args) {
    var repackagedArgs;
    if(args.length < 2){
     repackagedArgs = [context, args[0]];
    } else {
      repackagedArgs = [context];
      for (var i = 0, len = args.length; i < len; i += 1) {
        repackagedArgs.push(args[i]);
      }
    }
    return repackagedArgs;
  };
  var wrapFunction = function (context, predicate) {
    return function(){
      return predicate.apply(null, buildArgs(context, arguments));
    }
  };
  var buildState = function(stateDefinition, instance) {
    var state = {};
    var isRoot = false;
    var keys = Object.getOwnPropertyNames(stateDefinition);
    for(var i = 0, len = keys.length; i < len; i += 1){
      var key = keys[i];
      var prop = stateDefinition[key];
      if(key === '_isRoot' && prop === true){
        isRoot = true;
      } else if(isFunction(prop)){
        state[key] = wrapFunction(instance, prop);
      }
    }
    return {
      isRoot: isRoot,
      state: state
    };
  };

  var expressApi = function (target, state, onlyOverwrite) {
    var keys = Object.getOwnPropertyNames(state);
    for(var i = 0, len = keys.length; i < len; i += 1){
      var key = keys[i];
      if(onlyOverwrite !== true || target[key] !== undefined){
        target[key] = state[key];
      }
    }
  };

  var buildExpressedApi = function (api, celluleInstance, targetState) {
    expressApi(api, celluleInstance.rootState);
    if(targetState !== undefined) {
      expressApi(api, targetState, true);
    }
    return api;
  };

  var setRootState = function (celluleInstance, state) {
    if(celluleInstance.rootState !== undefined) throw new Error('Root state already defined');
    celluleInstance.rootState = state;
  };

  var cellule = function (definintion, configuration) {

    var celluleInstance = {
      states: {},
      setState: function (stateName) {
        if(this.states[stateName] !== undefined){
          this.api = buildExpressedApi(this.api, this, this.states[stateName]);
        }
      }
    };

    var stateNames = Object.getOwnPropertyNames(definintion);
    for(var i = 0, len = stateNames.length; i < len; i += 1){
      var apiInstance = {};
      var stateName = stateNames[i];
      var result = buildState(definintion[stateName], celluleInstance);
      celluleInstance.states[stateName] = result.state;
      if(result.isRoot === true) setRootState(celluleInstance, result.state);
    }

    celluleInstance.api = buildExpressedApi({}, celluleInstance);
    return celluleInstance.api;
  };

  return cellule;
}));