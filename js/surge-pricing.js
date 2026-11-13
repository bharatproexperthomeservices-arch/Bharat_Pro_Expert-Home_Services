// Surge pricing helper. The server remains authoritative for payable totals.
export function isSurgeRuleActive(rule, { city, category, now = new Date() }) {
  if (!rule?.is_active || String(rule.city).toLowerCase() !== String(city).toLowerCase()) return false;
  if (rule.service_category && String(rule.service_category).toLowerCase() !== String(category).toLowerCase()) return false;
  const current = now.toTimeString().slice(0,8);
  const start = String(rule.start_time).slice(0,8), end = String(rule.end_time).slice(0,8);
  return start < end ? current >= start && current < end : current >= start || current < end;
}
export async function getSurgeQuote(supabase, { basePrice, city, category, now = new Date() }) {
  const { data, error } = await supabase.from('surge_rules').select('*').eq('is_active', true).ilike('city', city);
  if (error) throw error;
  const match = (data || []).filter(rule => isSurgeRuleActive(rule, { city, category, now }))
    .sort((a,b) => Number(b.multiplier) - Number(a.multiplier))[0];
  const multiplier = match ? Number(match.multiplier) : 1;
  const base = Math.max(0, Number(basePrice) || 0);
  return { basePrice: base, multiplier, finalPrice: Math.round(base * multiplier), surgeApplied: multiplier > 1, ruleId: match?.id || null };
}
