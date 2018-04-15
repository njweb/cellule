# Cellule

## What?
A micro js library to help build FSM-like objects with immutable behavior

## Quick Example
```javascript
const zapFsmDescription = {
  neutral: {
    $beginCharging: () => 'charging',
    isBeginChargingButtonEnabled: true
  },
  charging: {
    $addCharge: (emit, {chargeAmount, addedCharge}) => {
      const nextChargeAmount = chargeAmount + addedCharge;
      emit({chargeAmount: nextChargeAmount});
      if (nextChargeAmount >= 100) return 'charged'
    },
    isAddChargeButtonEnabled: true
  },
  charged: {
    $addCharge: (emit, {chargeAmount, addedCharge}) => {
      const nextChargeAmount = Math.floor(chargeAmount + (addedCharge / 10));
      emit({chargeAmount: nextChargeAmount});
    },
    $zap: (emit, {chargeAmount}) => {
      emit({zap: chargeAmount});
      emit({chargeAmount: 0});
      return 'neutral';
    },
    isAddChargeButtonEnabled: true,
    isSlowChargeLabelShown: true,
    isZapReady: true
  },
};

const zapFsmObject = cellule(zapFsmDescription);
let state = {
  zapStatus: 'neutral',
  chargeAmount: 0,
  zapOutput: 0
};

const onBeginChargedClicked = () => {
  const [nextStatus] = zapFsmObject[state.zapStatus].$event.beginCharging();
  state = {...state, zapStatus: nextStatus};
};
const onAddChargedClicked = (addedCharge) => {
  const [nextStatus, [{chargeAmount}]] = zapFsmObject[state.zapStatus].$event.addCharge({...state, addedCharge});
  state = {...state, zapStatus: nextStatus, chargeAmount};
};
const onZapClicked = () => {
  const [nextStatus, [{zap: zapOutput}, {chargeAmount}]] = zapFsmObject[state.zapStatus].$event.zap(state);
  state = {...state, zapStatus: nextStatus, zapOutput, chargeAmount}
};

console.log('BEGIN: ', state);
[
  onBeginChargedClicked,
  () => (onAddChargedClicked(40)),
  () => (onAddChargedClicked(90)),
  () => (onAddChargedClicked(50)),
  onZapClicked
].forEach(func => {
    func();
    console.log('CURRENT STATE: ', state);
  });
```

## License: [MIT](http://www.opensource.org/licenses/mit-license)