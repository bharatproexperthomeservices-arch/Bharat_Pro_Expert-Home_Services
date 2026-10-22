function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { verified: false, error: "Method not allowed." });
  }

  const appId = typeof process.env.CASHFREE_APP_ID === "string" ? process.env.CASHFREE_APP_ID.trim() : "";
  const secretKey = typeof process.env.CASHFREE_SECRET_KEY === "string" ? process.env.CASHFREE_SECRET_KEY.trim() : "";
  const mode = String(process.env.CASHFREE_ENV || "sandbox").trim().toLowerCase();
  if (!appId || !secretKey || !["sandbox", "production"].includes(mode)) {
    return json(res, 503, {
      verified: false,
      error: "Cashfree is not configured on this deployment.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
    });
  }

  const { order_id: orderId, bookingId, expectedAmount } = req.body || {};
  if (typeof orderId !== "string" || !/^bpe_[a-zA-Z0-9_-]{8,40}$/.test(orderId) ||
      typeof bookingId !== "string" || bookingId !== orderId) {
    return json(res, 400, { verified: false, error: "Missing or invalid Cashfree order reference." });
  }

  const baseUrl = mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const headers = {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": "2025-01-01",
    "Accept": "application/json"
  };

  try {
    const [orderResponse, paymentsResponse] = await Promise.all([
      fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, { headers }),
      fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, { headers })
    ]);
    const order = await orderResponse.json().catch(() => ({}));
    const payments = await paymentsResponse.json().catch(() => []);
    if (!orderResponse.ok || !paymentsResponse.ok || !Array.isArray(payments)) {
      console.error("Cashfree payment status lookup failed:", orderResponse.status, paymentsResponse.status);
      return json(res, 502, { verified: false, error: "Unable to confirm payment with Cashfree. Please retry or contact support." });
    }

    const successfulPayment = payments.find((payment) =>
      payment.payment_status === "SUCCESS" &&
      payment.payment_currency === "INR" &&
      Number(payment.payment_amount) === Number(order.order_amount)
    );
    const amount = Number(order.order_amount);
    if (order.order_id !== orderId || order.order_currency !== "INR" ||
        order.order_status !== "PAID" || !Number.isFinite(amount) || amount <= 0 ||
        (Number.isFinite(Number(expectedAmount)) && Number(expectedAmount) !== amount) ||
        !successfulPayment) {
      return json(res, 409, {
        verified: false,
        status: order.order_status || "UNKNOWN",
        error: "Cashfree has not confirmed a successful payment for this booking yet."
      });
    }

    return json(res, 200, {
      verified: true,
      bookingId,
      order_id: order.order_id,
      payment_id: String(successfulPayment.cf_payment_id || successfulPayment.payment_id || ""),
      amount,
      amountPaise: Math.round(amount * 100),
      currency: "INR",
      status: "SUCCESS"
    });
  } catch (error) {
    console.error("Cashfree payment verification failed:", error?.message || "Unknown error");
    return json(res, 502, { verified: false, error: "Unable to confirm payment with Cashfree. Please contact support before retrying." });
  }
}
