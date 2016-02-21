var cellule = require('../cellule.mk3.js');
var expect = require('chai').expect;

describe('cellule', function () {
  describe('construction', function () {
    it('should allow you to pass an object and configuration function into the cellule function', function () {
      expect(cellule.setup({}, function () {})).to.be.an('object');
    });
    it('should require you to pass in two arguments', function () {
      expect(cellule.setup.bind(this)).to.throw(Error);
      expect(cellule.setup.bind(this, {})).to.throw(Error);
    });
    it('should not allow you to pass in a first argument that is not an object', function () {
      expect(cellule.setup.bind(this, 'abc')).to.throw(Error);
      expect(cellule.setup.bind(this, 5)).to.throw(Error);
      expect(cellule.setup.bind(this, function () {})).to.throw(Error);
    });
    it('should not allow you to pass in a second object that is not a function', function () {
      expect(cellule.setup.bind(this, {}, {})).to.throw(Error);
      expect(cellule.setup.bind(this, {}, 'abc')).to.throw(Error);
      expect(cellule.setup.bind(this, {}, 5)).to.throw(Error);
    });
  });
  describe('override', function () {
    it('should be able to mask a function in the original object, on a specific state', function () {
      var myObj = {
        myStr: 'abc',
        myFunc: function () {return this.myStr;}
      };
      var celluleObj = cellule.setup(myObj, function (celluleTool) {
        celluleTool
          .whenState('a')
          .override(this.myFunc)
          .with(function () {
            return this.myStr + 'd';
          });

        celluleTool.setInitialState('a');
      });

      expect(celluleObj.myFunc()).to.equal('abcd');
    });
    it('should be able to replace the mask of a function when a new state is transitioned to', function () {
      var myObj = {
        myStr: 'abc',
        myFunc: function () {return this.myStr; }
      };
      var celluleObj = cellule.setup(myObj, function (celluleTool) {
        celluleTool.whenState('a')
          .override(this.myFunc)
          .with(function () {return this.myStr + 'd'; });

        celluleTool.whenState('b')
          .override(this.myFunc)
          .with(function () {return this.myStr + 'e'; });

        celluleTool.setInitialState('a');
      });

      expect(celluleObj.myFunc()).to.equal('abcd');

      cellule.transition(celluleObj, 'b');

      expect(celluleObj.myFunc()).to.equal('abce');
    });
  });
  describe('alter', function () {
    it('should be able to setup behavior that happens before the default method is fired', function () {
      var triggered = false;
      var celluleObj = cellule.setup({
        myStr: 'abc',
        myFunc: function () { return this.myStr; }
      }, function (celluleTool) {
        celluleTool
          .whenState('a')
          .alter(this.myFunc)
          .firstDo(function () {triggered = true;});
      });

      expect(celluleObj.myFunc()).to.equal('abc');
      cellule.transition(celluleObj, 'a');
      expect(triggered).to.be.false;
      expect(celluleObj.myFunc()).to.equal('abc');
      expect(triggered).to.be.true;
    });
    it('should be able to setup behavior that happens after the default method is fired', function(){
      var triggered = false;
      var celluleObj = cellule.setup({
        myStr: 'abc',
        myFunc: function(){return this.myStr}
      }, function(celluleTool){
        celluleTool
          .whenState('a')
          .alter(this.myFunc)
          .alsoDo(function() {triggered = true});
      });

      expect(celluleObj.myFunc()).to.equal('abc');
      cellule.transition(celluleObj, 'a');
      expect(triggered).to.be.false;
      expect(celluleObj.myFunc()).to.equal('abc');
      expect(triggered).to.be.true;

    });
  });
  describe('mask', function(){
    it('should be able to apply a mask object to mask over fuctions in the source object', function(){
      var celluleObj = cellule.setup({
        myFuncA: function(){return 'abc';},
        myFuncB: function(){return 'def';}
      }, function(celluleTool){
        celluleTool.whenState('a').applyMask({
          myFuncA: function(){return 'cba';},
          myFuncB: function(){return 'fed';}
        });
      });
      expect(celluleObj.myFuncA()).to.equal('abc');
      expect(celluleObj.myFuncB()).to.equal('def');

      cellule.transition(celluleObj, 'a');
      expect(celluleObj.myFuncA()).to.equal('cba');
      expect(celluleObj.myFuncB()).to.equal('fed');
    });
  })
});