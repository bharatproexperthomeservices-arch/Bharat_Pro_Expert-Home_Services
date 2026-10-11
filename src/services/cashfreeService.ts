export type CashfreeMode = "sandbox" | "production";

declare global {
  interface Window {
    Cashfree?: (options: { mode: CashfreeMode }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => Promise<any>;
    };
  }
}

export const loadCashfreeScript = (): Promise<boolean> => new Promise((resolve) => {
  if (typeof window === "undefined") {
    resolve(false);
    return;
  }
  if (typeof window.Cashfree === "function") {
    resolve(true);
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
  const script = existing ?? document.createElement("script");
  script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
  script.async = true;
  script.onload = () => resolve(typeof window.Cashfree === "function");
  script.onerror = () => resolve(false);
  if (!existing) document.head.appendChild(script);
});
