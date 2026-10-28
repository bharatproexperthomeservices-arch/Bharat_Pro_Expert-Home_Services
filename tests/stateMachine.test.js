// tests/stateMachine.test.js
import { canTransition, validateAndTransition } from '../server/logic/stateMachine.js';
import { BOOKING_STATES, TRANSITION_REASON_CODES } from '../shared/constants.js';

describe('Booking State Machine Logic', () => {
  test('validates allowed transitions correctly', () => {
    expect(canTransition(BOOKING_STATES.PENDING, BOOKING_STATES.ASSIGNED)).toBe(true);
    expect(canTransition(BOOKING_STATES.ASSIGNED, BOOKING_STATES.EN_ROUTE)).toBe(true);
    expect(canTransition(BOOKING_STATES.EN_ROUTE, BOOKING_STATES.IN_PROGRESS)).toBe(true);
    expect(canTransition(BOOKING_STATES.IN_PROGRESS, BOOKING_STATES.COMPLETED)).toBe(true);
    expect(canTransition(BOOKING_STATES.COMPLETED, BOOKING_STATES.SETTLED)).toBe(true);
  });

  test('rejects invalid state transitions', () => {
    expect(canTransition(BOOKING_STATES.PENDING, BOOKING_STATES.COMPLETED)).toBe(false);
    expect(canTransition(BOOKING_STATES.COMPLETED, BOOKING_STATES.IN_PROGRESS)).toBe(false);
    expect(canTransition(BOOKING_STATES.SETTLED, BOOKING_STATES.PENDING)).toBe(false);
  });

  test('throws error when transitioning without reason code', () => {
    const booking = { id: 'bk_1', status: BOOKING_STATES.PENDING };
    expect(() => {
      validateAndTransition({
        booking,
        toState: BOOKING_STATES.ASSIGNED,
        reasonCode: '',
        actor: 'ADMIN'
      });
    }).toThrow('State transition rejected: A valid non-empty reasonCode is strictly required');
  });

  test('throws error on invalid transition attempt', () => {
    const booking = { id: 'bk_2', status: BOOKING_STATES.PENDING };
    expect(() => {
      validateAndTransition({
        booking,
        toState: BOOKING_STATES.SETTLED,
        reasonCode: 'NORMAL_FLOW',
        actor: 'ADMIN'
      });
    }).toThrow("Cannot transition from 'PENDING' to 'SETTLED'");
  });

  test('succeeds on valid state transition with valid reason code', () => {
    const booking = { id: 'bk_3', status: BOOKING_STATES.PENDING };
    const result = validateAndTransition({
      booking,
      toState: BOOKING_STATES.ASSIGNED,
      reasonCode: 'NORMAL_FLOW',
      actor: 'ADMIN'
    });

    expect(result.fromState).toBe(BOOKING_STATES.PENDING);
    expect(result.toState).toBe(BOOKING_STATES.ASSIGNED);
    expect(result.reasonCode).toBe('NORMAL_FLOW');
  });
});
