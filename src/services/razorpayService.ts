// Public Razorpay key ID only. Never expose RAZORPAY_KEY_SECRET in browser code.
export const getRazorpayKeyId = (): string | null => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
  return key && key.startsWith("rzp_") ? key : null;
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
