function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { verified: false, error: "Method not allowed." });
  }

  const { gateway, razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, order_id: orderId } = req.body || {};

  // --- Razorpay Payment Verification ---
  if (gateway === "razorpay" || (razorpay_order_id && razorpay_payment_id && razorpay_signature)) {
    const razorpaySecret = typeof process.env.RAZORPAY_KEY_SECRET === "string" ? process.env.RAZORPAY_KEY_SECRET.trim() : "";
    if (!razorpaySecret) {
      return json(res, 503, {
        verified: false,
        error: "Razorpay is not configured on this deployment.",
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        missingVariables: ["RAZORPAY_KEY_SECRET"]
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(res, 400, { verified: false, error: "Missing required Razorpay payment verification fields." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Razorpay signature mismatch for order:", razorpay_order_id);
      return json(res, 400, { verified: false, error: "Invalid payment signature verification failed." });
    }

    return json(res, 200, {
      verified: true,
      bookingId: bookingId || razorpay_order_id,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      gateway: "razorpay",
      status: "PAID"
    });
  }

  // --- Cashfree Payment Verification ---
  const clientId = typeof process.env.CASHFREE_APP_ID === "string" ? process.env.CASHFREE_APP_ID.trim() : "";
  const clientSecret = typeof process.env.CASHFREE_SECRET_KEY === "string" ? process.env.CASHFREE_SECRET_KEY.trim() : "";
  const razorpayKeyId = typeof process.env.RAZORPAY_KEY_ID === "string" ? process.env.RAZORPAY_KEY_ID.trim() : "";

  if (!clientId || !clientSecret) {
    if (!razorpayKeyId) {
      return json(res, 503, {
        verified: false,
        error: "No online payment gateway is configured on this deployment.",
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        missingVariables: ["RAZORPAY_KEY_SECRET", "CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"]
      });
    }
    return json(res, 503, {
      verified: false,
      error: "Cashfree is not configured on this deployment.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      missingVariables: [!clientId && "CASHFREE_APP_ID", !clientSecret && "CASHFREE_SECRET_KEY"].filter(Boolean)
    });
  }
  if (typeof bookingId !== "string" || !/^bpe_[a-zA-Z0-9_-]{8,100}$/.test(bookingId) ||
      typeof orderId !== "string" || orderId !== bookingId.slice(0, 45)) {
    return json(res, 400, { verified: false, error: "Missing or invalid Cashfree order reference." });
  }

  const isProduction = process.env.CASHFREE_ENV === "production";
  const apiBase = isProduction ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const headers = {
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
    "x-api-version": "2025-01-01",
    "Accept": "application/json"
  };

  try {
    const [orderResponse, paymentsResponse] = await Promise.all([
      fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}`, { headers }),
      fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}/payments`, { headers })
    ]);
    const order = await orderResponse.json().catch(() => ({}));
    const payments = await paymentsResponse.json().catch(() => []);
    if (!orderResponse.ok || !paymentsResponse.ok) {
      console.error("Cashfree payment status lookup failed:", orderResponse.status, paymentsResponse.status);
      return json(res, 502, { verified: false, error: "Could not confirm payment status with Cashfree. Please retry or contact support." });
    }

    const amountInPaise = Math.round(Number(order.order_amount) * 100);
    const successfulPayment = Array.isArray(payments)
      ? payments.find((payment) =>
          payment?.payment_status === "SUCCESS" &&
          payment?.order_id === orderId &&
          Math.round(Number(payment?.payment_amount) * 100) === amountInPaise
        )
      : null;
    if (order.order_id !== orderId || order.order_currency !== "INR" ||
        order.order_status !== "PAID" || !successfulPayment ||
        !Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      return json(res, 409, { verified: false, error: "Cashfree has not confirmed a successful payment for this booking yet." });
    }

    return json(res, 200, {
      verified: true,
      bookingId,
      order_id: orderId,
      payment_id: String(successfulPayment.cf_payment_id || successfulPayment.payment_id || orderId),
      amount: amountInPaise,
      currency: "INR",
      status: "PAID"
    });
  } catch (error) {
    console.error("Cashfree payment verification failed:", error?.message || "Unknown error");
    return json(res, 502, { verified: false, error: "Unable to confirm payment with Cashfree. Please contact support before retrying." });
  }
}
