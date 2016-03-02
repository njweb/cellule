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

  var cellule = {
    mask: function (obj, mask) {
      var masked = Object.create(Object.getPrototypeOf(obj));
      for (var prop in mask) {
        if (isFunction(mask[prop])) { masked[prop] = mask[prop]; }
      }
      masked.__celluleOriginalObject = obj;
      masked.__celluleMaskObject = mask;
      Object.getOwnPropertyNames(obj).forEach(function (prop) {
        if (!masked.hasOwnProperty(prop)) {
          if (isFunction(prop)) { masked[prop] = obj[prop];}
          else {
            Object.defineProperty(masked, prop, {
              get: function () { return masked.__celluleOriginalObject[prop];},
              set: function (value) { masked.__celluleOriginalObject[prop] = value; },
              enumerable: true
            });
          }
        }
      });
      return masked;
    },
    unmask: function (maskedObj) {
      return maskedObj.__celluleOriginalObject;
    },
    replaceMask: function (maskedObj, nextMask) {
      return this.mask(this.unmask(maskedObj), nextMask);
    },
    runMasked: function (obj, mask, func) {
      var masked = this.mask(obj, mask);
      func.call(null, masked);
      return this.unmask(masked);
    }
  };

  return cellule;
}));