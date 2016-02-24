var cellule = require('../cellule.mk4.js');
var expect = require('chai').expect;

describe('cellule', function () {
  describe('setup cellule object', function () {
    it('should have the same non-function properties as the original object', function () {
      var original = {
        a: 1,
        b: 'abc',
        c: {myFunction: function () {return 'bca';}},
        behavior: function () {return this.b;}
      };

      var filteredOriginalProps = Object.getOwnPropertyNames(original).filter(function (prop) {
        return typeof original[prop] !== 'function';
      });

      var celluleObj = cellule.setup(original);

      var filteredCelluleProps = Object.getOwnPropertyNames(celluleObj).filter(function (prop) {
        var searchStr = '__cellule';
        return typeof celluleObj[prop] !== 'function' && prop.substr(0, searchStr.length) !== searchStr;
      });

      expect(filteredCelluleProps).to.eql(filteredOriginalProps);
    });
  });
  describe('configure cellule overrides', function () {
    it('should be able to override a single function for a single state', function () {
      var original = {
        funcA: function () { return 'abc'; },
        funcB: function () {return 'def';}
      };

      var overrideFunc = function () {return 'xyz';};

      var celluleObj = cellule.setup(original);
      cellule.configure(celluleObj).whenState('a').override(original.funcA, overrideFunc);

      expect(celluleObj.funcA()).to.equal(original.funcA());

      cellule.transition(celluleObj, 'a');

      expect(celluleObj.funcA()).to.equal(overrideFunc());
    });
  });
});