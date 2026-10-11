function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { verified: false, error: "Method not allowed." });
  }

  const clientId = typeof process.env.CASHFREE_APP_ID === "string" ? process.env.CASHFREE_APP_ID.trim() : "";
  const clientSecret = typeof process.env.CASHFREE_SECRET_KEY === "string" ? process.env.CASHFREE_SECRET_KEY.trim() : "";
  if (!clientId || !clientSecret) {
    return json(res, 503, {
      verified: false,
      error: "Cashfree is not configured on this deployment.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      missingVariables: [!clientId && "CASHFREE_APP_ID", !clientSecret && "CASHFREE_SECRET_KEY"].filter(Boolean)
    });
  }

  const { bookingId, order_id: orderId } = req.body || {};
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
