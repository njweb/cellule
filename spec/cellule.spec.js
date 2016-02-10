var expect = require('chai').expect;
var cellule = require('../cellule.js');

describe('cellule', function(){
  describe('create function', function(){
    it('should throw an error if no init function is provided', function(){
      expect(cellule.create).to.throw(Error);
      expect(cellule.create.bind(this, {init: 'str'})).to.throw(Error);
      expect(cellule.create.bind(this, {init: 5})).to.throw(Error);
      expect(cellule.create.bind(this, {init: {}})).to.throw(Error);
    });
  });
  describe('states', function(){

    it('should store states provided through the "this.for.state" pattern', function(){
      var c = cellule.create({init: function(){
        this.for.state('a').setAsInitialState();
      }});
      expect(cellule.hasState(c, 'a')).to.be.true;
    });

    it('should allow multiple states to be defined through the "this.for.state("...").and("...") pattern', function(){
      var c = cellule.create({init: function(){
        this.for.state('a').and('b');
        this.for.state('a').setAsInitialState();
      }});
      expect(cellule.hasState(c, 'a')).to.be.true;
      expect(cellule.hasState(c, 'b')).to.be.true;
    });

    it('should prevent a non-function value to be provided as the handler of an onEnter event', function(){
      expect(cellule.create.bind({init: function(){
        this.for.state('a').onEnter('abc').setAsInitialState();
      }})).to.throw(Error);
      expect(cellule.create.bind({init: function(){
        this.for.state('a').onEnter(5).setAsInitialState();
      }})).to.throw(Error);
      expect(cellule.create.bind({init: function(){
        this.for.state('a').onEnter({}).setAsInitialState();
      }})).to.throw(Error);
    });

    it('should prevent a non-function value to be provided as the handler of an onExit event', function(){
      expect(cellule.create.bind({init: function(){
        this.for.state('a').onExit('abc').setAsInitialState();
      }})).to.throw(Error);
      expect(cellule.create.bind({init: function(){
        this.for.state('a').onExit(5).setAsInitialState();
      }})).to.throw(Error);
      expect(cellule.create.bind({init: function(){
        this.for.state('a').onExit({}).setAsInitialState();
      }})).to.throw(Error);
    });

    it('should prevent a value that is not a function or a string ' +
      'from being provided as the handler of an input', function(){
      expect(cellule.create.bind({init: function(){
        this.for.state('a').handle('b').with(5).setAsInitialState();
      }})).to.throw(Error);
      expect(cellule.create.bind({init: function(){
        this.for.state('a').handle('b').with({}).setAsInitialState();
      }})).to.throw(Error);
    })

  });
  describe('inputs', function(){

    it('should store inputs that states have been created to handle', function(){
      var c = cellule.create({init: function(){
        this.for.state('a').handle('b').with(function(){});
        this.for.state('a').setAsInitialState();
      }});
      expect(cellule.hasInput(c, 'b')).to.be.true;
    });

  });
  describe('fsm', function(){

    it('should be able to define two states and an input handler that transitions between them', function(){
      var c = cellule.create({init: function(){
        var fsm = this;
        this.for.state('a').handle('input').with(function(){fsm.transition('b')}).setAsInitialState();
        this.for.state('b');
      }});
      c.on.input();
      expect(cellule.getCurrentStateName(c)).to.equal('b');
    });

    it('should trigger a state\'s onExit handler when a state is transitioned away from', function(){
      var triggered = false;
      var c = cellule.create({init: function(){
        var fsm = this;
        this.for.state('a')
          .handle('input').with(function(){fsm.transition('b')})
          .setAsInitialState();
        this.for.state('b').onEnter(function(){triggered = true;});
      }});
      c.on.input();
      expect(triggered).to.be.true;
    });

    it('should trigger a state\'s onEnter handler when a state is transitioned to', function(){
      var triggered = false;
      var c = cellule.create({init: function(){
        var fsm = this;
        this.for.state('a').handle('input').with(function(){
          fsm.transition('b');
        }).setAsInitialState();
        this.for.state('b').onEnter(function(){triggered = true;})
      }});
      c.on.input();
      expect(triggered).to.be.true;
    });

  });
});