// server/logic/ledgerEngine.js
import { LEDGER_EVENT_TYPES, ACCOUNTS } from '../../shared/constants.js';

let ledgerStore = [];

/**
 * Validates double-entry transaction where sum of debits equals sum of credits.
 *
 * @param {Object} event
 * @param {string} event.eventType - Type of event (BOOKING_EARNING, COMMISSION_DEDUCTED, etc.)
 * @param {string} event.referenceId - Booking ID or Transaction ID
 * @param {string} [event.partnerId] - Partner ID
 * @param {Array<Object>} event.entries - List of { account, debit, credit }
 * @param {string} event.actor - Actor executing entry
 * @returns {Object} Created ledger batch
 */
export function postLedgerEntry(event) {
  const { eventType, referenceId, partnerId = null, entries = [], actor = 'SYSTEM' } = event;

  if (!eventType || !Object.values(LEDGER_EVENT_TYPES).includes(eventType)) {
    throw new Error(`Ledger entry rejected: Invalid eventType '${eventType}'`);
  }

  if (!referenceId) {
    throw new Error('Ledger entry rejected: Reference ID is required');
  }

  if (!Array.isArray(entries) || entries.length < 2) {
    throw new Error('Ledger entry rejected: At least 2 ledger entries (double-entry) are required');
  }

  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach((entry, idx) => {
    if (!entry.account) {
      throw new Error(`Ledger entry rejected: Entry at index ${idx} missing account code`);
    }
    const debit = parseFloat(entry.debit) || 0;
    const credit = parseFloat(entry.credit) || 0;

    if (debit < 0 || credit < 0) {
      throw new Error(`Ledger entry rejected: Amounts cannot be negative at index ${idx}`);
    }

    totalDebit += debit;
    totalCredit += credit;
  });

  // Precision rounding comparison to prevent floating point inaccuracy
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  if (!isBalanced) {
    throw new Error(
      `Double-entry validation failed: Total Debits (₹${totalDebit.toFixed(2)}) must equal Total Credits (₹${totalCredit.toFixed(2)})`
    );
  }

  const transactionBatch = {
    batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    referenceId,
    partnerId,
    totalAmount: totalDebit,
    entries: entries.map(e => ({
      ...e,
      debit: parseFloat(e.debit) || 0,
      credit: parseFloat(e.credit) || 0
    })),
    actor,
    timestamp: new Date().toISOString()
  };

  ledgerStore.push(transactionBatch);
  return transactionBatch;
}

/**
 * Calculates net payable balance for a partner: sum of credits - sum of debits
 */
export function getPartnerBalance(partnerId) {
  let balance = 0;

  ledgerStore.forEach(batch => {
    if (batch.partnerId === partnerId) {
      batch.entries.forEach(entry => {
        if (entry.account === ACCOUNTS.PARTNER_PAYABLE) {
          balance += (entry.credit - entry.debit);
        }
      });
    }
  });

  return Math.round(balance * 100) / 100;
}

export function getAllLedgerEntries() {
  return [...ledgerStore];
}

export function clearLedgerStoreForTesting() {
  ledgerStore = [];
}
