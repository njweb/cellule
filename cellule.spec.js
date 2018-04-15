import cellule from './cellule'

describe('cellule', function () {
  describe('setup', () => {
    it('should return an object that exposes all the non-prefixed keys that have an object-type value', () => {
      const fsmDescription = {
        thingA: {},
        keyB: {},
      };
      const result = cellule(fsmDescription);
      expect(Object.keys(result)).toEqual(Object.keys(fsmDescription))
    });
    it('should only map values that are typeof->object', () => {
      const fsmDescription = {
        thingA: () => {
        },
        thingB: function () {
        },
        thingC: 590,
        thingD: 'abcdef'
      };
      const result = cellule(fsmDescription);
      expect(Object.keys(result).length).toBe(0);
    });
    it('should allow status object values that are not prefixed with "$" to be accessed through the cellule object', () => {
      const fsmDescription = {
        status1: {
          valueA: 'abc',
          valueB: () => 'def'
        }
      };
      const celluleObject = cellule(fsmDescription);
      expect(celluleObject.status1.valueA).toBe('abc');
      expect(celluleObject.status1.valueB()).toBe('def');
    })
  });
  describe('status transitions', () => {
    it('should be able to transition between statuses', () => {
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {}
      };
      const [statusResult] = cellule(fsmDescription).status1.$event.action();
      expect(statusResult).toBe('status2');
    });
    it('should call the $exit handler when leaving a status', () => {
      const exitMockFunction = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2',
          $exit: exitMockFunction
        },
        status2: {}
      };
      cellule(fsmDescription).status1.$event.action();
      expect(exitMockFunction.mock.calls.length).toBe(1);
    });
    it('should call the $enter handler when entering a status', () => {
      const enterMockFunction = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: enterMockFunction
        }
      };
      cellule(fsmDescription).status1.$event.action();
      expect(enterMockFunction.mock.calls.length).toBe(1);
    });
    it('should be able to transition status from the return value of an $enter handler', () => {
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: () => 'statusFinal'
        },
        statusFinal: {}
      };
      const [statusResult] = cellule(fsmDescription).status1.$event.action();
      expect(statusResult).toBe('statusFinal');
    });
    it('should not call the $exit handler of a status when transitioning because of an $enter handler', () => {
      const exitMockFunction = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: () => 'statusFinal',
          $exit: exitMockFunction
        },
        statusFinal: {}
      };
      cellule(fsmDescription).status1.$event.action();
      expect(exitMockFunction.mock.calls.length).toBe(0);
    });
    it('should call the $enter handler of a status when transitioning because of an $enter handler', () => {
      const enterMockFunction = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: () => 'statusFinal'
        },
        statusFinal: {
          $enter: enterMockFunction
        }
      };
      cellule(fsmDescription).status1.$event.action();
      expect(enterMockFunction.mock.calls.length).toBe(1);
    });
    it('should pass the next status to the $exit handler when transitioning', () => {
      const statusSpy = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2',
          $exit: (_, nextStatus) => statusSpy(nextStatus)
        },
        status2: {}
      };
      cellule(fsmDescription).status1.$event.action();
      expect(statusSpy.mock.calls[0][0]).toBe('status2');
    });
    it('should pass the previous status to the $enter handler when transitioning', () => {
      const statusSpy = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2',
        },
        status2: {
          $enter: (_, previousStatus) => statusSpy(previousStatus)
        }
      };
      cellule(fsmDescription).status1.$event.action();
      expect(statusSpy.mock.calls[0][0]).toBe('status1');
    });
  });
  describe('emitting values', () => {
    it('should provide the event handlers with a function for emitting values', () => {
      const fsmDescription = {
        status1: {
          $action: emit => emit('abc')
        }
      };
      const [, emittedValues] = cellule(fsmDescription).status1.$event.action();
      expect(emittedValues).toEqual(['abc']);
    });
    it('should provide the $exit handler with a function for emitting values', () => {
      const fsmDescription = {
        status1: {
          $action: () => 'status2',
          $exit: emit => emit('abc')
        },
        status2: {}
      };
      const [, emittedValues] = cellule(fsmDescription).status1.$event.action();
      expect(emittedValues).toEqual(['abc']);
    });
    it('should provide the $enter handler with a function for emitting values', () => {
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: emit => emit('abc')
        }
      };
      const [, emittedValues] = cellule(fsmDescription).status1.$event.action();
      expect(emittedValues).toEqual(['abc']);
    });
    it('should collect all the values passed to the emit function across handlers', () => {
      const fsmDescription = {
        status1: {
          $action: emit => {
            emit('abc');
            return 'status2'
          },
          $exit: emit => emit('def')
        },
        status2: {
          $enter: emit => emit('hij')
        }
      };
      const [, emittedValues] = cellule(fsmDescription).status1.$event.action();
      expect(emittedValues).toEqual(['abc', 'def', 'hij']);
    });
  });
  describe('passing parameters', () => {
    it('should send to the event handler the parameters passed to the event function', () => {
      const parameterSpy = jest.fn();
      const fsmDescription = {
        status1: {
          $action: (_, parameters) => {
            parameterSpy(parameters)
          }
        }
      };
      const testParameters = {value: 'information'};
      cellule(fsmDescription).status1.$event.action(testParameters);
      expect(parameterSpy.mock.calls[0][0]).toEqual(testParameters);
    });
    it('should send to the $exit handler the parameters passed to the event function', () => {
      const parameterSpy = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2',
          $exit: (_, __, parameters) => parameterSpy(parameters)
        },
        status2: {}
      };
      const testParameters = {value: 'information'};
      cellule(fsmDescription).status1.$event.action(testParameters);
      expect(parameterSpy.mock.calls[0][0]).toEqual(testParameters);
    });
    it('should send to the $enter handler the parameters passed to the event function', () => {
      const parameterSpy = jest.fn();
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: (_, __, parameters) => parameterSpy(parameters)
        }
      };
      const testParameters = {value: 'information'};
      cellule(fsmDescription).status1.$event.action(testParameters);
      expect(parameterSpy.mock.calls[0][0]).toEqual(testParameters);
    });
    it('should sent the $enter handler the returned value from the $exit handler', () => {
      const exitParameterSpy = jest.fn();
      const testParameters = {value: 'information'};
      const fsmDescription = {
        status1: {
          $action: () => 'status2',
          $exit: () => testParameters
        },
        status2: {
          $enter: (_, __, ___, exitParameters) => exitParameterSpy(exitParameters)
        }
      };
      cellule(fsmDescription).status1.$event.action(testParameters);
      expect(exitParameterSpy.mock.calls[0][0]).toEqual(testParameters);
    });
  });
  describe('default behavior', () => {
    it('should provide the default value for a status property if the property is not defined for that status', () => {
      const fsmDescription = {
        $default: {
          value: 'abc'
        },
        status1: {}
      };
      const resultValue = cellule(fsmDescription).status1.value;
      expect(resultValue).toBe('abc');
    });
    it('should use the default behavior for event handlers if a handler is not present on the active status', () => {
      const fsmDescription = {
        $default: {
          $action: () => 'status2'
        },
        status1: {},
        status2: {}
      };
      const [statusResult] = cellule(fsmDescription).status1.$event.action();
      expect(statusResult).toBe('status2');
    });
  });
  describe('handling exceptions', () => {
    [() => ({}), 51, 'abc', null].forEach(value => {
      it(`should throw an error if not provided an object type description argument. argument: ${value}`, () => {
        const setup = () => cellule(value);
        expect(setup).toThrow();
      });
    });
    it('should throw if the description attempts to define an "$event" property on a status', () => {
      const fsmDescription = {
        status1: {
          $event: 'abc'
        }
      };
      const setup = () => cellule(fsmDescription);
      expect(setup).toThrow();
    });
    [() => ({}), 51, {}].forEach(value => {
      it(`should throw en error if an event handler provides a non-string & non-falsey next status key. nextStatus: ${value}`, () => {
        const fsmDescription = {
          status1: {
            $action: () => value
          }
        };
        const runEvent = () => cellule(fsmDescription).status1.$event.action();
        expect(runEvent).toThrow();
      });
    });
    it('should throw an error if an event handler tries to transition to an unknown status', () => {
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        }
      };
      const runEvent = () => cellule(fsmDescription).status1.$event.action();
      expect(runEvent).toThrow();
    });
    it('should throw an error if an $enter handler redirection creates a loop between statuses', () => {
      const fsmDescription = {
        status1: {
          $action: () => 'status2'
        },
        status2: {
          $enter: () => 'status3'
        },
        status3: {
          $enter: () => 'status1'
        }
      };
      const runEvent = () => cellule(fsmDescription).status1.$event.action();
      expect(runEvent).toThrow();
    });
  });
});