var isFunction = function (obj) {return typeof obj === 'function';};

var recursiveUnpackFunctionsOnto = function(source, target, original){
  if(Object.getPrototypeOf(Object.getPrototypeOf(source)) !== null) {
    recursiveUnpackFunctionsOnto(Object.getPrototypeOf(source), target, original);
  }
  Object.getOwnPropertyNames(source).forEach(function(prop){
    if(isFunction(source[prop])) {
      target[prop] = source[prop].bind(original);
    }
  });
  return target;
};

var cellule = {
  mask: function(obj, mask){
    var masked = Object.create(obj);
    //Object.getOwnPropertyNames(mask).forEach(function(prop){
    //  if(isFunction(mask[prop])) {
    //    masked[prop] = mask[prop].bind(obj);
    //  }
    //});
    return recursiveUnpackFunctionsOnto(mask, masked, masked);
  },
  unmask: function(maskedObj){
    var unmasked = Object.getPrototypeOf(maskedObj);
    Object.getOwnPropertyNames(maskedObj).forEach(function(prop){
      if(!(typeof maskedObj[prop] === 'function')){
        unmasked[prop] = maskedObj[prop];
      }
    });
    return unmasked;
  },
  remask: function(maskedObj, nextMask){
    var obj = this.unmask(maskedObj);
    return this.mask(obj, nextMask);
  },
  runMasked: function(obj, mask, func){
    var masked = this.mask(obj, mask);
    func.call(null, masked);
    return this.unmask(masked);
  }
};

module.exports = cellule;