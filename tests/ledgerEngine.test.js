// tests/ledgerEngine.test.js
import { postLedgerEntry, getPartnerBalance, clearLedgerStoreForTesting } from '../server/logic/ledgerEngine.js';
import { LEDGER_EVENT_TYPES, ACCOUNTS } from '../shared/constants.js';

describe('Double-Entry Ledger Engine', () => {
  beforeEach(() => {
    clearLedgerStoreForTesting();
  });

  test('accepts balanced double-entry transaction', () => {
    const entry = postLedgerEntry({
      eventType: LEDGER_EVENT_TYPES.BOOKING_EARNING,
      referenceId: 'bk_1001',
      partnerId: 'partner_1',
      actor: 'FINANCE_ADMIN',
      entries: [
        { account: ACCOUNTS.CUSTOMER_RECEIVABLE, debit: 1000, credit: 0 },
        { account: ACCOUNTS.PARTNER_PAYABLE, debit: 0, credit: 880 },
        { account: ACCOUNTS.REVENUE_COMMISSION, debit: 0, credit: 120 }
      ]
    });

    expect(entry.batchId).toBeDefined();
    expect(entry.totalAmount).toBe(1000);
    expect(getPartnerBalance('partner_1')).toBe(880);
  });

  test('rejects unbalanced double-entry transaction', () => {
    expect(() => {
      postLedgerEntry({
        eventType: LEDGER_EVENT_TYPES.BOOKING_EARNING,
        referenceId: 'bk_1002',
        partnerId: 'partner_1',
        actor: 'FINANCE_ADMIN',
        entries: [
          { account: ACCOUNTS.CUSTOMER_RECEIVABLE, debit: 1000, credit: 0 },
          { account: ACCOUNTS.PARTNER_PAYABLE, debit: 0, credit: 800 } // Debit = 1000, Credit = 800 (Unbalanced)
        ]
      });
    }).toThrow('Double-entry validation failed: Total Debits (₹1000.00) must equal Total Credits (₹800.00)');
  });

  test('calculates net partner payable balance correctly across multiple entries', () => {
    // 1. Earn 880
    postLedgerEntry({
      eventType: LEDGER_EVENT_TYPES.BOOKING_EARNING,
      referenceId: 'bk_1',
      partnerId: 'partner_10',
      entries: [
        { account: ACCOUNTS.CUSTOMER_RECEIVABLE, debit: 1000, credit: 0 },
        { account: ACCOUNTS.PARTNER_PAYABLE, debit: 0, credit: 880 },
        { account: ACCOUNTS.REVENUE_COMMISSION, debit: 0, credit: 120 }
      ]
    });

    // 2. Penalty applied (-100)
    postLedgerEntry({
      eventType: LEDGER_EVENT_TYPES.PENALTY_APPLIED,
      referenceId: 'pen_1',
      partnerId: 'partner_10',
      entries: [
        { account: ACCOUNTS.PARTNER_PAYABLE, debit: 100, credit: 0 },
        { account: ACCOUNTS.PENALTY_INCOME, debit: 0, credit: 100 }
      ]
    });

    expect(getPartnerBalance('partner_10')).toBe(780);
  });
});
