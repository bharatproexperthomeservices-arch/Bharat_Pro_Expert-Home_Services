import Razorpay from "razorpay";
import crypto from "node:crypto";
import { ADDON_PRICES, CONVENIENCE_FEE_INR, COUPON_CODES, GST_RATE, SERVICE_PRICES } from "./pricing-catalog.js";

function json(res, status, body) {
  return res.status(status).json(body);
}

function calculateQuote(body) {
  let subtotal = 0;
  let primaryServiceId = "";

  const items = Array.isArray(body?.items) && body.items.length > 0 ? body.items : null;

  if (items) {
    for (const item of items) {
      const id = typeof item === "string" ? item : (typeof item?.id === "string" ? item.id : "");
      const qty = typeof item === "object" && Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1;
      const service = SERVICE_PRICES[id];
      if (!service) {
        return { error: `Selected cleaning service (${id}) is not in the approved catalogue.`, code: "UNKNOWN_SERVICE" };
      }
      subtotal += service.price * qty;
      if (!primaryServiceId) primaryServiceId = id;
    }
  } else {
    const requestedServiceId = typeof body?.serviceId === "string" ? body.serviceId : "";
    const requestedServiceName = typeof body?.serviceName === "string"
      ? body.serviceName.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN")
      : "";
    const matchedEntry = Object.entries(SERVICE_PRICES).find(([, item]) =>
      item.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN") === requestedServiceName
    );
    const serviceId = Object.prototype.hasOwnProperty.call(SERVICE_PRICES, requestedServiceId)
      ? requestedServiceId
      : (matchedEntry ? matchedEntry[0] : "");
    const service = serviceId ? SERVICE_PRICES[serviceId] : null;
    if (!service) {
      return { error: "Selected cleaning service is not in the approved catalogue. Please contact support so the service can be added safely.", code: "UNKNOWN_SERVICE" };
    }
    subtotal = service.price;
    primaryServiceId = serviceId;
  }

  const requestedAddons = body?.addons === undefined ? [] : body.addons;
  if (!Array.isArray(requestedAddons) || requestedAddons.length > 30) {
    return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
  }

  const normalizedAddonIds = [];
  for (const candidate of requestedAddons) {
    let requestedId = "";
    let requestedName = "";
    if (typeof candidate === "string") {
      requestedId = candidate;
    } else if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      requestedId = typeof candidate.id === "string" ? candidate.id : "";
      requestedName = typeof candidate.name === "string"
        ? candidate.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN")
        : "";
    } else {
      return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
    }

    let canonicalId = Object.prototype.hasOwnProperty.call(ADDON_PRICES, requestedId) ? requestedId : "";
    if (!canonicalId && requestedName) {
      const matchedAddon = Object.entries(ADDON_PRICES).find(([, item]) =>
        item.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN") === requestedName
      );
      if (matchedAddon) canonicalId = matchedAddon[0];
    }
    if (!canonicalId) {
      return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
    }
    normalizedAddonIds.push(canonicalId);
  }

  if (new Set(normalizedAddonIds).size !== normalizedAddonIds.length) {
    return { error: "Duplicate add-ons are not allowed. Refresh the booking and try again.", code: "INVALID_ADDONS" };
  }
  const addonsPrice = normalizedAddonIds.reduce((sum, id) => sum + ADDON_PRICES[id].price, 0);
  subtotal += addonsPrice;
  const gst = Math.round(subtotal * GST_RATE);
  const convenienceFee = CONVENIENCE_FEE_INR;
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
  const discount = COUPON_CODES.has(couponCode) ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + gst + convenienceFee - discount;

  if (!Number.isSafeInteger(total) || total <= 0 || total > 500000) {
    return { error: "Calculated checkout total is invalid. Please contact support.", code: "INVALID_SERVER_TOTAL" };
  }
  return { quote: { serviceId: primaryServiceId, basePrice: subtotal - addonsPrice, addonsPrice, subtotal, gst, convenienceFee, discount, couponCode: discount ? couponCode : null, total } };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  const requestedPaymentMethod = String(req.body?.paymentMethod || "").trim().toUpperCase().replace(/[\\s/-]+/g, "_");
  if (["COD", "CASH_ON_DELIVERY", "PAY_AFTER_SERVICE"].includes(requestedPaymentMethod)) {
    return json(res, 400, { error: "Cash on Delivery is permanently disabled. Complete online payment to book this service.", code: "COD_DISABLED" });
  }

  const currency = req.body?.currency || "INR";
  if (currency !== "INR") {
    return json(res, 400, { error: "Only INR checkout is supported.", code: "INVALID_CURRENCY" });
  }

  const calculated = calculateQuote(req.body);
  if (calculated.error) return json(res, 400, { error: calculated.error, code: calculated.code });
  const quote = calculated.quote;
  if (req.body?.mode === "quote") {
    return json(res, 200, { quote, currency: "INR", paymentMethod: "ONLINE" });
  }

  const appId = typeof process.env.CASHFREE_APP_ID === "string" ? process.env.CASHFREE_APP_ID.trim() : "";
  const secretKey = typeof process.env.CASHFREE_SECRET_KEY === "string" ? process.env.CASHFREE_SECRET_KEY.trim() : "";
  const mode = String(process.env.CASHFREE_ENV || "sandbox").trim().toLowerCase();
  const publicAppUrl = String(process.env.PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")).trim().replace(/\/$/, "");
  const missingVariables = [];
  if (!appId) missingVariables.push("CASHFREE_APP_ID");
  if (!secretKey) missingVariables.push("CASHFREE_SECRET_KEY");
  if (!["sandbox", "production"].includes(mode)) missingVariables.push("CASHFREE_ENV (sandbox or production)");
  if (!publicAppUrl) missingVariables.push("PUBLIC_APP_URL");
  if (missingVariables.length > 0) {
    console.error("Cashfree order endpoint missing configuration:", missingVariables.join(", "));
    return json(res, 503, {
      error: "Cashfree is not configured on this deployment. Add the listed Vercel Environment Variables and redeploy.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      missingVariables
    });
  }

  const bookingId = typeof req.body?.bookingId === "string" ? req.body.bookingId.slice(0, 45) : "";
  if (!/^bpe_[a-zA-Z0-9_-]{8,40}$/.test(bookingId)) {
    return json(res, 400, { error: "Invalid booking reference. Refresh the booking and retry.", code: "INVALID_BOOKING_REFERENCE" });
  }

  const clientTotal = Number(req.body?.clientTotal);
  if (!Number.isSafeInteger(clientTotal) || clientTotal !== quote.total) {
    return json(res, 409, {
      error: "The booking price changed or the displayed total is out of date. Refresh the booking and try again.",
      code: "CHECKOUT_TOTAL_MISMATCH",
      quote
    });
  }

  const customerPhone = String(req.body?.customerPhone || "").replace(/\D/g, "").slice(-10);
  if (!/^\d{10}$/.test(customerPhone)) {
    return json(res, 400, { error: "Enter a valid 10-digit mobile number to continue with payment.", code: "INVALID_CUSTOMER_PHONE" });
  }
  const customerName = String(req.body?.customerName || "Bharat Pro Expert Customer").trim().slice(0, 100) || "Customer";
  const customerEmail = String(req.body?.customerEmail || "").trim().slice(0, 100);
  const baseUrl = mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2025-01-01",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        order_id: bookingId,
        order_amount: Number(quote.total.toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: bookingId.slice(0, 50),
          customer_name: customerName,
          customer_email: customerEmail || "customer@bharatproexpert.com",
          customer_phone: customerPhone
        },
        order_meta: {
          return_url: `${publicAppUrl}/?payment=return&order_id={order_id}`
        },
        order_note: `Bharat Pro Expert booking - ${quote.serviceId}`,
        order_tags: {
          bookingId,
          serviceId: quote.serviceId,
          subtotalInr: String(quote.subtotal),
          gstInr: String(quote.gst),
          convenienceFeeInr: String(quote.convenienceFee),
          discountInr: String(quote.discount)
        }
      })
    });
    const order = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Cashfree order creation failed:", response.status, order?.message || order?.type || "provider_error");
      return json(res, 502, {
        error: response.status === 401
          ? "Cashfree rejected the server credentials. Check that the App ID and Secret Key belong to the selected environment."
          : "Cashfree could not create the order. Check Vercel Function Logs and retry.",
        code: "CASHFREE_ORDER_CREATION_FAILED"
      });
    }
    if (order.order_id !== bookingId || !order.payment_session_id ||
        order.order_currency !== "INR" || Number(order.order_amount) !== quote.total) {
      console.error("Cashfree returned an order that did not match the server-calculated amount/currency.");
      return json(res, 502, { error: "Cashfree returned an invalid order. Please retry.", code: "INVALID_GATEWAY_ORDER" });
    }
    return json(res, 201, {
      order_id: order.order_id,
      payment_session_id: order.payment_session_id,
      amount: quote.total,
      currency: "INR",
      environment: mode,
      quote
    });
  } catch (error) {
    console.error("Cashfree order creation failed:", error?.message || "Unknown error");
    return json(res, 502, {
      error: "Unable to connect to Cashfree. Please retry in a moment.",
      code: "CASHFREE_ORDER_CREATION_FAILED"
    });
  }
}
