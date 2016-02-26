# Cellule v0.0.2

## What?
A micro js library to help build FSM-like objects through object behavior masking

## Quick Example
```javascript
var myObj = {
    value: 'hello',
    speak: function(){ return this.value; }
};
var myMask = { speak: function() {return this.value + ' world'; }
var myMaskedObj = cellule.mask(myObj, myMask);
myMaskedObj.speak(); //Prints "hello world"
```

## License: [MIT](http://www.opensource.org/licenses/mit-license)