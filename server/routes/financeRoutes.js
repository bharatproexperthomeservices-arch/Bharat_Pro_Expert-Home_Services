// server/routes/financeRoutes.js
import express from 'express';
import { repo } from '../repository/memoryRepository.js';
import { postLedgerEntry, getAllLedgerEntries, getPartnerBalance } from '../logic/ledgerEngine.js';
import { logAction } from '../logic/auditLogger.js';
import { PAYMENT_STATUSES, PAYMENT_METHODS } from '../../shared/constants.js';

const router = express.Router();

// Get Finance Overview Metrics
router.get('/overview', async (req, res) => {
  try {
    const bookings = await repo.getAllBookings();
    const partners = await repo.getAllPartners();

    let totalCollected = 0;
    let pendingPayouts = 0;
    let cashInHand = 0;

    bookings.forEach(b => {
      const amount = b.totalAmount || b.amount || 0;
      if (b.paymentStatus === PAYMENT_STATUSES.SETTLED) {
        totalCollected += amount;
      } else if (b.paymentStatus === PAYMENT_STATUSES.PENDING_PAYOUT) {
        pendingPayouts += amount;
      } else if (b.paymentStatus === PAYMENT_STATUSES.COLLECTED_IN_CASH) {
        cashInHand += amount;
      }
    });

    const partnerBalances = partners.map(p => ({
      partnerId: p.id,
      name: p.name,
      tier: p.tier,
      payableBalance: getPartnerBalance(p.id)
    }));

    res.json({
      success: true,
      data: {
        totalCollected,
        pendingPayouts,
        cashInHand,
        partnerBalances
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all double-entry ledger entries
router.get('/ledger', async (req, res) => {
  try {
    const entries = getAllLedgerEntries();
    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Post double-entry financial transaction
router.post('/ledger', async (req, res) => {
  try {
    const { eventType, referenceId, partnerId, entries, actor = 'FINANCE_ADMIN' } = req.body;

    const result = postLedgerEntry({
      eventType,
      referenceId,
      partnerId,
      entries,
      actor
    });

    logAction({
      actor,
      action: 'LEDGER_ENTRY_POSTED',
      targetType: 'FINANCE_LEDGER',
      targetId: result.batchId,
      after: result,
      reason: `Double-entry posting for event ${eventType}`
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
