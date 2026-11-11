import crypto from "node:crypto";

function json(res, status, body) {
  return res.status(status).json(body);
}

// Razorpay signs the exact raw request bytes. Do not parse/re-serialize JSON
// before validating X-Razorpay-Signature.
export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      const error = new Error("Webhook payload is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function signatureIsValid(rawBody, signature, secret) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");

  return received.length === expected.length &&
    crypto.timingSafeEqual(expected, received);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { received: false, error: "Method not allowed." });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Razorpay webhook is missing RAZORPAY_WEBHOOK_SECRET.");
    return json(res, 503, {
      received: false,
      error: "Webhook is not configured on the server."
    });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    return json(res, error?.statusCode === 413 ? 413 : 400, {
      received: false,
      error: error?.statusCode === 413 ? error.message : "Unable to read webhook payload."
    });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signatureIsValid(rawBody, signature, webhookSecret)) {
    console.warn("Rejected Razorpay webhook with an invalid signature.");
    return json(res, 400, { received: false, error: "Invalid webhook signature." });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return json(res, 400, { received: false, error: "Invalid JSON payload." });
  }

  const eventId = typeof req.headers["x-razorpay-event-id"] === "string"
    ? req.headers["x-razorpay-event-id"]
    : null;
  const eventName = typeof event?.event === "string" ? event.event : "unknown";

  // Only acknowledge a correctly signed payload. Do not mark bookings paid from
  // a webhook alone until durable, idempotent booking/payment persistence is wired.
  console.info("Verified Razorpay webhook received.", {
    event: eventName,
    eventId
  });

  return json(res, 200, { received: true });
}
