# Cellule v0.0.1

## What?
A micro js library to help build FSM-like objects

## Quick Example
```javascript
var fsm = cellule.createFsm({init: function(){

	this.for.state('stateA')
		.handle('myInput').with('stateB')
		.setAsInitialState();

	this.for.state('stateB')
		.onEnter(function(){console.log('entering state b');});
		
}};
fsm.on.myInput();
// 'entering state b' should pop up in the console.
```

## License: [MIT](http://www.opensource.org/licenses/mit-license)