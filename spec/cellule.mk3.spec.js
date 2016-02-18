var cellule = require('../cellule.mk3.js');
var expect = require('chai').expect;

describe('cellule', function(){
  describe('construction', function(){
    it('should allow you to pass an object and configuration function into the cellule function', function(){
      expect(cellule({}, function(){})).to.be.an('object');
    });
    it('should require you to pass in two arguments', function(){
      expect(cellule.bind(this)).to.throw(Error);
      expect(cellule.bind(this, {})).to.throw(Error);
    });
    it('should not allow you to pass in a first argument that is not an object', function(){
      expect(cellule.bind(this, 'abc')).to.throw(Error);
      expect(cellule.bind(this, 5)).to.throw(Error);
      expect(cellule.bind(this, function(){})).to.throw(Error);
    });
    it('should not allow you to pass in a second object that is not a function', function(){
      expect(cellule.bind(this, {}, {})).to.throw(Error);
      expect(cellule.bind(this, {}, 'abc')).to.throw(Error);
      expect(cellule.bind(this, {}, 5)).to.throw(Error);
    });
  });
});