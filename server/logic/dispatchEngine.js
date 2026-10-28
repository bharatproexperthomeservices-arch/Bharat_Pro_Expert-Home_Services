// server/logic/dispatchEngine.js

/**
 * Calculates straight-line distance in kilometers between two lat/lng coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 100) / 100;
}

/**
 * Validates whether a partner can be manually assigned to a booking.
 *
 * Requirements:
 * 1. Partner must be free (no conflicting active bookings in assigned/en_route/in_progress).
 * 2. Partner must possess required skill tag for service category.
 * 3. Partner location must be within 15 km of booking location.
 */
export function validateManualDispatch(booking, partner, activeBookings = []) {
  if (!booking) throw new Error('Dispatch validation failed: Booking is required');
  if (!partner) throw new Error('Dispatch validation failed: Partner is required');

  // Check 1: Skill tag match
  const requiredSkill = booking.category || booking.serviceCategory;
  const partnerSkills = partner.skillTags || partner.skills || [];
  const hasSkill = partnerSkills.some(skill => skill.toLowerCase() === (requiredSkill || '').toLowerCase());

  if (!hasSkill) {
    return {
      eligible: false,
      reason: `Partner '${partner.name}' lacks required skill tag '${requiredSkill}'. Partner skills: [${partnerSkills.join(', ')}]`
    };
  }

  // Check 2: Availability (no active conflicting booking)
  const isBusy = activeBookings.some(
    b => b.partnerId === partner.id && ['ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS'].includes(b.status) && b.id !== booking.id
  );

  if (isBusy) {
    return {
      eligible: false,
      reason: `Partner '${partner.name}' is currently busy with another active job in time slot`
    };
  }

  // Check 3: Proximity within 15km radius
  const bLat = booking.location?.lat ?? booking.lat;
  const bLng = booking.location?.lng ?? booking.lng;
  const pLat = partner.location?.lat ?? partner.lat;
  const pLng = partner.location?.lng ?? partner.lng;

  const distanceKm = calculateDistanceKm(bLat, bLng, pLat, pLng);

  if (distanceKm > 15) {
    return {
      eligible: false,
      reason: `Partner '${partner.name}' is ${distanceKm} km away, exceeding maximum dispatch radius of 15 km`
    };
  }

  return {
    eligible: true,
    distanceKm,
    reason: `Partner passed all dispatch checks (${distanceKm} km distance, skill matched, available)`
  };
}

/**
 * Weighted score algorithm to find best partner:
 * Score = (skillMatch * 40) + (proximityScore * 25) + (availabilityScore * 15) + (ratingScore * 10) + (fairnessScore * 10)
 *
 * Fairness Score = inverse of jobs assigned in last 24h (prevents over-assignment)
 */
export function findBestPartner(booking, partners = [], activeBookings = [], jobs24hMap = {}) {
  const ranked = partners.map(partner => {
    const validation = validateManualDispatch(booking, partner, activeBookings);

    if (!validation.eligible) {
      return {
        partner,
        eligible: false,
        reason: validation.reason,
        score: -1
      };
    }

    // 1. Skill Match Score (40 pts)
    const skillScore = 40;

    // 2. Proximity Score (25 pts): 15km = 0 pts, 0km = 25 pts
    const dist = validation.distanceKm;
    const proximityScore = Math.max(0, (1 - dist / 15) * 25);

    // 3. Availability Score (15 pts): 15 pts if free
    const availabilityScore = 15;

    // 4. Rating Score (10 pts): (avgRating / 5) * 10
    const rating = partner.avgRating || 4.0;
    const ratingScore = (rating / 5) * 10;

    // 5. Fairness Score (10 pts): 10 / (assignedJobs24h + 1)
    const jobs24h = jobs24hMap[partner.id] || 0;
    const fairnessScore = 10 / (jobs24h + 1);

    const totalScore = Math.round((skillScore + proximityScore + availabilityScore + ratingScore + fairnessScore) * 100) / 100;

    return {
      partner,
      eligible: true,
      score: totalScore,
      distanceKm: dist,
      breakdown: {
        skillScore,
        proximityScore: Math.round(proximityScore * 100) / 100,
        availabilityScore,
        ratingScore: Math.round(ratingScore * 100) / 100,
        fairnessScore: Math.round(fairnessScore * 100) / 100
      }
    };
  });

  // Sort eligible partners descending by score
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

/**
 * Auto-reassignment logic: selects next best eligible partner when current partner times out or declines.
 */
export function autoReassign(booking, candidates = [], currentPartnerId = null) {
  const availableCandidates = candidates.filter(c => c.eligible && c.partner.id !== currentPartnerId);

  if (availableCandidates.length === 0) {
    return {
      success: false,
      selectedPartner: null,
      reason: 'No eligible backup partners available within dispatch radius'
    };
  }

  const bestNext = availableCandidates[0];
  return {
    success: true,
    selectedPartner: bestNext.partner,
    score: bestNext.score,
    reason: `Auto-assigned next best partner ${bestNext.partner.name} (Score: ${bestNext.score})`
  };
}
