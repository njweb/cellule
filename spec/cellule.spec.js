var expect = require('chai').expect;
var cellule = require('../cellule.js');

describe('cellule mk5', function () {
  it('should sorta basically work', function () {

    var myObj = {
      value: 0,
      isRedLightOn: function () {return false;},
      isGreenLightOn: function () {return false},
      reset: function () {this.value = 0;},
      setValue: function (newValue) {this.value = newValue;},
      toString: function () {return 'R:' + this.isRedLightOn() + '  G:' + this.isGreenLightOn()}
    };

    var rootMask = {
      isRedLightOn: function () { return this.value > 0;},
      isGreenLightOn: function () {return this.value > 20;}
    };

    var simpleMask = Object.create(rootMask, {
      addValue: {
        writable: true, configurable: true, enumerable: true,
        value: function (newValue) { this.setValue(this.value + newValue); }
      }
    });

    var multiplierMask = Object.create(rootMask, {
      addValue: {
        writable: true, configurable: true, enumerable: true,
        value: function (newValue) {
          this.setValue(this.value + newValue);
        }
      },
      setValue: {
        writable: true, configurable: true, enumerable: true,
        value: function (newValue) {
          this.value = newValue * 2;
        }
      }
    });

    var cObj = cellule.mask(myObj, simpleMask);

    expect(cObj.isRedLightOn()).to.be.false;
    cObj.addValue(3);
    expect(cObj.isRedLightOn()).to.be.true;

    myObj = cellule.unmask(cObj);
    expect(myObj.isRedLightOn()).to.be.false;

    expect(myObj.value).to.equal(3);

    var myObj = cellule.runMasked(myObj, multiplierMask, function (masked) {
      masked.addValue(10);
      expect(masked.isGreenLightOn()).to.be.true;
    });

    expect(myObj.isGreenLightOn()).to.be.false;
    expect(myObj.value).to.equal(26);

  });
  it('should handle object inheritance well', function () {
    var rootObj = {
      respond: function () {return 'abc';}
    };
    var myObj = Object.create(rootObj);
    myObj.respond = function () {return Object.getPrototypeOf(this).respond() + 'def';};

    expect(myObj.respond()).to.equal('abcdef');

    var maskedObj = cellule.mask(myObj, {
      speak: function(){
        return this.respond() + 'ghi';
      }
    });

    expect(maskedObj.speak()).to.equal('abcdefghi');
  });
  it('should be able to setup mask enter and exit handlers', function () {
    var myObj = {value: -1};

    var lifecycleCellule = cellule.mask(cellule, {
      mask: function (obj, mask) {
        var masked = cellule.mask(obj, mask);
        if (typeof mask._onEnter === 'function') mask._onEnter(masked);
        return masked;
      },
      unmask: function (maskedObj) {
        if (typeof maskedObj._onExit === 'function') maskedObj._onExit(maskedObj);
        return cellule.unmask(maskedObj);
      }
    });

    var triggerEnter = false;
    var triggerExit = false;

    var simpleMask = {
      _onEnter: function () {triggerEnter = true;},
      _onExit: function () {triggerExit = true;},
      addValue: function () {
        this.value += 2;
      }
    };

    var maskedObj = lifecycleCellule.mask(myObj, simpleMask);

    maskedObj.addValue();
    myObj = lifecycleCellule.unmask(maskedObj);

    expect(myObj.value).to.equal(1);
    expect(triggerEnter).to.be.true;
    expect(triggerExit).to.be.true;
  })
});