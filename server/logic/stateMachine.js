// server/logic/stateMachine.js
import { BOOKING_STATES, ALLOWED_TRANSITIONS, TRANSITION_REASON_CODES } from '../../shared/constants.js';

/**
 * Checks if a state transition is valid according to ALLOWED_TRANSITIONS state machine rules.
 * @param {string} fromState
 * @param {string} toState
 * @returns {boolean}
 */
export function canTransition(fromState, toState) {
  if (!fromState || !toState) return false;
  const allowedNextStates = ALLOWED_TRANSITIONS[fromState];
  if (!allowedNextStates) return false;
  return allowedNextStates.includes(toState);
}

/**
 * Validates state transition and reason code, throwing descriptive error if invalid.
 *
 * @param {Object} params
 * @param {Object} params.booking - Booking object
 * @param {string} params.toState - Target state
 * @param {string} params.reasonCode - Reason code for state change
 * @param {string} params.actor - Admin or system user executing transition
 * @returns {Object} Updated booking properties
 */
export function validateAndTransition({ booking, toState, reasonCode, actor }) {
  if (!booking) {
    throw new Error('State transition rejected: Booking object is required');
  }

  const currentState = booking.status || BOOKING_STATES.PENDING;

  if (!reasonCode || typeof reasonCode !== 'string' || reasonCode.trim() === '') {
    throw new Error('State transition rejected: A valid non-empty reasonCode is strictly required for all state transitions');
  }

  if (!canTransition(currentState, toState)) {
    throw new Error(
      `State transition rejected: Cannot transition from '${currentState}' to '${toState}'. Allowed transitions: [${(ALLOWED_TRANSITIONS[currentState] || []).join(', ')}]`
    );
  }

  const isReasonValid = Object.keys(TRANSITION_REASON_CODES).includes(reasonCode) || Object.values(TRANSITION_REASON_CODES).includes(reasonCode);
  if (!isReasonValid) {
    throw new Error(`State transition rejected: Reason code '${reasonCode}' is not a recognized reason code`);
  }

  return {
    bookingId: booking.id,
    fromState: currentState,
    toState,
    reasonCode,
    actor: actor || 'SYSTEM',
    timestamp: new Date().toISOString()
  };
}
