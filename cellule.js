//UMD definition derived from https://github.com/postaljs/postal.js/blob/master/src/postal.js

( function( root, factory ) {
  if ( typeof define === "function" && define.amd ) {
    // AMD. Register as an anonymous module.
    define(function() {
      return factory( root );
    } );
  } else if ( typeof module === "object" && module.exports ) {
    // Node, or CommonJS-Like environments
    module.exports = factory( this );
  } else {
    // Browser globals
    root.cellule = factory( root );
  }
}(this, function (gobal, undefined) {

  var isObj = function (obj) {return typeof obj === 'object';};
  var isFunc = function (obj) {return typeof obj === 'function';};
  var isString = function (obj) {return (typeof obj === 'string' || obj instanceof String);};

  var isState = function (obj) {return isObj(obj) && isObj(obj._handlers)};
  var isInput = function (obj) {return isObj(obj) && obj._name && isFunc(obj.activate);};

  var cellule = {
    createFsm: function (initFunc) {
      var fsm = {};
      if (isFunc(initFunc)) {
        fsm._inputs = [];

        var _convertStringToInput = function (inputStr) {return cellule.createInput(inputStr);};
        var _createInput = function (input) {
          if (isString(input)) fsm._inputs.push(_convertStringToInput(input));
          else if (isInput(input)) {fsm._inputs.push(input);}
        };

        fsm.addInput = function (input) {
          if (input !== undefined) {
            if (Array.isArray(input)) { input.forEach(function (i) {_createInput(i);})}
            else _createInput(input);
          }
          return input;
        };
        fsm.addInputs = fsm.addInput;

        initFunc.apply(fsm);

        fsm.on = {};
        fsm._inputs.forEach(function (i) {
          if (fsm.on[i.getName] !== undefined) throw new Error('Cannot install the same input twice');
          fsm.on[i.getName()] = (function () {
            var input = i;
            return function (msg) {
              var result = input.activate(msg);
              if(result) {return fsm.input(result.input, result.msg);}
              else throw new Error('Input message validation failed');
            }
          })();
        });

        delete fsm._inputs;
        delete fsm.addInput;
      } else if (isState(initFunc)) {
        fsm.initialState = initFunc;
      }

      if (isState(fsm.initialState)) { fsm._currentState = fsm.initialState }
      else fsm._currentState = null;

      if (fsm.input !== undefined) throw new Error('Cannot redefine input property on the fsm');
      if (fsm.transition !== undefined) throw new Error('Cannot redefine transition property on the fsm');

      fsm.input = function (value, msg) {
        if (this._currentState) {
          var handler = this._currentState._handlers[value];
          var dfault = this._currentState._default;
          if (isFunc(handler)) {
            return handler.call(this, msg);
          } else if (isFunc(dfault)) {
            return dfault.call(this, msg);
          }
        } else { return undefined; }
      };
      fsm.transition = function (newState) {
        if (isState(newState)) {
          var oldState = this._currentState;
          this._currentState = newState;
          if (isFunc(oldState._exit)) { oldState._exit.call(this, newState); }
          if (isFunc(newState._enter)) { newState._enter.call(this, oldState); }
        }
        else {throw new Error('Must provide a state object to transition to');}
      };
      fsm.getCurrentState = function () { return this._currentState; };

      return fsm;
    },
    createState: function (name) {
      return {
        name: name,
        _handlers: {},
        handler: function (input, handlerFunc) {
          if (input && isFunc(handlerFunc)) {
            var inputStr = input.toString();
            this._handlers[input] = handlerFunc;
          } else if (isState(handlerFunc)) {
            var inputStr = input.toString();
            this._handlers[input] = function () {this.transition(handlerFunc);}
          }
          return this;
        },
        default: function (defaultFunc) {
          if (typeof defaultFunc === 'function') {
            this._default = defaultFunc;
          }
          return this;
        },
        onEnter: function (enterFunc) {
          if (typeof enterFunc === 'function') { this._enter = enterFunc; }
          return this;
        },
        onExit: function (exitFunc) {
          if (typeof exitFunc === 'function') { this._exit = exitFunc; }
          return this;
        },
        getName: function () {return this.name; },
        toString: function () {return 'cellule state: ' + this.getName();}
      };
    },
    createInput: function (name) {
      if (!isString(name)) throw new TypeError('Input name must be a string');
      return new function () {
        this._name = name;
        this.activate = function (msg) {
          if (this._validate) { if (!this._validate(msg)) return null; }
          if (this._transform) { msg = this._transform(msg); }
          return {
            input: this._name,
            msg: msg
          };
        };
        this.getName = function () {return this._name;};
        this.toString = function () { return this.getName(); };
        this.validator = function (validateFunc) {
          if (isFunc(validateFunc)) {this._validate = validateFunc;}
          return this;
        };
        this.transformer = function (transformFunc) {
          if (isFunc(transformFunc)) {this._transform = transformFunc;}
          return this;
        };
      };
    }
  };

  return cellule;

}));