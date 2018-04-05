var cellule = require('../cellule.js');

describe('cellule mk5', function () {
  it('should sorta basically work', function () {
    // cellule(key, map) -> function
    // cellule(key, map) -> func(state, action) -> state
    // cellule(map)
    // map = {
    //     opened: { push }
    //     closed: { push }
    //     }
    // cellule(statusMap)
    // myFsm.applyEvent(eventName, valueA, valueB) => myFsm.eventName(valueA, valueB) => myFsm / value ????? myFsm.status/value
    // cellule.run(myFsm).push('abc') => nextFsm.value = 'abc'/nextFsm.status = 'closed'


    // const myFsm = cellule({
    //   opened: { 'push': 'closed' },
    //   closed: { 'push': {
    //       status: ([...args]) => {},
    //       value: ([...args]) => {}
    //     } }
    // });
    // expect(typeof myFsm).toBe('function');
    // myFsm({type: 'push'})

    const myFsm = cellule({
      opened: {
        push: 'closed'
      },
      closed: {
        push: 'opened'
      }
    }, {
      initalValue: 'abc',
      initialStatus: 'opened',
      defaultsRequired: false
    });

    expect('abc'.length).toBe(3);
  });
});