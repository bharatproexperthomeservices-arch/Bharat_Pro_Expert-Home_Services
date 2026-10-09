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
    // SECURITY NOTE: this amount is currently client-supplied. It must be replaced
    // by a server-calculated quote from a trusted catalogue before live payments.
    if (!Number.isFinite(amount) || amount <= 0 || amount > 500000 ||
        !Number.isSafeInteger(Math.round(amount * 100)) || currency !== "INR") {
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

app.post("/api/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(
      (value) => typeof value === "string" && value.length > 0 && value.length <= 256
    )) {
      return res.status(400).json({ verified: false, error: "Missing or invalid payment verification fields." });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !secret) {
      return res.status(503).json({ verified: false, error: "Razorpay server credentials are not configured." });
    }

    const expected = crypto.createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({ verified: false, error: "Invalid signature format." });
    }
    const received = Buffer.from(razorpay_signature, "hex");
    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ verified: false, error: "Payment signature verification failed." });
    }

    // Verify the transaction with Razorpay itself; a valid signature alone is not
    // enough to prove the payment was captured or matched to this order.
    const razorpay = new Razorpay({ key_id, key_secret });
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);
    if (payment.order_id !== order.id ||
        payment.order_id !== razorpay_order_id ||
        order.currency !== "INR" ||
        payment.currency !== "INR" ||
        payment.amount !== order.amount ||
        payment.status !== "captured") {
      return res.status(409).json({
        verified: false,
        error: "Payment is not captured or does not match the order. Please contact support before retrying.",
      });
    }

    return res.status(200).json({
      verified: true,
      razorpay_order_id: order.id,
      razorpay_payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    });
  } catch (error) {
    console.error("verify-payment failed:", error?.message || "Unknown error");
    return res.status(502).json({
      verified: false,
      error: "Unable to confirm captured payment with Razorpay. Please contact support before retrying.",
    });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Bharat Pro Expert API listening on port ${port}`));
