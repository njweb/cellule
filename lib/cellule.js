(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.cellule = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var bindEventHandlerToFsmObject = function bindEventHandlerToFsmObject(eventHandler, fsmObject) {
  return function (status, emittedValues, parameters) {
    var listener = function listener(value) {
      emittedValues.push(value);
    };
    var nextStatus = eventHandler(listener, parameters);

    if (!nextStatus || nextStatus === status) return [status, emittedValues];else {
      var currentStatus = status;
      var exitParameters = void 0;
      var allVisitedStatuses = new Set([status]);
      while (nextStatus && nextStatus !== currentStatus) {
        if (typeof nextStatus !== 'string') throw Error('Statuses must be strings');
        if (!fsmObject[nextStatus]) throw Error('Cannot complete transition. Unknown status value');
        if (nextStatus && allVisitedStatuses.has(nextStatus)) {
          throw Error('Loop detected while transitioning from status:' + currentStatus + ' to status:' + nextStatus);
        }

        allVisitedStatuses.add(nextStatus);
        if (nextStatus !== currentStatus && currentStatus === status && fsmObject[currentStatus].$exit) {
          exitParameters = fsmObject[currentStatus].$exit(listener, nextStatus, parameters);
        }
        var previousStatus = currentStatus;
        currentStatus = nextStatus;
        if (currentStatus !== previousStatus && fsmObject[currentStatus].$enter) {
          nextStatus = fsmObject[nextStatus].$enter(listener, previousStatus, parameters, exitParameters);
        }
      }
      return [nextStatus ? nextStatus : currentStatus, emittedValues];
    }
  };
};

var createStatusEntry = function createStatusEntry(statusKey, statusProp, fsmObject, defaultObject) {
  var statusEntry = defaultObject ? Object.create(defaultObject) : {};
  statusEntry.event = function (eventKey, parameters) {
    return statusEntry['$' + eventKey](statusKey, [], parameters);
  };
  return Object.entries(statusProp).reduce(function (statusAcc, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        handlerKey = _ref2[0],
        handlerProp = _ref2[1];

    if (handlerKey === 'event') throw Error('The key "event" is reserved. Erroneously defined in "' + statusKey + '"');
    if (handlerKey[0] === '$') {
      if (['$enter', '$exit'].includes(handlerKey)) {
        Object.defineProperty(statusAcc, handlerKey, { value: handlerProp });
      } else {
        Object.defineProperty(statusAcc, handlerKey, { value: bindEventHandlerToFsmObject(handlerProp, fsmObject) });
      }
    } else {
      statusAcc[handlerKey] = handlerProp;
    }
    return statusAcc;
  }, statusEntry);
};

var cellule = function cellule(description) {
  if ((typeof description === 'undefined' ? 'undefined' : _typeof(description)) !== 'object') throw Error('Must provide an object type for the description argument');
  var celluleObject = {};
  var defaultStatusObject = description.$default ? createStatusEntry('$default', description.$default, celluleObject) : undefined;
  if (defaultStatusObject) {
    celluleObject.$default = defaultStatusObject;
  }
  return Object.entries(description).reduce(function (fsmAcc, _ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        statusKey = _ref4[0],
        statusProp = _ref4[1];

    if ((typeof statusProp === 'undefined' ? 'undefined' : _typeof(statusProp)) === 'object' && statusKey !== '$default') {
      fsmAcc[statusKey] = createStatusEntry(statusKey, statusProp, fsmAcc, defaultStatusObject);
    }
    return fsmAcc;
  }, celluleObject);
};

return cellule;

})));
