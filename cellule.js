const bindEventHandlerToFsmObject = (eventHandler, fsmObject) => {
  return (status, emittedValues, parameters) => {
    let listener = value => {
      emittedValues.push(value);
    };
    let nextStatus = eventHandler(listener, parameters);

    if (!nextStatus || nextStatus === status) return [status, emittedValues];
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
        if (nextStatus !== currentStatus && currentStatus === status && fsmObject[currentStatus].$event.$exit) {
          exitParameters = fsmObject[currentStatus].$event.$exit(listener, nextStatus, parameters);
        }
        let previousStatus = currentStatus;
        currentStatus = nextStatus;
        if (currentStatus !== previousStatus && fsmObject[currentStatus].$event.$enter) {
          nextStatus = fsmObject[nextStatus].$event.$enter(listener, previousStatus, parameters, exitParameters);
        }
      }
      return [nextStatus ? nextStatus : currentStatus, emittedValues];
    }
  };
};

const createStatusEntry = (statusKey, statusProp, fsmObject, prototypeObject) => {
  const statusEntry = prototypeObject ? Object.create(prototypeObject) : {};
  statusEntry.$event = prototypeObject ? Object.create(prototypeObject.$event) : {};
  return Object.entries(statusProp).reduce((statusAcc, [handlerKey, handlerProp]) => {
    if (handlerKey === '$event') throw Error(`The key "$event" is reserved. Defined in "${statusKey}"`);
    if (handlerKey[0] === '$') {
      if (['$enter', '$exit'].includes(handlerKey)) {
        Object.defineProperty(statusAcc.$event, handlerKey, {value: handlerProp});
      } else {
        const eventKey = handlerKey.substring(1);
        const eventHandler = bindEventHandlerToFsmObject(handlerProp, fsmObject);
        Object.defineProperty(statusAcc.$event, eventKey, {value: parameters => eventHandler(statusKey, [], parameters)});
      }
    } else {
      statusAcc[handlerKey] = handlerProp;
    }
    return statusAcc;
  }, statusEntry);
};

const cellule = description => {
  if (typeof description !== 'object') throw Error('Must provide an object type for the description argument');
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