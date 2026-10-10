import Razorpay from "razorpay";
import crypto from "node:crypto";
import { ADDON_PRICES, CONVENIENCE_FEE_INR, COUPON_CODES, GST_RATE, SERVICE_PRICES } from "./pricing-catalog.js";

function json(res, status, body) {
  return res.status(status).json(body);
}

function calculateQuote(body) {
  const serviceId = typeof body?.serviceId === "string" ? body.serviceId : "";
  const service = SERVICE_PRICES[serviceId];
  if (!service) {
    return { error: "Selected cleaning service is not in the approved catalogue. Refresh the page and select the service again.", code: "UNKNOWN_SERVICE" };
  }

  const requestedAddons = body?.addons === undefined ? [] : body.addons;
  if (!Array.isArray(requestedAddons) || requestedAddons.length > 30 ||
      requestedAddons.some(id => typeof id !== "string" || !Object.prototype.hasOwnProperty.call(ADDON_PRICES, id)) ||
      new Set(requestedAddons).size !== requestedAddons.length) {
    return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
  }

  const addonsPrice = requestedAddons.reduce((sum, id) => sum + ADDON_PRICES[id].price, 0);
  const subtotal = service.price + addonsPrice;
  const gst = Math.round(subtotal * GST_RATE);
  const convenienceFee = CONVENIENCE_FEE_INR;
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
  const discount = COUPON_CODES.has(couponCode) ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + gst + convenienceFee - discount;

  if (!Number.isSafeInteger(total) || total <= 0 || total > 500000) {
    return { error: "Calculated checkout total is invalid. Please contact support.", code: "INVALID_SERVER_TOTAL" };
  }
  return { quote: { serviceId, basePrice: service.price, addonsPrice, subtotal, gst, convenienceFee, discount, couponCode: discount ? couponCode : null, total } };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  // Key ID is public; support the existing Vercel variable and the preferred server-side name.
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    console.error("Razorpay order endpoint is missing server credentials.");
    return json(res, 503, {
      error: "Payment gateway is not configured. In Vercel Environment Variables, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then redeploy.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
    });
  }

  const currency = req.body?.currency || "INR";
  if (currency !== "INR") {
    return json(res, 400, { error: "Only INR checkout is supported.", code: "INVALID_CURRENCY" });
  }

  const calculated = calculateQuote(req.body);
  if (calculated.error) return json(res, 400, { error: calculated.error, code: calculated.code });
  const quote = calculated.quote;
  const bookingId = typeof req.body?.bookingId === "string" ? req.body.bookingId.slice(0, 100) : "";
  if (!/^bpe_[a-zA-Z0-9_-]{8,100}$/.test(bookingId)) {
    return json(res, 400, { error: "Invalid booking reference. Refresh the booking and retry.", code: "INVALID_BOOKING_REFERENCE" });
  }

  // Reject stale/tampered client totals; the server's catalogue is authoritative.
  const clientTotal = Number(req.body?.clientTotal);
  if (!Number.isSafeInteger(clientTotal) || clientTotal !== quote.total) {
    return json(res, 409, {
      error: "The booking price changed or the displayed total is out of date. Refresh the booking and try again.",
      code: "CHECKOUT_TOTAL_MISMATCH",
      quote
    });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const amountPaise = quote.total * 100;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bpe_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: {
        serviceId: quote.serviceId,
        bookingId,
        subtotalInr: String(quote.subtotal),
        gstInr: String(quote.gst),
        convenienceFeeInr: String(quote.convenienceFee),
        discountInr: String(quote.discount)
      }
    });

    if (!order?.id || !Number.isSafeInteger(order.amount) ||
        order.amount !== amountPaise || order.currency !== "INR") {
      console.error("Razorpay returned an order that did not match the server-calculated amount/currency.");
      return json(res, 502, { error: "Razorpay returned an invalid order. Please retry.", code: "INVALID_GATEWAY_ORDER" });
    }
    return json(res, 201, { id: order.id, amount: order.amount, currency: order.currency, quote });
  } catch (error) {
    const providerStatus = error?.statusCode || error?.status;
    const providerMessage = error?.error?.description || error?.description || error?.message || "";
    console.error("Razorpay order creation failed:", providerStatus || "provider_error", providerMessage);
    return json(res, 502, {
      error: providerStatus === 401 || /authentication|authorization|key_id|key_secret|credentials/i.test(providerMessage)
        ? "Razorpay rejected the server credentials. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET belong to the same TEST or LIVE mode."
        : "Razorpay could not create the order. Check Vercel Function Logs for the provider error, then retry.",
      code: "RAZORPAY_ORDER_CREATION_FAILED"
    });
  }
}
