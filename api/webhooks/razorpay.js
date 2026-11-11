import crypto from "node:crypto";

export const config = {
  api: {
    // Razorpay signs the exact bytes it sends. Do not let Vercel parse JSON first.
    bodyParser: false
  }
};

const MAX_BODY_BYTES = 1024 * 1024;

function json(res, status, body) {
  return res.status(status).json(body);
}

async function readRawBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Webhook body exceeds the allowed size.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function isValidSignature(rawBody, suppliedSignature, secret) {
  if (
    typeof suppliedSignature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(suppliedSignature)
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();

  const received = Buffer.from(suppliedSignature, "hex");
  return received.length === expected.length &&
    crypto.timingSafeEqual(expected, received);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, {
      received: false,
      error: "Method not allowed. Razorpay webhooks must use POST."
    });
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
      error: error?.statusCode === 413
        ? "Webhook body is too large."
        : "Unable to read webhook body."
    });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!isValidSignature(rawBody, signature, webhookSecret)) {
    console.warn("Rejected Razorpay webhook: signature validation failed.");
    return json(res, 401, {
      received: false,
      error: "Invalid Razorpay webhook signature."
    });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return json(res, 400, {
      received: false,
      error: "Webhook body is not valid JSON."
    });
  }

  if (!event || typeof event.event !== "string" || !event.payload) {
    return json(res, 400, {
      received: false,
      error: "Webhook event payload is missing or invalid."
    });
  }

  // Do not log customer/payment payloads or secrets. This confirms delivery only;
  // durable booking/payment updates require an idempotent database event store.
  const eventId = typeof req.headers["x-razorpay-event-id"] === "string"
    ? req.headers["x-razorpay-event-id"]
    : "not-provided";

  console.info("Verified Razorpay webhook received.", {
    event: event.event,
    eventId
  });

  // Acknowledge only after signature and payload validation. Razorpay may retry
  // events, so downstream processing must be idempotent before changing bookings.
  return json(res, 200, {
    received: true,
    event: event.event,
    eventId
  });
}
