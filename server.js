import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "node:crypto";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(",").map((value) => value.trim())
    : true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    const error = new Error("Razorpay server credentials are not configured.");
    error.statusCode = 503;
    throw error;
  }
  return new Razorpay({ key_id, key_secret });
}

app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

app.post("/api/create-order", async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const currency = req.body?.currency || "INR";
    // amount is expressed in rupees by the existing browser booking flow.
    if (!Number.isFinite(amount) || amount <= 0 || amount > 500000 ||
        !["INR"].includes(currency)) {
      return res.status(400).json({ error: "Invalid payment amount or currency." });
    }
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `bpe_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: { service: "Bharat Pro Expert Home Services" },
    });
    return res.status(201).json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("create-order failed:", error.message);
    return res.status(status).json({ error: status === 503 ? error.message : "Unable to create payment order." });
  }
});

app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(
      (value) => typeof value === "string" && value.length > 0
    )) {
      return res.status(400).json({ verified: false, error: "Missing payment verification fields." });
    }
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({ verified: false, error: "Razorpay server credentials are not configured." });
    }
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    let received;
    try { received = Buffer.from(razorpay_signature, "hex"); }
    catch { return res.status(400).json({ verified: false, error: "Invalid signature format." }); }
    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ verified: false, error: "Payment signature verification failed." });
    }
    return res.status(200).json({
      verified: true,
      razorpay_order_id,
      razorpay_payment_id,
    });
  } catch (error) {
    console.error("verify-payment failed:", error.message);
    return res.status(500).json({ verified: false, error: "Unable to verify payment." });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Bharat Pro Expert API listening on port ${port}`));
