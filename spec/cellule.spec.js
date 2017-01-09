var expect = require('chai').expect;
var cellule = require('../cellule.js');

var celluleMk6 = require('../celluleMk6.js');

describe('cellule mk6', function () {
  it('should sorta basically work', function () {
    var celluleApi = cellule({
      locked: {
        _isRoot: true,
        insertCoin: function (ops) {
          ops.setState('unlocked');
          return 'accepted';
        },
        pushHandle: function () {
          return 'block';
        }
      },
      unlocked: {
        insertCoin: function () {
          return 'rejected';
        },
        pushHandle: function (ops) {
          ops.setState('locked');
          return 'turn';
        }
      }
    });


    expect(celluleApi.pushHandle()).to.equal('block');
    expect(celluleApi.insertCoin()).to.equal('accepted');
    expect(celluleApi.insertCoin()).to.equal('rejected');
    expect(celluleApi.pushHandle()).to.equal('turn');
    expect(celluleApi.pushHandle()).to.equal('block');
  });

  it('should basically work MK6', function () {
    
    var api = null;
    var celluleInstance = celluleMk6({
      insertCoin: function (instance) {
        instance.setState('unlocked');
        return 'accept';
      },
      pushHandle: function () {
        return 'block';
      }
    }).exceptWhen('unlocked').then({
      insertCoin: function () {
        return 'reject';
      },
      pushHandle: function (instance) {
        instance.setState('locked');
        return 'turn';
      }
    }).onStateChanged(function (nextState, instance) {
      api = instance.forState(nextState);
    }).done();

    api = celluleInstance.forState('locked');

    expect(api.pushHandle()).to.equal('block');
    expect(api.insertCoin()).to.equal('accept');
    expect(api.insertCoin()).to.equal('reject');
    expect(api.pushHandle()).to.equal('turn');
    expect(api.pushHandle()).to.equal('block');

  });


});