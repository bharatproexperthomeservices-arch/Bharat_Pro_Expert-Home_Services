// Only the public Razorpay Key ID may be exposed to the browser.
// Configure VITE_RAZORPAY_KEY_ID in Vercel for each deployment environment.
// Vite injects this value at build time; changing Vercel variables requires a new build/deployment.
// Never add a key or RAZORPAY_KEY_SECRET as a source-code fallback.
export const getRazorpayKeyId = (): string | null => {
  const configuredKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // Safe diagnostics: report presence/format only. Never log the key or any secret.
  if (typeof configuredKey !== "string" || !configuredKey.trim()) {
    console.error("[Razorpay config] VITE_RAZORPAY_KEY_ID: KEY_MISSING");
    return null;
  }

  const key = configuredKey.trim();
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(key)) {
    console.error("[Razorpay config] VITE_RAZORPAY_KEY_ID: KEY_FORMAT_INVALID");
    return null;
  }

  console.info(
    "[Razorpay config] VITE_RAZORPAY_KEY_ID:",
    key.startsWith("rzp_live_") ? "KEY_PRESENT_LIVE" : "KEY_PRESENT_TEST"
  );
  return key;
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
