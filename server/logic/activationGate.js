// server/logic/activationGate.js
import { KYC_STATUS, BACKGROUND_CHECK_STATUS } from '../../shared/constants.js';

/**
 * Pure function evaluating partner activation eligibility.
 * HARD-CODED business logic safeguard: Cannot be overridden by configuration or flags.
 *
 * @param {Object} partner
 * @returns {Object} { isActive: boolean, status: string, reason: string }
 */
export function checkActivationGate(partner) {
  if (!partner) {
    return {
      isActive: false,
      status: 'INACTIVE',
      reason: 'Partner record does not exist'
    };
  }

  const kycPassed = partner.kycStatus === KYC_STATUS.KYC_CLEARED;
  const trainingPassed = partner.trainingCompleted === true || partner.trainingStatus === 'COMPLETE';
  const backgroundPassed = partner.backgroundCheckStatus === BACKGROUND_CHECK_STATUS.CLEARED;

  const failedReasons = [];

  if (!kycPassed) {
    failedReasons.push(`KYC status is '${partner.kycStatus || 'NOT_STARTED'}', expected '${KYC_STATUS.KYC_CLEARED}'`);
  }
  if (!trainingPassed) {
    failedReasons.push('Training requirements incomplete');
  }
  if (!backgroundPassed) {
    failedReasons.push(`Background check status is '${partner.backgroundCheckStatus || 'NOT_STARTED'}', expected '${BACKGROUND_CHECK_STATUS.CLEARED}'`);
  }

  if (failedReasons.length === 0) {
    return {
      isActive: true,
      status: 'ACTIVE',
      reason: 'All activation conditions met: KYC Cleared, Training Completed, Background Check Cleared'
    };
  }

  return {
    isActive: false,
    status: 'INACTIVE',
    reason: `Activation gate failed: ${failedReasons.join('; ')}`
  };
}
