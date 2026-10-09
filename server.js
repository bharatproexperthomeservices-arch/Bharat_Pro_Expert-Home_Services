import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import 'dotenv/config';

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_ORIGIN
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '32kb' }));

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay server environment variables are missing.');
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
};

app.post('/api/create-order', async (req, res) => {
  try {
    const { client, keyId } = getRazorpay();
    const amountRupees = Number(req.body?.amount);
    const amountPaise = Math.round(amountRupees * 100);
    if (!Number.isFinite(amountRupees) || amountPaise < 100 || amountPaise > 100000000) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
    }
    if ((req.body?.currency || 'INR') !== 'INR') {
      return res.status(400).json({ success: false, error: 'Only INR payments are supported.' });
    }

    const receiptText = typeof req.body?.receipt === 'string' ? req.body.receipt : '';
    const receipt = receiptText.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || `bpe_${Date.now()}`;
    const order = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { service: 'Bharat Pro Expert Home Cleaning' }
    });

    return res.status(200).json({
      success: true, id: order.id, orderId: order.id,
      amount: order.amount, currency: order.currency, keyId
    });
  } catch (error) {
    console.error('RAZORPAY_CREATE_ORDER_ERROR:', error?.statusCode || error?.message || 'Unknown error');
    return res.status(500).json({ success: false, error: 'Unable to create payment order.' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { client, keySecret } = getRazorpay();
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (
      typeof orderId !== 'string' || !orderId.startsWith('order_') ||
      typeof paymentId !== 'string' || !paymentId.startsWith('pay_') ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(400).json({ success: false, verified: false, error: 'Missing or invalid payment verification details.' });
    }

    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest();
    const received = Buffer.from(signature, 'hex');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      return res.status(400).json({ success: false, verified: false, error: 'Payment signature verification failed.' });
    }

    const payment = await client.payments.fetch(paymentId);
    if (payment.order_id !== orderId) {
      return res.status(400).json({ success: false, verified: false, error: 'Payment does not match the order.' });
    }
    if (payment.status !== 'captured') {
      return res.status(409).json({ success: false, verified: false, error: 'Payment has not been captured yet.', status: payment.status });
    }

    return res.status(200).json({ success: true, verified: true, orderId, paymentId, status: payment.status });
  } catch (error) {
    console.error('RAZORPAY_VERIFY_PAYMENT_ERROR:', error?.statusCode || error?.message || 'Unknown error');
    return res.status(500).json({ success: false, verified: false, error: 'Unable to verify payment.' });
  }
});

app.listen(port, () => console.log(`Bharat Pro Expert API listening on port ${port}`));
