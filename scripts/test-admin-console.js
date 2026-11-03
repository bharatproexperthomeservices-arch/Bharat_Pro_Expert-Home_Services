import assert from "node:assert/strict";
import fs from "node:fs";

const router = fs.readFileSync("api/admin-router.js", "utf8");
const page = fs.readFileSync("public/admin/index.html", "utf8");
const script = fs.readFileSync("public/admin/admin.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/202611030001_admin_memberships.sql", "utf8");
const queueApi = fs.readFileSync("api/admin/bookings.js", "utf8");
const sessionApi = fs.readFileSync("api/admin/session.js", "utf8");
const configApi = fs.readFileSync("api/admin/config.js", "utf8");
const createOrder = fs.readFileSync("api/create-order.js", "utf8");
const paymentVerify = fs.readFileSync("api/verify-payment.js", "utf8");

assert.match(router, /\/auth\/v1\/user/, "Admin API verifies identity against Supabase Auth");
assert.match(router, /admin_memberships/, "Admin API checks persistent membership");
assert.match(router, /active=eq\.true/, "Inactive admin access must not be accepted");
assert.match(router, /ADMIN_MODULE_NOT_IMPLEMENTED/, "Unbuilt operations must fail closed");
assert.doesNotMatch(router, /mock-super-admin-token-xyz/, "Mock super-admin credential must not remain");
assert.doesNotMatch(router, /router\.(get|post|patch|put)\("\/(partners|bookings|coupons)/, "Placeholder data mutation/list routes must not remain");
assert.match(page, /Secure sign in/, "Admin portal has an actual sign-in form");
assert.match(page, /Backend integration pending/, "Unimplemented modules are explicitly marked");
assert.match(script, /signInWithPassword/, "Sign-in uses Supabase Auth");
assert.match(script, /\/api\/admin\/session/, "Session authorization calls trusted backend");
assert.match(script, /data\.authorized!==true/, "UI requires positive server authorization");
assert.match(migration, /enable row level security/i, "Membership table enables RLS");
assert.match(migration, /revoke all on table public\.admin_memberships from anon, authenticated/i, "Browser roles cannot read membership table");
console.log("Admin console security/placeholder regression checks passed.");
