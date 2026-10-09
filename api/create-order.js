// ==========================================
// api/create-order.js
// यह Vercel Serverless Function है जो Razorpay पर ऑर्डर बनाता है।
// ==========================================

const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  // ---------------------------------------------------------
  // 1. CORS हेडर्स सेट करें
  // ताकि आपका Vite फ्रंटएंड (जो Vercel पर होस्ट है) बिना किसी ब्लॉक के 
  // इस API को कॉल कर सके।
  // ---------------------------------------------------------
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  // 🚨 सुरक्षा टिप: लाइव जाने से पहले '*' की जगह अपना असली डोमेन लगाएं (जैसे 'https://bharatproexpert.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // ---------------------------------------------------------
  // 2. OPTIONS रिक्वेस्ट को हैंडल करें (CORS Preflight)
  // ब्राउज़र पहले एक OPTIONS रिक्वेस्ट भेजता है यह चेक करने के लिए 
  // कि सर्वर रिक्वेस्ट स्वीकार करेगा या नहीं।
  // ---------------------------------------------------------
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ---------------------------------------------------------
  // 3. सिर्फ POST रिक्वेस्ट की अनुमति दें
  // ऑर्डर बनाने के लिए हमेशा POST मेथड ही इस्तेमाल होता है।
  // ---------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Please use POST request.' 
    });
  }

  try {
    // ---------------------------------------------------------
    // 4. फ्रंटएंड से भेजा गया डेटा निकालें (Amount)
    // ---------------------------------------------------------
    const { amount, customerName, customerEmail, customerPhone } = req.body;

    // ---------------------------------------------------------
    // 5. डेटा की जांच करें (Validation)
    // अगर अमाउंट गायब है, नंबर नहीं है, या 0 से कम है, तो एरर दें।
    // ---------------------------------------------------------
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid amount. Please provide a valid positive number.' 
      });
    }

    // ---------------------------------------------------------
    // 6. Vercel Environment Variables की जांच करें
    // यह चेक करना बहुत जरूरी है ताकि पता चले कि Keys सेट हैं या नहीं।
    // ---------------------------------------------------------
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Error: Razorpay Environment Variables are missing in Vercel!");
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error. Payment keys are missing.' 
      });
    }

    // ---------------------------------------------------------
    // 7. Razorpay का Instance बनाएं
    // यहाँ हम Vercel के Environment Variables से Keys उठा रहे हैं।
    // (ध्यान रखें: इनके आगे VITE_ नहीं होना चाहिए)
    // ---------------------------------------------------------
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // ---------------------------------------------------------
    // 8. ऑर्डर के ऑप्शन्स तैयार करें
    // ---------------------------------------------------------
    const options = {
      // Razorpay पैसे को "Paise" में लेता है, इसलिए INR को 100 से गुणा करें।
      // जैसे: ₹500 = 50000 Paise
      amount: Math.round(amount * 100), 
      currency: "INR",
      // रसीद का यूनिक नंबर (टाइमस्टैम्प के साथ)
      receipt: `receipt_order_${Date.now()}`,
      // (ऑप्शनल) अगर आपके पास कस्टमर की डिटेल्स हैं, तो उन्हें नोट्स में सेव कर सकते हैं
      notes: {
        customer_name: customerName || 'Not Provided',
        customer_email: customerEmail || 'Not Provided',
        customer_phone: customerPhone || 'Not Provided',
      }
    };

    // ---------------------------------------------------------
    // 9. Razorpay पर ऑर्डर बनाएं
    // ---------------------------------------------------------
    console.log(`⏳ Creating Razorpay order for amount: ₹${amount}`);
    const order = await instance.orders.create(options);
    console.log("✅ Order created successfully:", order.id);
    
    // ---------------------------------------------------------
    // 10. ऑर्डर की डिटेल्स फ्रंटएंड (Vite) को भेजें
    // ---------------------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order: order // इसमें order.id, amount, currency सब होता है
    });

  } catch (error) {
    // ---------------------------------------------------------
    // 11. एरर हैंडलिंग (अगर कुछ भी गलत होता है)
    // ---------------------------------------------------------
    console.error("❌ Razorpay Order Creation Failed!");
    console.error("Error Details:", error);

    // अगर Razorpay की तरफ से कोई खास एरर आया है, तो उसे भी भेजें
    const errorMessage = error.error?.description || error.message || 'Something went wrong while creating the order';
    
    return res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error // डिबगिंग के लिए पूरा एरर ऑब्जेक्ट भी भेज दें
    });
  }
};
