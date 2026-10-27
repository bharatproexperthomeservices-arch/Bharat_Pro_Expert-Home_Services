import Razorpay from "razorpay";
import { ADDON_PRICES, BUSINESS_GST_DETAILS, CONVENIENCE_FEE_INR, COUPON_CODES, GST_RATE, SERVICE_PRICES } from "./pricing-catalog.js";

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

  // Support legacy/admin catalogue IDs by resolving their exact approved name to a
  // server-owned add-on ID. Prices always come from ADDON_PRICES, never the browser.
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
  const subtotal = service.price + addonsPrice;
  const gst = Math.round(subtotal * GST_RATE);
  const convenienceFee = CONVENIENCE_FEE_INR;
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
  const discount = COUPON_CODES.has(couponCode) ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + gst + convenienceFee - discount;

  if (!Number.isSafeInteger(total) || total <= 0 || total > 500000) {
    return { error: "Calculated checkout total is invalid. Please contact support.", code: "INVALID_SERVER_TOTAL" };
  }
  return {
    quote: {
      serviceId,
      basePrice: service.price,
      addonsPrice,
      subtotal,
      gst,
      convenienceFee,
      discount,
      couponCode: discount ? couponCode : null,
      total,
      businessGst: BUSINESS_GST_DETAILS
    }
  };
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

  // Quote-only requests support checkout price calculation; every actual booking must use online payment.
  const calculated = calculateQuote(req.body);
  if (calculated.error) return json(res, 400, { error: calculated.error, code: calculated.code });
  const quote = calculated.quote;
  if (req.body?.mode === "quote") {
    return json(res, 200, { quote, currency: "INR", paymentMethod: "ONLINE" });
  }

  // Credentials lookup for Razorpay and Cashfree
  const razorpayKeyId = typeof process.env.RAZORPAY_KEY_ID === "string" ? process.env.RAZORPAY_KEY_ID.trim() : "";
  const razorpayKeySecret = typeof process.env.RAZORPAY_KEY_SECRET === "string" ? process.env.RAZORPAY_KEY_SECRET.trim() : "";
  const cashfreeAppId = typeof process.env.CASHFREE_APP_ID === "string" ? process.env.CASHFREE_APP_ID.trim() : "";
  const cashfreeSecretKey = typeof process.env.CASHFREE_SECRET_KEY === "string" ? process.env.CASHFREE_SECRET_KEY.trim() : "";

  const hasRazorpay = Boolean(razorpayKeyId && razorpayKeySecret);
  const hasCashfree = Boolean(cashfreeAppId && cashfreeSecretKey);

  if (!hasRazorpay && !hasCashfree) {
    console.error("No payment gateway configured (Razorpay or Cashfree).");
    return json(res, 503, {
      error: "Payment gateway is not configured on this deployment. Please contact administrator.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
      missingVariables: ["RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET or CASHFREE_APP_ID/CASHFREE_SECRET_KEY"]
    });
  }

  const bookingId = typeof req.body?.bookingId === "string" ? req.body.bookingId.slice(0, 100) : "";
  if (!/^bpe_[a-zA-Z0-9_-]{8,100}$/.test(bookingId)) {
    return json(res, 400, { error: "Invalid booking reference. Refresh the booking and retry.", code: "INVALID_BOOKING_REFERENCE" });
  }
  const clientTotal = Number(req.body?.clientTotal);
  if (!Number.isSafeInteger(clientTotal) || clientTotal !== quote.total) {
    return json(res, 409, { error: "The booking price changed or the displayed total is out of date. Refresh and try again.", code: "CHECKOUT_TOTAL_MISMATCH", quote });
  }

  const customerName = typeof req.body?.customerName === "string" ? req.body.customerName.trim().slice(0, 100) : "";
  const customerPhone = typeof req.body?.customerPhone === "string" ? req.body.customerPhone.replace(/\D/g, "").slice(-10) : "";
  const customerEmail = typeof req.body?.customerEmail === "string" ? req.body.customerEmail.trim().slice(0, 150) : "";
  if (!customerName || customerPhone.length !== 10) {
    return json(res, 400, { error: "Enter a valid customer name and 10-digit phone number.", code: "INVALID_CUSTOMER_DETAILS" });
  }

  // Priority: Razorpay first if available, else Cashfree
  if (hasRazorpay) {
    try {
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });

      const orderOptions = {
        amount: quote.total * 100, // in paise
        currency: "INR",
        receipt: bookingId.slice(0, 40),
        notes: {
          bookingId,
          customerName,
          customerPhone,
          gstin: BUSINESS_GST_DETAILS.gstin,
          businessName: BUSINESS_GST_DETAILS.businessName
        }
      };

      const order = await razorpay.orders.create(orderOptions);
      return json(res, 201, {
        gateway: "razorpay",
        order_id: order.id,
        key_id: razorpayKeyId,
        amount: quote.total * 100,
        currency: "INR",
        quote,
        businessGst: BUSINESS_GST_DETAILS
      });
    } catch (error) {
      console.error("Razorpay order creation failed:", error?.message || error);
      return json(res, 502, { error: "Razorpay order creation failed.", code: "RAZORPAY_ORDER_CREATION_FAILED" });
    }
  }

  // Cashfree Order Creation
  const isProduction = process.env.CASHFREE_ENV === "production";
  const apiBase = isProduction ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const appBaseUrl = (process.env.PUBLIC_APP_URL || process.env.FRONTEND_ORIGIN || "").split(",")[0].trim().replace(/\/$/, "");
  const orderId = bookingId.slice(0, 45);
  const payload = {
    order_id: orderId,
    order_amount: quote.total,
    order_currency: "INR",
    customer_details: {
      customer_id: bookingId.slice(0, 50),
      customer_name: customerName,
      customer_email: customerEmail || undefined,
      customer_phone: customerPhone
    },
    order_meta: {
      return_url: appBaseUrl ? `${appBaseUrl}/?cashfree_order_id={order_id}&booking_id=${encodeURIComponent(bookingId)}` : undefined
    },
    order_note: `Bharat Pro Expert GSTIN:${BUSINESS_GST_DETAILS.gstin} booking ${bookingId}`
  };

  try {
    const response = await fetch(`${apiBase}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
        "x-api-version": "2025-01-01",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const order = await response.json().catch(() => ({}));
    if (!response.ok || typeof order.order_id !== "string" || typeof order.payment_session_id !== "string" ||
        Number(order.order_amount) !== quote.total || order.order_currency !== "INR") {
      console.error("Cashfree order creation failed:", response.status, order.code || order.type || "provider_error");
      return json(res, 502, { error: "Cashfree could not create the payment order. Check server logs and Cashfree credentials, then retry.", code: "CASHFREE_ORDER_CREATION_FAILED" });
    }
    return json(res, 201, {
      gateway: "cashfree",
      order_id: order.order_id,
      payment_session_id: order.payment_session_id,
      amount: quote.total * 100,
      currency: "INR",
      quote,
      businessGst: BUSINESS_GST_DETAILS,
      environment: isProduction ? "production" : "sandbox"
    });
  } catch (error) {
    console.error("Cashfree order request failed:", error?.message || "Unknown error");
    return json(res, 502, { error: "Unable to reach Cashfree. Please retry in a moment.", code: "CASHFREE_NETWORK_ERROR" });
  }
}
