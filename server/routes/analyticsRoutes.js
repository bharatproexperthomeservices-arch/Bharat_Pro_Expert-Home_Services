// server/routes/analyticsRoutes.js
import express from 'express';
import { repo } from '../repository/memoryRepository.js';
import { BOOKING_STATES } from '../../shared/constants.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const partners = await repo.getAllPartners();
    const bookings = await repo.getAllBookings();

    const activePartnersCount = partners.filter(p => p.isActive).length;
    const bookingsTodayCount = bookings.length;

    let totalRevenue = 0;
    let cancelledCount = 0;

    bookings.forEach(b => {
      if (b.status === BOOKING_STATES.COMPLETED || b.status === BOOKING_STATES.SETTLED) {
        totalRevenue += (b.totalAmount || b.amount || 0);
      }
      if (b.status === BOOKING_STATES.CANCELLED) {
        cancelledCount++;
      }
    });

    const cancellationRate = bookingsTodayCount > 0 ? Math.round((cancelledCount / bookingsTodayCount) * 10000) / 100 : 0;

    // Monthly trends mock/computed data for dashboard graphs
    const revenueTrend = [
      { month: 'Jan', revenue: 120000, bookings: 110 },
      { month: 'Feb', revenue: 145000, bookings: 130 },
      { month: 'Mar', revenue: 160000, bookings: 145 },
      { month: 'Apr', revenue: 185000, bookings: 170 },
      { month: 'May', revenue: 210000, bookings: 195 },
      { month: 'Jun', revenue: totalRevenue + 240000, bookings: bookingsTodayCount + 210 }
    ];

    const partnerTierDistribution = [
      { tier: 'GOLD', count: partners.filter(p => p.tier === 'GOLD').length },
      { tier: 'SILVER', count: partners.filter(p => p.tier === 'SILVER').length },
      { tier: 'BRONZE', count: partners.filter(p => p.tier === 'BRONZE').length },
      { tier: 'AT_RISK', count: partners.filter(p => p.tier === 'AT_RISK').length }
    ];

    res.json({
      success: true,
      data: {
        kpis: {
          activePartners: activePartnersCount,
          bookingsToday: bookingsTodayCount,
          totalRevenue,
          cancellationRate
        },
        charts: {
          revenueTrend,
          partnerTierDistribution
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
