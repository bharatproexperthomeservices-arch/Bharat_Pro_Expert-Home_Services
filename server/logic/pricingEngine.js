// server/logic/pricingEngine.js
import { PARTNER_TIERS } from '../../shared/constants.js';

/**
 * Calculates booking price in strict sequential order:
 * basePrice -> categoryMultiplier -> cityFactor -> surgeMultiplier -> promoDiscount -> tax
 *
 * @param {Object} params
 * @param {number} params.basePrice - Base service price
 * @param {number} [params.categoryMultiplier=1.0] - Category dynamic factor
 * @param {number} [params.cityFactor=1.0] - City cost adjustment factor
 * @param {number} [params.surgeMultiplier=1.0] - Demand surge factor (>= 1.0)
 * @param {number} [params.promoDiscount=0] - Flat promo discount in INR
 * @param {number} [params.taxRate=0.05] - Standard GST tax rate (e.g. 5% = 0.05)
 */
export function calculatePrice({
  basePrice,
  categoryMultiplier = 1.0,
  cityFactor = 1.0,
  surgeMultiplier = 1.0,
  promoDiscount = 0,
  taxRate = 0.05
}) {
  if (typeof basePrice !== 'number' || basePrice <= 0) {
    throw new Error('Pricing engine rejected: Valid basePrice > 0 is required');
  }

  // Step 1: Category scaling
  const categoryScaled = basePrice * (categoryMultiplier || 1.0);

  // Step 2: City multiplier
  const cityScaled = categoryScaled * (cityFactor || 1.0);

  // Step 3: Surge multiplier
  const surgeScaled = cityScaled * (surgeMultiplier || 1.0);

  // Step 4: Promo discount (subtotal cannot go below zero)
  const subtotalAfterDiscount = Math.max(0, surgeScaled - (promoDiscount || 0));

  // Step 5: Tax (GST 5%)
  const taxAmount = subtotalAfterDiscount * (taxRate || 0.05);

  // Final Total Amount
  const finalPrice = subtotalAfterDiscount + taxAmount;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    categoryMultiplier,
    cityFactor,
    surgeMultiplier,
    promoDiscount: Math.round((promoDiscount || 0) * 100) / 100,
    subtotal: Math.round(subtotalAfterDiscount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100
  };
}

/**
 * Calculates platform commission and partner net payout based on partner tier commission rate.
 *
 * @param {number} grossPrice - Final gross booking price
 * @param {string} partnerTier - GOLD, SILVER, BRONZE, AT_RISK
 */
export function calculateCommission(grossPrice, partnerTier) {
  const tierConfig = PARTNER_TIERS[partnerTier] || PARTNER_TIERS.AT_RISK;
  const commissionRate = tierConfig.commissionRate;

  const commissionAmount = Math.round((grossPrice * commissionRate) * 100) / 100;
  const partnerPayout = Math.round((grossPrice - commissionAmount) * 100) / 100;

  return {
    grossPrice,
    tier: tierConfig.name,
    commissionRate,
    commissionAmount,
    partnerPayout
  };
}

/**
 * Manual override function with mandatory reason logging.
 */
export function overridePrice({ bookingId, originalPrice, newPrice, reasonCode, adminId }) {
  if (!bookingId) {
    throw new Error('Price override failed: bookingId is required');
  }
  if (typeof newPrice !== 'number' || newPrice < 0) {
    throw new Error('Price override failed: valid newPrice >= 0 is required');
  }
  if (!reasonCode || reasonCode.trim() === '') {
    throw new Error('Price override failed: mandatory reasonCode is required');
  }
  if (!adminId) {
    throw new Error('Price override failed: adminId is required');
  }

  const priceDelta = newPrice - originalPrice;

  return {
    bookingId,
    originalPrice,
    newPrice,
    priceDelta,
    reasonCode,
    adminId,
    timestamp: new Date().toISOString()
  };
}
