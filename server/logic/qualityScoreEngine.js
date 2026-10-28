// server/logic/qualityScoreEngine.js
import { PARTNER_TIERS } from '../../shared/constants.js';

/**
 * Calculates dynamic partner performance score based on:
 * score = (avgRating * 20) + (100 - reworkRate * 100) + (100 - cancellationRate * 100) + (trainingCompleted ? 50 : 0)
 *
 * Tier thresholds:
 * score >= 200 => GOLD (12% commission)
 * 150 - 199   => SILVER (15% commission)
 * 100 - 149   => BRONZE (18% commission)
 * < 100       => AT_RISK (20% commission)
 */
export function calculatePerformanceScore(metrics = {}) {
  const avgRating = typeof metrics.avgRating === 'number' ? metrics.avgRating : 0; // 0 to 5
  const reworkRate = typeof metrics.reworkRate === 'number' ? metrics.reworkRate : 0; // 0.0 to 1.0
  const cancellationRate = typeof metrics.cancellationRate === 'number' ? metrics.cancellationRate : 0; // 0.0 to 1.0
  const trainingCompleted = Boolean(metrics.trainingCompleted);

  const ratingComponent = avgRating * 20;
  const reworkComponent = 100 - (reworkRate * 100);
  const cancellationComponent = 100 - (cancellationRate * 100);
  const trainingComponent = trainingCompleted ? 50 : 0;

  const rawScore = ratingComponent + reworkComponent + cancellationComponent + trainingComponent;
  const roundedScore = Math.round(Math.max(0, rawScore) * 100) / 100;

  let tier = PARTNER_TIERS.AT_RISK.name;
  let commissionRate = PARTNER_TIERS.AT_RISK.commissionRate;

  if (roundedScore >= PARTNER_TIERS.GOLD.minScore) {
    tier = PARTNER_TIERS.GOLD.name;
    commissionRate = PARTNER_TIERS.GOLD.commissionRate;
  } else if (roundedScore >= PARTNER_TIERS.SILVER.minScore) {
    tier = PARTNER_TIERS.SILVER.name;
    commissionRate = PARTNER_TIERS.SILVER.commissionRate;
  } else if (roundedScore >= PARTNER_TIERS.BRONZE.minScore) {
    tier = PARTNER_TIERS.BRONZE.name;
    commissionRate = PARTNER_TIERS.BRONZE.commissionRate;
  }

  return {
    score: roundedScore,
    tier,
    commissionRate,
    components: {
      ratingComponent,
      reworkComponent,
      cancellationComponent,
      trainingComponent
    }
  };
}

/**
 * Recalculates partner quality score, updates tier, and checks if >20 pt score drop/increase occurred.
 */
export function recalculateQualityScore(partner, newMetrics = {}) {
  const currentMetrics = {
    avgRating: newMetrics.avgRating ?? partner.avgRating ?? 5.0,
    reworkRate: newMetrics.reworkRate ?? partner.reworkRate ?? 0,
    cancellationRate: newMetrics.cancellationRate ?? partner.cancellationRate ?? 0,
    trainingCompleted: newMetrics.trainingCompleted ?? partner.trainingCompleted ?? false
  };

  const oldScore = partner.performanceScore ?? 0;
  const calculationResult = calculatePerformanceScore(currentMetrics);
  const scoreDelta = Math.abs(calculationResult.score - oldScore);
  const requiresManualReview = oldScore > 0 && scoreDelta > 20;

  return {
    partnerId: partner.id,
    previousScore: oldScore,
    previousTier: partner.tier || PARTNER_TIERS.AT_RISK.name,
    newScore: calculationResult.score,
    newTier: calculationResult.tier,
    commissionRate: calculationResult.commissionRate,
    scoreDelta,
    requiresManualReview,
    metrics: currentMetrics
  };
}
