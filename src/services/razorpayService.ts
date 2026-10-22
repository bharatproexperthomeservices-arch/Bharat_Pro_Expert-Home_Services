// Razorpay's public Key ID must be supplied by deployment configuration.
// Never hard-code a live payment identifier into a public repository.
export const getRazorpayKeyId = (): string | null => {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (typeof key !== "string" || key.trim() === "") {
    console.error(
      "Razorpay Key ID is missing. Configure VITE_RAZORPAY_KEY_ID in the deployment environment and rebuild."
    );
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
