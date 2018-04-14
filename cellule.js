const bindEventHandlerToFsmObject = (eventHandler, fsmObject) => {
  return (status, emittedValues, parameters) => {
    let listener = value => { emittedValues.push(value); };
    let nextStatus = eventHandler(listener, parameters);

    if(!nextStatus || nextStatus === status) return [status, emittedValues];
    else {
      let currentStatus = status;
      let exitParameters;
      const allVisitedStatuses = new Set([status]);
      while (nextStatus && nextStatus !== currentStatus) {
        if (typeof nextStatus !== 'string') throw Error('Statuses must be strings');
        if (!fsmObject[nextStatus]) throw Error('Cannot complete transition. Unknown status value');
        if (nextStatus && allVisitedStatuses.has(nextStatus)) {
          throw Error(`Loop detected while transitioning from status:${currentStatus} to status:${nextStatus}`);
        }

        allVisitedStatuses.add(nextStatus);
        if (nextStatus !== currentStatus && currentStatus === status && fsmObject[currentStatus].$exit) {
          exitParameters = fsmObject[currentStatus].$exit(listener, nextStatus, parameters);
        }
        let previousStatus = currentStatus;
        currentStatus = nextStatus;
        if (currentStatus !== previousStatus && fsmObject[currentStatus].$enter) {
          nextStatus = fsmObject[nextStatus].$enter(listener, previousStatus, parameters, exitParameters);
        }
      }
      return [nextStatus ? nextStatus : currentStatus, emittedValues];
    }
  };
};

const createStatusEntry = (statusKey, statusProp, fsmObject, prototypeObject) => {
  const statusEntry = prototypeObject ? Object.create(prototypeObject) : {};
  statusEntry.event = (eventKey, parameters) => statusEntry[`$${eventKey}`](statusKey, [], parameters);
  return Object.entries(statusProp).reduce((statusAcc, [handlerKey, handlerProp]) => {
    if (handlerKey === 'event') throw Error(`The key "event" is reserved. Erroneously defined in "${statusKey}"`);
    if (handlerKey[0] === '$') {
      if (['$enter', '$exit'].includes(handlerKey)) {
        Object.defineProperty(statusAcc, handlerKey, {value: handlerProp});
      } else {
        Object.defineProperty(statusAcc, handlerKey, {value: bindEventHandlerToFsmObject(handlerProp, fsmObject)});
      }
    } else {
      statusAcc[handlerKey] = handlerProp;
    }
    return statusAcc;
  }, statusEntry);
};

const cellule = description => {
  if(typeof description !== 'object') throw Error('Must provide an object type for the description argument');
  let celluleObject = {};
  const defaultStatusObject = description.$default ?
    createStatusEntry('$default', description.$default, celluleObject)
    : undefined;
  if (defaultStatusObject) {
    celluleObject.$default = defaultStatusObject;
  }
  return Object.entries(description).reduce((fsmAcc, [statusKey, statusProp]) => {
    if (typeof statusProp === 'object' && statusKey !== '$default') {
      fsmAcc[statusKey] = createStatusEntry(statusKey, statusProp, fsmAcc, defaultStatusObject);
    }
    return fsmAcc;
  }, celluleObject);
};

export default cellule