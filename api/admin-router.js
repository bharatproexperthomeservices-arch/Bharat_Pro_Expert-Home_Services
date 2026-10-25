import express from "express";

const router = express.Router();

// Auth middleware for RBAC token validation
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || token !== "Bearer mock-super-admin-token-xyz") {
    return res.status(401).json({ ok: false, error: "Unauthorized access: Invalid or missing token" });
  }
  next();
};

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASS;

  const isEmailMatch = !email || !adminEmail || email.toLowerCase() === adminEmail.toLowerCase();
  if (adminPass && password === adminPass && isEmailMatch) {
    return res.json({
      ok: true,
      token: "Bearer mock-super-admin-token-xyz",
      user: { name: "Super Admin", email: email || adminEmail || "admin@bharatproexpert.com", role: "SUPER_ADMIN" }
    });
  }
  return res.status(401).json({ ok: false, error: "Invalid credentials" });
});

router.get("/dashboard/stats", authMiddleware, (_req, res) => {
  res.json({
    ok: true,
    message: "Admin panel functions and data permanently cleared.",
    stats: {
      verifiedRevenue: 0,
      totalBookings: 0,
      partnerApplications: 0,
      activePartners: 0
    }
  });
});

router.get("/website/:pageKey", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Content data cleared." });
});

router.put("/website/:pageKey/publish", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "No data to publish." });
});

router.get("/partners", authMiddleware, (_req, res) => {
  res.json({
    ok: true,
    partners: []
  });
});

router.patch("/partners/:id/approve", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Action cleared." });
});

router.patch("/partners/:id/kyc-verify", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Action cleared." });
});

router.post("/partners/:id/wallet-adjust", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Action cleared." });
});

router.get("/bookings", authMiddleware, (_req, res) => {
  res.json({
    ok: true,
    bookings: []
  });
});

router.patch("/bookings/:id/status", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Action cleared." });
});

router.patch("/bookings/:id/assign", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Action cleared." });
});

router.post("/catalogue/services", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Catalogue management cleared." });
});

router.post("/coupons", authMiddleware, (_req, res) => {
  res.json({ ok: true, message: "Coupon management cleared." });
});

export default router;
