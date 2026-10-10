import Razorpay from "razorpay";
import crypto from "node:crypto";
import { ADDON_PRICES, CONVENIENCE_FEE_INR, COUPON_CODES, GST_RATE, SERVICE_PRICES } from "./pricing-catalog.js";

function json(res, status, body) {
  return res.status(status).json(body);
}

function calculateQuote(body) {
  const requestedServiceId = typeof body?.serviceId === "string" ? body.serviceId : "";
  const requestedServiceName = typeof body?.serviceName === "string"
    ? body.serviceName.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN")
    : "";
  // Firestore/admin catalogue records can carry legacy IDs. Resolve by exact approved
  // service name as a fallback, while ALWAYS taking the price from this server catalogue.
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

  const requestedAddons = body?.addons === undefined ? [] : body.addons;
  if (!Array.isArray(requestedAddons) || requestedAddons.length > 30) {
    return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
  }

  // A booking can contain either true add-ons or extra cleaning services added
  // from the catalogue/cart. Resolve every price from this server-owned catalogue.
  // Cart items encode quantity in names such as "Kitchen Deep Cleaning (2x)".
  const normalizedAddons = [];
  for (const candidate of requestedAddons) {
    let requestedId = "";
    let requestedName = "";
    if (typeof candidate === "string") {
      requestedId = candidate;
    } else if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      requestedId = typeof candidate.id === "string" ? candidate.id.trim() : "";
      requestedName = typeof candidate.name === "string"
        ? candidate.name.trim().replace(/\s+/g, " ")
        : "";
    } else {
      return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
    }

    const quantityMatch = requestedName.match(/\((\d+)x\)$/i);
    const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 30) {
      return { error: "One or more add-ons have an invalid quantity. Refresh the booking and try again.", code: "INVALID_ADDONS" };
    }
    const normalizedName = requestedName.replace(/\s*\(\d+x\)$/i, "").trim().toLocaleLowerCase("en-IN");

    let kind = "";
    let canonicalId = "";
    if (Object.prototype.hasOwnProperty.call(ADDON_PRICES, requestedId)) {
      kind = "addon";
      canonicalId = requestedId;
    } else if (Object.prototype.hasOwnProperty.call(SERVICE_PRICES, requestedId)) {
      // A second catalogue service is allowed as a cart line item, but its price
      // still comes from SERVICE_PRICES, never from a client-provided price.
      kind = "service";
      canonicalId = requestedId;
    } else if (normalizedName) {
      const matchedAddon = Object.entries(ADDON_PRICES).find(([, item]) =>
        item.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN") === normalizedName
      );
      if (matchedAddon) {
        kind = "addon";
        canonicalId = matchedAddon[0];
      } else {
        const matchedService = Object.entries(SERVICE_PRICES).find(([, item]) =>
          item.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN") === normalizedName
        );
        if (matchedService) {
          kind = "service";
          canonicalId = matchedService[0];
        }
      }
    }

    if (!canonicalId) {
      return { error: "One or more add-ons are invalid. Refresh the booking and try again.", code: "INVALID_ADDONS" };
    }
    normalizedAddons.push({ id: canonicalId, kind, quantity });
  }

  // Repeated add-on/service IDs are rejected; quantity must be represented by one
  // cart line (the UI already groups identical items into one line).
  if (new Set(normalizedAddons.map(item => item.id)).size !== normalizedAddons.length) {
    return { error: "Duplicate add-ons are not allowed. Refresh the booking and try again.", code: "INVALID_ADDONS" };
  }
  const addonsPrice = normalizedAddons.reduce((sum, item) => {
    const catalogueItem = item.kind === "service" ? SERVICE_PRICES[item.id] : ADDON_PRICES[item.id];
    return sum + catalogueItem.price * item.quantity;
  }, 0);
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

  const currency = req.body?.currency || "INR";
  if (currency !== "INR") {
    return json(res, 400, { error: "Only INR checkout is supported.", code: "INVALID_CURRENCY" });
  }

  // COD needs an authoritative server quote, but must not require Razorpay credentials or create an order.
  const calculated = calculateQuote(req.body);
  if (calculated.error) return json(res, 400, { error: calculated.error, code: calculated.code });
  const quote = calculated.quote;
  if (req.body?.mode === "quote") {
    return json(res, 200, { quote, currency: "INR", paymentMethod: "COD" });
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
