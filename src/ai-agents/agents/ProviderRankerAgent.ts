// ============================================================================
// Agent #4: ProviderRankerAgent
// ============================================================================
// यह एजेंट partners को rating, distance, completion rate के हिसाब से rank करता है
// ============================================================================

import { BaseAgent } from '../BaseAgent';
import { PartnerCandidate } from './ProviderDiscoveryAgent';

export interface RankedPartner extends PartnerCandidate {
  score: number;
  rank: number;
}

export class ProviderRankerAgent extends BaseAgent {
  private readonly WEIGHT_RATING = 0.4;
  private readonly WEIGHT_COMPLETION = 0.3;
  private readonly WEIGHT_DISTANCE = 0.3;

  constructor() {
    super(4, 'Provider Ranker', 'Rating और distance के हिसाब से partners को rank करना');
  }

  async rank(partners: PartnerCandidate[]): Promise<RankedPartner[]> {
    console.log(`📊 Ranking ${partners.length} partners...`);

    if (!partners || partners.length === 0) {
      console.warn('⚠️ No partners to rank');
      return [];
    }

    try {
      const scored = partners.map((partner) => ({
        ...partner,
        score: this.calculateScore(partner),
        rank: 0,
      }));

      scored.sort((a, b) => b.score - a.score);

      scored.forEach((partner, index) => {
        partner.rank = index + 1;
      });

      console.log(
        `✅ Ranked ${scored.length} partners. Top: ${scored[0].name} (score: ${scored[0].score.toFixed(2)})`
      );

      return scored;
    } catch (error: any) {
      await this.handleError(error, 'ProviderRanker.rank');
      return [];
    }
  }

  private calculateScore(partner: PartnerCandidate): number {
    const ratingScore = (partner.rating / 5) * 100;
    const completionScore = partner.completionRate || 0;
    const distanceScore = Math.max(0, 100 - partner.distanceKm * 10);

    const totalScore =
      ratingScore * this.WEIGHT_RATING +
      completionScore * this.WEIGHT_COMPLETION +
      distanceScore * this.WEIGHT_DISTANCE;

    return parseFloat(totalScore.toFixed(2));
  }

  async getTop(partners: PartnerCandidate[], n: number = 3): Promise<RankedPartner[]> {
    const ranked = await this.rank(partners);
    return ranked.slice(0, n);
  }

  async getBest(partners: PartnerCandidate[]): Promise<RankedPartner | null> {
    const ranked = await this.rank(partners);
    return ranked.length > 0 ? ranked[0] : null;
  }
}

export default ProviderRankerAgent;