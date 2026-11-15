import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
export const isSupabaseConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
  Boolean(key) && !/^(your-|placeholder|changeme)/i.test(key);
export const supabase = isSupabaseConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export async function requireAdmin(user) {
  if (!supabase || !user) return false;
  const { data, error } = await supabase.from('admin_users').select('user_id,email,role').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}