import React, { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  reCaptchaSiteKey,
  db,
  doc,
  setDoc,
  getDoc,
  type ConfirmationResult
} from '../firebase-config';
import { BharatProLogo } from './BharatProLogo';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Sparkles,
  Loader2
} from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export interface PhoneLoginProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
  role?: 'customer' | 'partner' | 'admin';
  className?: string;
  title?: string;
  showLogo?: boolean;
}

export const PhoneLogin: React.FC<PhoneLoginProps> = ({
  onSuccess,
  onCancel,
  role = 'customer',
  className = '',
  title = 'भारत प्रो - सुरक्षित मोबाइल लॉगिन',
  showLogo = true
}) => {
  const { switchRole } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Timer & Loading states
  const [countdown, setCountdown] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  
  // Messages in Hindi
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cleanup Recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // 30-Second Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, countdown]);

  // Setup invisible RecaptchaVerifier
  const initRecaptchaVerifier = (): RecaptchaVerifier => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      window.recaptchaVerifier = undefined;
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-phone-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setErrorMessage('सुरक्षा सत्यापन समाप्त हो गया है। कृपया पुनः प्रयास करें।');
      }
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Convert Firebase error code to clear Hindi messages
  const mapFirebaseErrorToHindi = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/invalid-phone-number') {
      return 'अमान्य फोन नंबर! कृपया 10 अंकों का सही भारतीय मोबाइल नंबर दर्ज करें।';
    }
    if (code === 'auth/missing-phone-number') {
      return 'कृपया अपना 10 अंकों का मोबाइल नंबर दर्ज करें।';
    }
    if (code === 'auth/quota-exceeded') {
      return 'दैनिक SMS कोटा समाप्त हो गया है। कृपया कुछ समय बाद पुनः प्रयास करें।';
    }
    if (code === 'auth/too-many-requests') {
      return 'बहुत अधिक असफल प्रयास किए गए हैं। कृपया 5 मिनट प्रतीक्षा करें और पुनः प्रयास करें।';
    }
    if (code === 'auth/invalid-verification-code') {
      return 'गलत OTP कोड! कृपया 6 अंकों का सही OTP पुनः दर्ज करें।';
    }
    if (code === 'auth/code-expired') {
      return 'OTP की समय सीमा समाप्त हो गई है। कृपया "OTP पुनः भेजें" पर क्लिक करें।';
    }
    if (code === 'auth/captcha-check-failed') {
      return 'reCAPTCHA सुरक्षा सत्यापन विफल रहा। कृपया पेज रीफ्रेश कर दोबारा प्रयास करें।';
    }
    if (code === 'auth/network-request-failed' || message.includes('network')) {
      return 'इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें।';
    }
    return `सत्यापन में समस्या आई: ${message || 'कृपया दोबारा प्रयास करें।'}`;
  };

  // Handle Send OTP
  const handleSendOtp = async (isResend = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें।');
      return;
    }

    const fullPhoneNumber = `+91${cleanPhone}`;
    setLoading(true);

    try {
      const verifier = initRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      
      setConfirmationResult(confirmation);
      window.confirmationResult = confirmation;
      setStep('OTP');
      setCountdown(30);
      setTimerActive(true);
      setSuccessMessage(
        isResend 
          ? `+91 ${cleanPhone} पर नया OTP भेज दिया गया है!` 
          : `+91 ${cleanPhone} पर 6 अंकों का OTP भेज दिया गया है!`
      );
      
      // Auto-focus first OTP digit box after state transition
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 300);

    } catch (err: any) {
      console.error('Phone auth error:', err);
      // Reset recaptcha verifier on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch {}
      }
      setErrorMessage(mapFirebaseErrorToHindi(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle digit box change with auto-advance
  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '');
    const newOtp = [...otpValues];

    if (!sanitized) {
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    // Single digit entry
    newOtp[index] = sanitized.slice(-1);
    setOtpValues(newOtp);

    // Auto-focus next input
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting 6 digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasteData[i] || '';
    }
    setOtpValues(newOtp);

    // Focus last filled box or verify if 6 digits
    const lastIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[lastIndex]?.focus();
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('कृपया 6 अंकों का पूरा OTP दर्ज करें।');
      return;
    }

    if (!confirmationResult && !window.confirmationResult) {
      setErrorMessage('सत्यापन सत्र समाप्त हो गया है। कृपया दोबारा OTP भेजें।');
      return;
    }

    const activeConfirmation = confirmationResult || window.confirmationResult;
    setVerifying(true);

    try {
      const userCredential = await activeConfirmation!.confirm(fullOtp);
      const user = userCredential.user;

      setSuccessMessage('लॉगिन सफल रहा! आपका स्वागत है...');

      // Save user profile in Firestore
      try {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const userDocRef = doc(db, 'users', user.uid);
        const existingSnap = await getDoc(userDocRef);

        if (!existingSnap.exists()) {
          const referralCode = 'BPRO' + Math.random().toString(36).substring(2, 7).toUpperCase();
          const newProfile = {
            uid: user.uid,
            phone: `+91 ${cleanPhone}`,
            name: `User ${cleanPhone.slice(-4)}`,
            email: user.email || '',
            role: role,
            referralCode,
            walletBalance: 100, // ₹100 Welcome Credit
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
          localStorage.setItem('bharatpro_active_profile', JSON.stringify(newProfile));
        } else {
          const existing = existingSnap.data();
          const updated = {
            ...existing,
            phone: `+91 ${cleanPhone}`,
            role: existing.role || role
          };
          await setDoc(userDocRef, updated, { merge: true });
          localStorage.setItem('bharatpro_active_profile', JSON.stringify(updated));
        }
      } catch (storeErr) {
        console.warn('Profile sync notice:', storeErr);
      }

      if (switchRole) {
        switchRole(role);
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(user);
        }
      }, 800);

    } catch (err: any) {
      console.error('OTP confirmation failed:', err);
      setErrorMessage(mapFirebaseErrorToHindi(err));
    } finally {
      setVerifying(false);
    }
  };

  // Reset to phone input step
  const handleEditPhone = () => {
    setStep('PHONE');
    setOtpValues(['', '', '', '', '', '']);
    setErrorMessage(null);
    setSuccessMessage(null);
    setTimerActive(false);
  };

  return (
    <div className={`w-full max-w-md mx-auto font-['Inter',sans-serif] ${className}`}>
      {/* Invisible Recaptcha Container */}
      <div id="recaptcha-phone-container" className="hidden"></div>

      {/* Dark Theme Card Container */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden backdrop-blur-xl">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          {showLogo && (
            <div className="mb-4">
              <BharatProLogo size="lg" theme="dark" />
            </div>
          )}
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>सुरक्षित OTP सत्यापन</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {step === 'PHONE' ? title : 'ओटीपी सत्यापन (OTP Verification)'}
          </h2>
          
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {step === 'PHONE' 
              ? 'अपना 10 अंकों का मोबाइल नंबर दर्ज करें और तुरंत लॉगिन करें' 
              : `+91 ${phoneNumber.replace(/\D/g, '')} पर प्राप्त 6 अंकों का कोड दर्ज करें`}
          </p>
        </div>

        {/* Error Alert Box in Hindi */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* STEP 1: Phone Input Screen */}
        {step === 'PHONE' ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp(false);
            }} 
            className="space-y-5 relative z-10"
          >
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                मोबाइल नंबर (Mobile Number)
              </label>
              
              <div className="flex items-center rounded-2xl bg-slate-800/70 border border-slate-700 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all p-1">
                {/* +91 Indian Prefix Badge */}
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-slate-200 font-bold text-sm shrink-0 select-none">
                  <span className="text-base leading-none">🇮🇳</span>
                  <span>+91</span>
                </div>

                {/* 10-Digit Phone Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phoneNumber}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneNumber(onlyNums);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="98765 43210"
                  className="w-full bg-transparent px-3 py-2 text-white font-mono text-base font-semibold tracking-wider placeholder-slate-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span>केवल 10 अंकों का नंबर (10 digits)</span>
                <span className={`font-mono ${phoneNumber.length === 10 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                  {phoneNumber.length}/10
                </span>
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>OTP भेजा जा रहा है... (Sending)</span>
                </>
              ) : (
                <>
                  <span>OTP भेजें (Send OTP)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Security Guarantee Note */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% सुरक्षित • कोई पासवर्ड याद रखने की जरूरत नहीं</span>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer pt-1"
              >
                रद्द करें (Cancel)
              </button>
            )}
          </form>
        ) : (
          /* STEP 2: OTP Verification Screen */
          <form onSubmit={handleVerifyOtp} className="space-y-5 relative z-10">
            {/* Phone Number Display + Edit Action */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold tracking-wider text-white">
                  +91 {phoneNumber.replace(/\D/g, '')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEditPhone}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>नंबर बदलें (Edit)</span>
              </button>
            </div>

            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-3 text-center">
                6-अंकों का OTP कोड दर्ज करें (Enter 6-Digit OTP)
              </label>

              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono bg-slate-800/80 border-2 border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white rounded-xl outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Verify OTP Button */}
            <button
              type="submit"
              disabled={verifying || otpValues.join('').length !== 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>सत्यापन हो रहा है... (Verifying)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>OTP सत्यापित करें और लॉगिन करें (Verify & Login)</span>
                </>
              )}
            </button>

            {/* 30-Second Resend Timer Section */}
            <div className="flex flex-col items-center justify-center gap-2 pt-2 text-xs">
              {timerActive ? (
                <div className="text-slate-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>OTP पुनः भेजें ({countdown}s में संभव)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>OTP नहीं मिला? दोबारा भेजें (Resend OTP)</span>
                </button>
              )}
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer pt-1"
              >
                रद्द करें (Cancel)
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneLogin;
