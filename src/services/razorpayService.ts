// src/services/razorpayService.ts
// Public Razorpay Key ID only. Never put RAZORPAY_KEY_SECRET in client code.
export const getRazorpayKeyId = (): string | null => {
  const key =
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
    (import.meta as any).env?.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (typeof key !== 'string' || !key.trim()) {
    console.error('Razorpay Key ID is missing. Configure the public Key ID in the hosting environment.');
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
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
