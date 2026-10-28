// server/routes/bookingRoutes.js
import express from 'express';
import { repo } from '../repository/memoryRepository.js';
import { validateAndTransition } from '../logic/stateMachine.js';
import { validateManualDispatch, findBestPartner } from '../logic/dispatchEngine.js';
import { calculateCommission, overridePrice } from '../logic/pricingEngine.js';
import { postLedgerEntry } from '../logic/ledgerEngine.js';
import { logAction } from '../logic/auditLogger.js';
import { BOOKING_STATES, PAYMENT_STATUSES, PAYMENT_METHODS, LEDGER_EVENT_TYPES, ACCOUNTS } from '../../shared/constants.js';

const router = express.Router();

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await repo.getAllBookings();
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await repo.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Module 3.1 & 3.2: State Machine Transition (Kanban Drag-and-Drop / Operational Update)
router.post('/:id/transition', async (req, res) => {
  try {
    const { toState, reasonCode, actor = 'OPERATIONS_ADMIN' } = req.body;
    const booking = await repo.getBookingById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const beforeState = { ...booking };

    // State machine validation
    const transitionRecord = validateAndTransition({
      booking,
      toState,
      reasonCode,
      actor
    });

    booking.status = toState;
    if (!booking.history) booking.history = [];
    booking.history.push(transitionRecord);

    // Sync payment status with booking state machine
    if (toState === BOOKING_STATES.COMPLETED) {
      if (booking.paymentMethod === PAYMENT_METHODS.CASH) {
        booking.paymentStatus = PAYMENT_STATUSES.COLLECTED_IN_CASH;
      } else {
        booking.paymentStatus = PAYMENT_STATUSES.PENDING_PAYOUT;
      }

      // Automatically record financial earnings in double-entry ledger
      if (booking.partnerId) {
        const partner = await repo.getPartnerById(booking.partnerId);
        const grossPrice = booking.totalAmount || booking.amount || 1000;
        const comm = calculateCommission(grossPrice, partner ? partner.tier : 'GOLD');

        postLedgerEntry({
          eventType: LEDGER_EVENT_TYPES.BOOKING_EARNING,
          referenceId: booking.id,
          partnerId: booking.partnerId,
          actor,
          entries: [
            { account: ACCOUNTS.CUSTOMER_RECEIVABLE, debit: grossPrice, credit: 0 },
            { account: ACCOUNTS.PARTNER_PAYABLE, debit: 0, credit: comm.partnerPayout },
            { account: ACCOUNTS.REVENUE_COMMISSION, debit: 0, credit: comm.commissionAmount }
          ]
        });
      }
    } else if (toState === BOOKING_STATES.SETTLED) {
      booking.paymentStatus = PAYMENT_STATUSES.SETTLED;

      if (booking.partnerId) {
        const partner = await repo.getPartnerById(booking.partnerId);
        const grossPrice = booking.totalAmount || booking.amount || 1000;
        const comm = calculateCommission(grossPrice, partner ? partner.tier : 'GOLD');

        postLedgerEntry({
          eventType: LEDGER_EVENT_TYPES.BOOKING_EARNING,
          referenceId: `settle_${booking.id}`,
          partnerId: booking.partnerId,
          actor,
          entries: [
            { account: ACCOUNTS.PARTNER_PAYABLE, debit: comm.partnerPayout, credit: 0 },
            { account: ACCOUNTS.BANK, debit: 0, credit: comm.partnerPayout }
          ]
        });
      }
    }

    const saved = await repo.saveBooking(booking);

    logAction({
      actor,
      action: 'BOOKING_STATE_TRANSITION',
      targetType: 'BOOKING',
      targetId: booking.id,
      before: { status: beforeState.status },
      after: { status: saved.status, paymentStatus: saved.paymentStatus },
      reason: `Reason Code: ${reasonCode}`
    });

    res.json({ success: true, data: saved, transitionRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Module 3.3: Manual Force Dispatch
router.post('/:id/assign', async (req, res) => {
  try {
    const { partnerId, reasonCode = 'FORCE_ASSIGNED', actor = 'DISPATCH_LEAD' } = req.body;
    const booking = await repo.getBookingById(req.params.id);
    const partner = await repo.getPartnerById(partnerId);

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });

    const allBookings = await repo.getAllBookings();

    // Perform strict manual dispatch validations
    const validation = validateManualDispatch(booking, partner, allBookings);

    if (!validation.eligible) {
      return res.status(400).json({
        success: false,
        error: `Force dispatch rejected: ${validation.reason}`
      });
    }

    const beforeState = { partnerId: booking.partnerId, status: booking.status };

    // Apply state machine transition PENDING -> ASSIGNED
    const transitionRecord = validateAndTransition({
      booking,
      toState: BOOKING_STATES.ASSIGNED,
      reasonCode,
      actor
    });

    booking.partnerId = partner.id;
    booking.status = BOOKING_STATES.ASSIGNED;
    if (!booking.history) booking.history = [];
    booking.history.push(transitionRecord);

    const saved = await repo.saveBooking(booking);

    logAction({
      actor,
      action: 'MANUAL_DISPATCH_ASSIGNED',
      targetType: 'BOOKING',
      targetId: booking.id,
      before: beforeState,
      after: { partnerId: partner.id, status: booking.status },
      reason: `Assigned partner ${partner.name} (ID: ${partner.id}). Reason: ${reasonCode}`
    });

    res.json({ success: true, data: saved, validation });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Manual Price Override
router.post('/:id/override-price', async (req, res) => {
  try {
    const { newPrice, reasonCode, actor = 'FINANCE_ADMIN' } = req.body;
    const booking = await repo.getBookingById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const originalPrice = booking.totalAmount || booking.amount;

    const overrideRecord = overridePrice({
      bookingId: booking.id,
      originalPrice,
      newPrice: parseFloat(newPrice),
      reasonCode,
      adminId: actor
    });

    booking.totalAmount = overrideRecord.newPrice;
    booking.amount = overrideRecord.newPrice;

    const saved = await repo.saveBooking(booking);

    logAction({
      actor,
      action: 'BOOKING_PRICE_OVERRIDE',
      targetType: 'BOOKING',
      targetId: booking.id,
      before: { price: originalPrice },
      after: { price: overrideRecord.newPrice },
      reason: `Reason: ${reasonCode} (Delta: ₹${overrideRecord.priceDelta})`
    });

    res.json({ success: true, data: saved, overrideRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get Suggested Partners for a Booking
router.get('/:id/suggested-partners', async (req, res) => {
  try {
    const booking = await repo.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const allPartners = await repo.getAllPartners();
    const activePartners = allPartners.filter(p => p.isActive);
    const allBookings = await repo.getAllBookings();

    const rankedCandidates = findBestPartner(booking, activePartners, allBookings);

    res.json({ success: true, bookingId: booking.id, data: rankedCandidates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
