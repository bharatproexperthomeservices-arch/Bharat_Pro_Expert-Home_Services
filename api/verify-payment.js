import crypto from 'node:crypto';
import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, verified: false, error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error('Razorpay verification environment variables are missing.');
    return res.status(500).json({ success: false, verified: false, error: 'Payment verification is not configured.' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      typeof orderId !== 'string' || !orderId.startsWith('order_') ||
      typeof paymentId !== 'string' || !paymentId.startsWith('pay_') ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(400).json({ success: false, verified: false, error: 'Missing or invalid payment verification details.' });
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const received = Buffer.from(signature, 'hex');

    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ success: false, verified: false, error: 'Payment signature verification failed.' });
    }

    // Signature verification alone is not enough: confirm the payment is linked
    // to the same order and that Razorpay reports it as captured.
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.order_id !== orderId) {
      return res.status(400).json({ success: false, verified: false, error: 'Payment does not match the order.' });
    }
    if (payment.status !== 'captured') {
      return res.status(409).json({
        success: false,
        verified: false,
        error: 'Payment has not been captured yet.',
        status: payment.status
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      orderId,
      paymentId,
      status: payment.status
    });
  } catch (error) {
    console.error('RAZORPAY_VERIFY_PAYMENT_ERROR:', error?.statusCode || error?.message || 'Unknown error');
    return res.status(502).json({ success: false, verified: false, error: 'Unable to verify payment. Please contact support before retrying.' });
  }
}
