// src/services/razorpayService.ts
export const getRazorpayKeyId = (): string | null => {
  // 1. Vercel se key uthane ki koshish karo
  let key = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // 2. 🚨 TEMPORARY FALLBACK (Sirf tab chalega jab Vercel wali key na mile)
  // ⚠️ Warning: Baad mein ise hata dena, kyunki yeh GitHub par public hai.
  if (!key) {
    console.warn("⚠️ Vercel se key nahi mili, temporary fallback use kar rahe hain.");
    key = "rzp_live_Tlh9T3hoID4gmq"; 
  }

  if (typeof key !== "string" || key.trim() === "") {
    console.error("❌ Razorpay Key ID is completely missing.");
    return null;
  }
  
  return key.trim(); 
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    const script = existing ?? document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean((window as any).Razorpay));
    script.onerror = () => resolve(false);
    if (!existing) document.head.appendChild(script);
  });
};
