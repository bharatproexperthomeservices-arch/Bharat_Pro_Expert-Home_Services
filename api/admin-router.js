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

router.get("/dashboard/stats", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    stats: {
      verifiedRevenue: 489500,
      totalBookings: 142,
      partnerApplications: 28,
      activePartners: 64,
      pendingKYC: 5,
      openTickets: 2,
      systemHealth: "100% Operational"
    }
  });
});

router.get("/website/:pageKey", authMiddleware, (req, res) => {
  res.json({ ok: true, message: `Draft content for ${req.params.pageKey}` });
});

router.put("/website/:pageKey/publish", authMiddleware, (req, res) => {
  res.json({ ok: true, message: `Published changes for ${req.params.pageKey} live!` });
});

router.get("/partners", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    partners: [
      { id: "p1", name: "Ramesh Kumar", phone: "9876543210", city: "Gurgaon", status: "approved", kycStatus: "verified" },
      { id: "p2", name: "Suresh Singh", phone: "9876543211", city: "Delhi", status: "pending", kycStatus: "pending" }
    ]
  });
});

router.patch("/partners/:id/approve", authMiddleware, (req, res) => {
  res.json({ ok: true, message: `Partner ${req.params.id} approved successfully.` });
});

router.get("/bookings", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    bookings: []
  });
});

export default router;
