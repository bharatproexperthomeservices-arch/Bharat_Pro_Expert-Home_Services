import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error('Razorpay server environment variables are missing.');
    return res.status(500).json({ success: false, error: 'Payment is not configured. Please contact support.' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const amountRupees = Number(body.amount);
    const amountPaise = Math.round(amountRupees * 100);
    const currency = body.currency || 'INR';

    if (!Number.isFinite(amountRupees) || amountPaise < 100 || amountPaise > 100000000) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
    }
    if (currency !== 'INR') {
      return res.status(400).json({ success: false, error: 'Only INR payments are supported.' });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const receiptSource = typeof body.receipt === 'string' ? body.receipt : '';
    const receipt = receiptSource.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || `bpe_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { service: 'Bharat Pro Expert Home Cleaning' }
    });

    return res.status(200).json({
      success: true,
      id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId
    });
  } catch (error) {
    console.error('RAZORPAY_CREATE_ORDER_ERROR:', error?.statusCode || error?.message || 'Unknown error');
    return res.status(502).json({ success: false, error: 'Unable to create payment order. Please try again.' });
  }
}
