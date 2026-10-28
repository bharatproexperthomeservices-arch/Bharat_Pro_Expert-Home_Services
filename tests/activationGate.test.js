// tests/activationGate.test.js
import { checkActivationGate } from '../server/logic/activationGate.js';
import { KYC_STATUS, BACKGROUND_CHECK_STATUS } from '../shared/constants.js';

describe('Activation Gate Safeguard', () => {
  test('rejects partner activation when KYC is pending or failed', () => {
    const partner = {
      id: 'partner_test_1',
      kycStatus: KYC_STATUS.PENDING_VERIFICATION,
      trainingCompleted: true,
      backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED
    };

    const result = checkActivationGate(partner);
    expect(result.isActive).toBe(false);
    expect(result.status).toBe('INACTIVE');
    expect(result.reason).toContain('KYC status is');
  });

  test('rejects partner activation when training is incomplete', () => {
    const partner = {
      id: 'partner_test_2',
      kycStatus: KYC_STATUS.KYC_CLEARED,
      trainingCompleted: false,
      backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED
    };

    const result = checkActivationGate(partner);
    expect(result.isActive).toBe(false);
    expect(result.status).toBe('INACTIVE');
    expect(result.reason).toContain('Training requirements incomplete');
  });

  test('rejects partner activation when background check is not cleared', () => {
    const partner = {
      id: 'partner_test_3',
      kycStatus: KYC_STATUS.KYC_CLEARED,
      trainingCompleted: true,
      backgroundCheckStatus: BACKGROUND_CHECK_STATUS.PENDING
    };

    const result = checkActivationGate(partner);
    expect(result.isActive).toBe(false);
    expect(result.status).toBe('INACTIVE');
    expect(result.reason).toContain('Background check status is');
  });

  test('approves activation when ALL 3 requirements are met', () => {
    const partner = {
      id: 'partner_test_4',
      kycStatus: KYC_STATUS.KYC_CLEARED,
      trainingCompleted: true,
      backgroundCheckStatus: BACKGROUND_CHECK_STATUS.CLEARED
    };

    const result = checkActivationGate(partner);
    expect(result.isActive).toBe(true);
    expect(result.status).toBe('ACTIVE');
    expect(result.reason).toContain('All activation conditions met');
  });
});
