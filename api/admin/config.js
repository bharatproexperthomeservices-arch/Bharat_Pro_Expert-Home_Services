// Public Supabase project configuration for the separate admin page.
// The anon/publishable key is public by design; RLS and server authorization remain mandatory.
export default function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !key) {
    return res.status(503).json({ configured: false, error: "Admin portal configuration is incomplete." });
  }
  return res.status(200).json({ configured: true, url, anonKey: key });
}
