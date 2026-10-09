// ==========================================
// api/create-order.js (ES Module version)
// ==========================================

import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // ---------------------------------------------------------
  // 1. CORS हेडर्स सेट करें
  // ---------------------------------------------------------
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // ---------------------------------------------------------
  // 2. OPTIONS रिक्वेस्ट को हैंडल करें (CORS Preflight)
  // ---------------------------------------------------------
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ---------------------------------------------------------
  // 3. सिर्फ POST रिक्वेस्ट की अनुमति दें
  // ---------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ---------------------------------------------------------
    // 4. फ्रंटएंड से भेजा गया डेटा निकालें (Amount)
    // ---------------------------------------------------------
    const { amount } = req.body;

    // ---------------------------------------------------------
    // 5. डेटा की जांच करें (Validation)
    // ---------------------------------------------------------
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }

    // ---------------------------------------------------------
    // 6. Vercel Environment Variables की जांच करें
    // ---------------------------------------------------------
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Error: Razorpay Environment Variables are missing in Vercel!");
      return res.status(500).json({ error: 'Server configuration error. Payment keys are missing.' });
    }

    // ---------------------------------------------------------
    // 7. Razorpay का Instance बनाएं
    // ---------------------------------------------------------
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // ---------------------------------------------------------
    // 8. ऑर्डर के ऑप्शन्स तैयार करें
    // ---------------------------------------------------------
    const options = {
      amount: Math.round(amount * 100), // INR को Paise में बदलें
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    // ---------------------------------------------------------
    // 9. Razorpay पर ऑर्डर बनाएं
    // ---------------------------------------------------------
    const order = await instance.orders.create(options);
    
    // ---------------------------------------------------------
    // 10. ऑर्डर की डिटेल्स फ्रंटएंड को भेजें
    // ---------------------------------------------------------
    return res.status(200).json(order);

  } catch (error) {
    // ---------------------------------------------------------
    // 11. एरर हैंडलिंग
    // ---------------------------------------------------------
    console.error("❌ Razorpay Order Creation Failed!");
    console.error("Error Details:", error);

    return res.status(500).json({ 
      error: 'Something went wrong while creating the order',
      details: error.message 
    });
  }
}
