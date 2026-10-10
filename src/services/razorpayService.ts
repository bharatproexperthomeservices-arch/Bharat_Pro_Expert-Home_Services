// src/services/razorpayService.ts
// Vite exposes only VITE_* variables to browser code. Never put the Razorpay secret here.
export const getRazorpayKeyId = (): string | null => {
  const key =
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID : undefined);

  if (typeof key !== 'string' || !key.trim()) {
    console.error('Razorpay Key ID is missing. Set VITE_RAZORPAY_KEY_ID in the frontend environment.');
    return null;
  }
  return key.trim();
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const selector = 'script[src="https://checkout.razorpay.com/v1/checkout.js"]';
    const existing = document.querySelector<HTMLScriptElement>(selector);
    if (existing) {
      if (existing.dataset.loaded === 'true' || (window as any).Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(!!(window as any).Razorpay), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve(!!(window as any).Razorpay);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};
