// Vercel serverless route: /api/admin/session
// Mirrors the Express admin router's identity + membership checks.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ authorized: false, error: "Method not allowed." });
  }
  const projectUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const secret = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!projectUrl || !secret) {
    return res.status(503).json({ authorized: false, error: "Admin access is not configured on this server." });
  }
  const auth = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!auth) return res.status(401).json({ authorized: false, error: "Sign in is required." });
  try {
    const userResponse = await fetch(projectUrl + "/auth/v1/user", {
      headers: { apikey: secret, Authorization: "Bearer " + auth[1] },
      cache: "no-store"
    });
    if (!userResponse.ok) return res.status(401).json({ authorized: false, error: "Session is invalid or expired." });
    const user = await userResponse.json();
    if (!user?.id) return res.status(401).json({ authorized: false, error: "Session identity could not be confirmed." });
    const lookup = await fetch(projectUrl + "/rest/v1/admin_memberships?auth_user_id=eq." +
      encodeURIComponent(user.id) + "&active=eq.true&select=auth_user_id,role,active&limit=1", {
        headers: { apikey: secret, Authorization: "Bearer " + secret },
        cache: "no-store"
      });
    if (!lookup.ok) {
      console.error("Admin membership lookup failed:", lookup.status);
      return res.status(503).json({ authorized: false, error: "Admin access directory is unavailable." });
    }
    const memberships = await lookup.json();
    const member = Array.isArray(memberships) ? memberships[0] : null;
    if (!member || member.auth_user_id !== user.id || member.active !== true ||
        typeof member.role !== "string" || !member.role.trim()) {
      return res.status(403).json({ authorized: false, error: "This account is not approved for administrator access." });
    }
    return res.status(200).json({
      authorized: true,
      role: member.role,
      user: { id: user.id, email: user.email || null, phone: user.phone || null }
    });
  } catch (error) {
    console.error("Admin session verification error:", error?.message || "Unknown error");
    return res.status(503).json({ authorized: false, error: "Unable to verify admin access." });
  }
}
