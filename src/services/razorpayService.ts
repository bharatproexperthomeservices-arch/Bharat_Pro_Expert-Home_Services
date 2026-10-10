// src/services/razorpayService.ts
// Only the public Razorpay Key ID may be exposed to the browser.
export const getRazorpayKeyId = (): string | null => {
  const key =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
      : undefined;

  if (typeof key !== 'string' || !key.trim()) {
    console.error('Razorpay Key ID is missing. Configure NEXT_PUBLIC_RAZORPAY_KEY_ID in the hosting environment.');
    return null;
  }
  return key.trim();
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const selector = 'script[src="https://checkout.razorpay.com/v1/checkout.js"]';
    const existing = document.querySelector<HTMLScriptElement>(selector);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
