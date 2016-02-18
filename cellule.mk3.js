var isObject = function (obj) {return typeof obj === 'object';};
var isFunction = function (obj) {return typeof obj === 'function';};

var cellule = function(originalObject, setupFunction){
  if(!isObject(originalObject)) throw new Error('Must pass in an object as the first argument');
  if(!isFunction(setupFunction)) throw new Error('Must pass in a function as the second argument');
  var celluleObject = Object.create(originalObject);
  var celluleTools = {
    whenState: function(stateName){
      return {
        on: function(targetFunction){
          var overrideTool = {
            do: function(overrideFunction){ return overrideTool; },
            firstDo: function(firstFunction){ return overrideTool; },
            alseDo: function(alsoFunction){ return overrideTool; }
          };
          return overrideTool;
        },
        overrideWith: function(overrideObject){

        }
      }
    }
  };
  setupFunction.call(null, celluleTools, celluleObject);
  return celluleObject;
};

module.exports = cellule;