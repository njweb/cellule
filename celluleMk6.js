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

  var buildFluentInterface  = function (instance) {

    var fluentInterface = {
      onStateChanged: function (predicate) {
        instance.onStateChanged = predicate;
        return fluentInterface;
      },
      exceptWhen: function (predicate) {
        exception = {predicate: predicate};
        return exceptionInterface;
      },
      done: function () {
        instance.rootApi = rebindFunctions(instance.rootApi, instance);
        instance.exceptions.forEach(function (exception) {
          exception.api = rebindFunctions(exception.api, instance);
        });
        return instance;
      }
    };

    var exception;
    var exceptionInterface = {
      then: function (exceptionApi) {
          exception.api = exceptionApi;
          instance.exceptions.push(exception);
        return fluentInterface;
      }
    };

    return fluentInterface;
  };

  var bindArgs = function(instance, args){
    var boundArgs;
    if(args.length < 2){
      boundArgs = [instance, args[0]];
    } else {
      boundArgs = [instance];
      for (var i = 0, len = args.length; i < len; i += 1) {
        boundArgs.push(args[i]);
      }
    }
    return boundArgs;
  };

  var bindFunction = function (instance, predicate) {
    return function(){
      return predicate.apply(null, bindArgs(instance, arguments));
    };
  };

  var rebindFunctions = function (source, instance) {
    var target = {};
    var keys = Object.getOwnPropertyNames(source);
    for(var i = 0, len = keys.length; i < len; i += 1){
      var key = keys[i];
      if(isFunction(source[key])){
        target[key] = bindFunction(instance, source[key]);
      }
    }
    return target;
  };

  var forEachOwnProperty = function (obj, predicate) {
    var keys = Object.getOwnPropertyNames(obj);
    for(var i = 0, len = keys.length; i < len; i += 1){
      predicate(obj[keys[i]], keys[i], obj);
    }
  };

  var maskFunctions = function(source, target, mask){
    if(Array.isArray(mask)) {
      forEachOwnProperty(source, function (prop, key) {
        mask.forEach(function (m) {
          if(isFunction(m[key])){
            target[key] = m[key];
          }
        });
        if(target[key] === undefined){
          target[key] = source[key];
        }
      });
    }else {
      forEachOwnProperty(source, function (prop, key) {
        if(isFunction(mask[key])){
          target[key] = mask[key];
        } else {
          target[key] = source[key];
        }
      });
    }
    return target;
  };

  var buildApi = function (instance, state) {
    var activeExceptionApis = [];
    for(var i = 0, len = instance.exceptions.length; i < len; i += 1){
      var exception = instance.exceptions[i];
      if(isFunction(exception.predicate)){
        if(exception.predicate(state) === true){
          activeExceptionApis.push(exception.api);
        }
      } else if(exception.predicate === state){
        activeExceptionApis.push(exception.api);
      }
    }
    return maskFunctions(instance.rootApi, {}, activeExceptionApis, instance);
  };

  var cellule = function (rootApi) {

    var celluleInstance = {
      rootApi: rootApi,
      exceptions: [],
      forState: function (state) {
        return buildApi(this, state);
      },
      setState: function (nextState) {
        return this.onStateChanged(nextState, this);
      }
    };

    return buildFluentInterface(celluleInstance);
  };

  return cellule;
}));