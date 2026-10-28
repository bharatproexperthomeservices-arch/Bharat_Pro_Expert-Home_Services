// tests/dispatchAndPricing.test.js
import { calculatePrice, calculateCommission } from '../server/logic/pricingEngine.js';
import { validateManualDispatch, findBestPartner } from '../server/logic/dispatchEngine.js';
import { calculatePerformanceScore } from '../server/logic/qualityScoreEngine.js';

describe('Pricing & Dispatch Logic Engines', () => {
  describe('Pricing Engine', () => {
    test('calculates price in strict sequential order', () => {
      const result = calculatePrice({
        basePrice: 1000,
        categoryMultiplier: 1.1, // 1100
        cityFactor: 1.2,        // 1320
        surgeMultiplier: 1.1,    // 1452
        promoDiscount: 100,      // 1352
        taxRate: 0.05            // 1352 * 0.05 = 67.6
      });

      expect(result.subtotal).toBe(1352);
      expect(result.taxAmount).toBe(67.6);
      expect(result.finalPrice).toBe(1419.6);
    });

    test('calculates tier-based commission rates accurately', () => {
      const goldComm = calculateCommission(1000, 'GOLD');
      expect(goldComm.commissionRate).toBe(0.12);
      expect(goldComm.commissionAmount).toBe(120);
      expect(goldComm.partnerPayout).toBe(880);

      const bronzeComm = calculateCommission(1000, 'BRONZE');
      expect(bronzeComm.commissionRate).toBe(0.18);
      expect(bronzeComm.commissionAmount).toBe(180);
      expect(bronzeComm.partnerPayout).toBe(820);
    });
  });

  describe('Dispatch Engine', () => {
    const mockBooking = {
      id: 'bk_disp_1',
      category: 'Cleaning',
      location: { lat: 28.4595, lng: 77.0266 }
    };

    const eligiblePartner = {
      id: 'p1',
      name: 'Eligible Partner',
      skills: ['Cleaning'],
      avgRating: 4.8,
      location: { lat: 28.4600, lng: 77.0270 } // ~0.1 km away
    };

    const farPartner = {
      id: 'p2',
      name: 'Far Partner',
      skills: ['Cleaning'],
      avgRating: 4.8,
      location: { lat: 28.8000, lng: 77.5000 } // >30 km away
    };

    test('validates proximity boundary (rejects >15km)', () => {
      const elCheck = validateManualDispatch(mockBooking, eligiblePartner);
      expect(elCheck.eligible).toBe(true);

      const farCheck = validateManualDispatch(mockBooking, farPartner);
      expect(farCheck.eligible).toBe(false);
      expect(farCheck.reason).toContain('exceeding maximum dispatch radius of 15 km');
    });

    test('finds best partner using weighted formula including fairness score', () => {
      const partners = [eligiblePartner, farPartner];
      const ranked = findBestPartner(mockBooking, partners, [], { p1: 0, p2: 0 });

      expect(ranked[0].partner.id).toBe('p1');
      expect(ranked[0].eligible).toBe(true);
      expect(ranked[1].eligible).toBe(false);
    });
  });

  describe('Quality Score Engine', () => {
    test('computes performance score and maps to tier correctly', () => {
      // score = (5 * 20) + (100 - 0) + (100 - 0) + 50 = 350 => GOLD
      const scoreResult = calculatePerformanceScore({
        avgRating: 5.0,
        reworkRate: 0,
        cancellationRate: 0,
        trainingCompleted: true
      });

      expect(scoreResult.score).toBe(350);
      expect(scoreResult.tier).toBe('GOLD');
      expect(scoreResult.commissionRate).toBe(0.12);
    });
  });
});
