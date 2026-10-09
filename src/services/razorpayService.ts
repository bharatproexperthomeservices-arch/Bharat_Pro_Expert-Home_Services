// Public Razorpay Key ID only. Never place RAZORPAY_KEY_SECRET in frontend code.
export const getRazorpayKeyId = (): string | null => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
  if (!key) {
    console.error('VITE_RAZORPAY_KEY_ID is not configured for the frontend.');
    return null;
  }
  return key;
};

export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-razorpay-checkout="true"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(Boolean((window as any).Razorpay));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};
