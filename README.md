# Cellule v0.0.1

## What?
A micro .js lib to help build FSMs

## Quick Example
```javascript
var stateA = cellule.createState('stateA');
var stateB = cellule.createState('stateB')
	.onEnter(function(){console.log('entering state b')});
	
stateA.handler('myInput', function(){this.transition(stateB)});

var fsm = cellule.createFsm(stateA);
fsm.input('myInput');
// 'entering state b' should pop up in the console.
```

## License: ([MIT](http://www.opensource.org/licenses/mit-license))