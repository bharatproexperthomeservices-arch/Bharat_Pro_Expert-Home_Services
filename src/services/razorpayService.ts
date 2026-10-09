// src/services/razorpayService.ts
export const getRazorpayKeyId = (): string | null => {
  // ⚠️ TEMPORARY HARDCODED FOR TESTING
  const key = "rzp_test_Tln3PFyt6PlTPe"; 
  
  if (!key) {
    console.error("❌ Razorpay Key ID is missing.");
    return null;
  }
  return key;
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
