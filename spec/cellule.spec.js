var expect = require('chai').expect;
var cellule = require('../cellule.js');

describe('cellule', function () {
  describe('input', function () {
    it('should throw an error if a string is not provided as the name argument', function () {
      expect(cellule.createInput).to.throw(TypeError);
      expect(cellule.createInput.bind(this, {})).to.throw(TypeError);
      expect(cellule.createInput.bind(this, function () {})).to.throw(TypeError);
      expect(cellule.createInput.bind(this, 5)).to.throw(TypeError);
    });
    it('should return its name through .getName()', function () {
      var i = cellule.createInput('abcd');
      expect(i.getName()).to.equal('abcd');
    });
    it('should return an object with the input\'s name and the passed in message when activated', function () {
      var name = 'input';
      var msg = {stuff: 'foo'};

      var i = cellule.createInput(name);
      var result = i.activate(msg);

      expect(result.input).to.equal(name);
      expect(result.msg).to.equal(msg);
    });
    describe('if a transform function has been provided', function () {
      it('should transform a msg passed in when activated, if a transform function has been provided', function () {
        var i = cellule.createInput('input').transformMsg(function (msg) {
          return msg + 1;
        });
        expect(i.activate(1)).to.eql({input: 'input', msg: 2});
      });
    });
    describe('if a validate function has been provided', function () {
      it('should return the correct activated object if the provided message passes validation', function () {
        var i = cellule.createInput('input').validateMsg(function (msg) { return msg === 1; });
        expect(i.activate(1).msg).to.equal(1);
      });
      it('should return null if the provided msg does not validate', function () {
        var i = cellule.createInput('input').validateMsg(function (msg) { return msg === 1; });
        expect(i.activate(2)).to.be.null;
      });
    });
  });
  describe('finite state machine', function () {
    it('should have input and transition functions', function () {
      var fsm = cellule.createFsm();
      expect(fsm.input).to.be.a('function');
      expect(fsm.transition).to.be.a('function');
    });
    it('should run a passed in initialization function with itself as the context', function () {
      var innerThis = null;
      var fsm = cellule.createFsm(function () {innerThis = this;});
      expect(innerThis).to.equal(fsm);
    });
    it('should allow you to add inputs during the execution of the constructor function', function () {
      var inputName = 'inputA';
      var fsm = cellule.createFsm(function () {
        this.addInput(inputName);
      });
      expect(fsm.on[inputName]).to.be.a('function');
    });
    it('should not allow input and transition functions to be overridden');
  });
  describe('state', function () {
    it('should accept handlers', function () {
      var triggered = false;
      var inputName = 'a';
      var s = cellule.createState('stateA').handler(inputName, function () { triggered = true; });
      var fsm = cellule.createFsm(function () {
        this.initialState = s;
      });
      fsm.input(inputName);
      expect(triggered).to.be.true;
    });
    it('should be able to transition the current state of the fsm', function () {
      var input = cellule.createInput('myInput');
      var stateA = cellule.createState('a').handler(input, function () {this.transition(stateB)});
      var stateB = cellule.createState('b');
      var fsm = cellule.createFsm(function(){
        this.initialState = stateA;
      });
      fsm.input(input.getName());
      expect(fsm.getCurrentState().getName()).to.equal('b');
    });
    it('should allow a default input handler to be defined', function(){
      var triggered = false;
      var stateA = cellule.createState('a').default(function(){triggered = true;});
      var fsm = cellule.createFsm(function(){
        this.initialState = stateA;
      });
      fsm.input('unknown');
      expect(triggered).to.be.true;
    });
    it('should allow a handler for when the state is entered to be defined', function(){
      var triggered = false;
      var stateA = cellule.createState('a').handler('foo', function(){this.transition(stateB)});
      var stateB = cellule.createState('b').onEnter(function(){triggered = true;});
      var fsm = cellule.createFsm(function(){this.initialState = stateA});
      fsm.input('foo');
      expect(triggered).to.be.true;
    });
    it('should allow a handler for when the state is exited to be defined', function(){
      var triggered = false;
      var stateA = cellule.createState('a')
        .handler('foo', function(){this.transition(stateB)})
        .onExit(function(){triggered = true;});
      var stateB = cellule.createState('b');
      var fsm = cellule.createFsm(function(){this.initialState = stateA});
      fsm.input('foo');
      expect(triggered).to.be.true;
    });

  });
});