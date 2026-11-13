// Wallet/referral API client. All balance changes are server-authoritative and idempotent.
async function postJson(url, payload) {
  const response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
export const redeemReferral = referralCode => postJson('/api/referrals/redeem', { referralCode });
export const getWalletSummary = async () => {
  const response = await fetch('/api/wallet/summary');
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Wallet could not be loaded.');
  return result;
};
export const calculateWalletCheckout = (total, balance, enabled) => {
  const gross = Math.max(0, Number(total) || 0);
  const available = Math.max(0, Number(balance) || 0);
  const walletUsed = enabled ? Math.min(gross, available) : 0;
  return { gross, walletUsed, razorpayAmount: Math.max(0, gross - walletUsed) };
};
// Invoke only after verified payment from the server. Never deduct on a client toggle.
export const commitWalletDebit = payload => postJson('/api/wallet/commit-debit', payload);
