import express from "express";
const router = express.Router();
const SUPABASE_URL = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const MEMBERSHIP_TABLE = "admin_memberships";

// Server-side identity verification with Supabase Auth. Never accept client-supplied role claims.
async function identityFromRequest(req) {
  if (!SUPABASE_URL || !SERVICE_KEY) return { error: "Admin access is not configured on this server.", status: 503 };
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { error: "Sign in is required.", status: 401 };
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + match[1] },
    cache: "no-store"
  });
  if (!response.ok) return { error: "Session is invalid or expired.", status: 401 };
  const user = await response.json();
  if (!user?.id) return { error: "Session identity could not be confirmed.", status: 401 };
  if (!SERVICE_KEY) return { error: "Admin access is not configured on this server.", status: 503 };

  const membershipResponse = await fetch(
    SUPABASE_URL + "/rest/v1/" + MEMBERSHIP_TABLE +
    "?auth_user_id=eq." + encodeURIComponent(user.id) + "&active=eq.true&select=auth_user_id,role,active&limit=1",
    { headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY }, cache: "no-store" }
  );
  if (!membershipResponse.ok) {
    console.error("Admin membership lookup failed:", membershipResponse.status);
    return { error: "Admin access directory is unavailable. Configure and migrate admin access before use.", status: 503 };
  }
  const rows = await membershipResponse.json();
  const member = Array.isArray(rows) ? rows[0] : null;
  if (!member || member.auth_user_id !== user.id || member.active !== true ||
      typeof member.role !== "string" || !member.role.trim()) {
    return { error: "This account is not approved for administrator access.", status: 403 };
  }
  return { user, member };
}

router.get("/session", async (req, res) => {
  try {
    const result = await identityFromRequest(req);
    if (result.error) return res.status(result.status).json({ authorized: false, error: result.error });
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      authorized: true,
      role: result.member.role,
      user: { id: result.user.id, email: result.user.email || null, phone: result.user.phone || null }
    });
  } catch (error) {
    console.error("Admin session verification error:", error?.message || "Unknown error");
    return res.status(503).json({ authorized: false, error: "Unable to verify admin access." });
  }
});

// Deliberately no mock writes or fake list endpoints. Operational APIs will be added only
// after the canonical schema, RLS, permission map and mutation rules are audited.
router.all("*", (_req, res) => res.status(501).json({
  ok: false,
  code: "ADMIN_MODULE_NOT_IMPLEMENTED",
  error: "This admin operation is not enabled yet. No data was changed."
}));

export default router;
