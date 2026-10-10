// Only the public Razorpay Key ID may be exposed to the browser.
// Configure VITE_RAZORPAY_KEY_ID in Vercel for each deployment environment.
// Never add a key or RAZORPAY_KEY_SECRET as a source-code fallback.
export const getRazorpayKeyId = (): string | null => {
  const configuredKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (typeof configuredKey !== "string") return null;

  const key = configuredKey.trim();
  return /^rzp_(test|live)_[A-Za-z0-9]+$/.test(key) ? key : null;
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
