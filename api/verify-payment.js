import crypto from "node:crypto";

function json(res, status, body) {
  return res.status(status).json(body);
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { verified: false, error: "Method not allowed." });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return json(res, 503, { verified: false, error: "Payment gateway is not configured on the server." });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(
    value => typeof value === "string" && value.length > 0
  )) {
    return json(res, 400, { verified: false, error: "Missing payment verification fields." });
  }

  const expected = crypto.createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();
  let received;
  try {
    received = Buffer.from(razorpay_signature, "hex");
  } catch {
    return json(res, 400, { verified: false, error: "Invalid signature format." });
  }

  if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
    return json(res, 400, { verified: false, error: "Payment signature verification failed." });
  }

  return json(res, 200, {
    verified: true,
    razorpay_order_id,
    razorpay_payment_id
  });
}
