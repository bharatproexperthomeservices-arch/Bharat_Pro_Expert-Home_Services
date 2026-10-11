// src/services/razorpayService.ts
export const getRazorpayKeyId = (): string | null => {
  const configuredKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  
  // 🚨 DEBUGGING LOG: Yeh check karega ki Vite ko kya mil raha hai
  console.log("DEBUG CHECK - VITE KEY:", configuredKey);

  if (typeof configuredKey !== "string" || configuredKey.trim() === "") {
    console.error("❌ VITE_RAZORPAY_KEY_ID is missing or empty.");
    return null;
  }
  
  // Filhal regex hata diya hai taaki key direct pass ho jaye
  return configuredKey.trim(); 
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
