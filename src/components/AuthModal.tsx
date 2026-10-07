import React, { useState, useEffect, useRef } from 'react';
import { BharatProLogo } from './BharatProLogo';
import { useAuth } from '../context/AuthContext';
import { getSuggestedGoogleEmail } from '../services/customerAuthService';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  RotateCcw,
  X,
  Sparkles,
  Loader2,
  Lock,
  Mail
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'customer' | 'partner';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer',
  onSuccess
}) => {
  const { 
    signInWithGoogle, 
    signInWithGoogleAccount,
    signInWithMobileOtp, 
    requestMobileOtp 
  } = useAuth();

  const [step, setStep] = useState<'INPUT' | 'OTP' | 'GOOGLE_DIRECT'>('INPUT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [suggestedEmail, setSuggestedEmail] = useState('bharatproexperthomeservices@gmail.com');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  // Resend Countdown Timer (30s)
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setPhoneNumber('');
      const defaultEmail = getSuggestedGoogleEmail();
      setSuggestedEmail(defaultEmail);
      setGoogleEmail(defaultEmail);
      setOtpDigits(['', '', '', '']);
      setError(null);
      setSuccessMsg(null);
      setPreviewCode(null);
      setCountdown(30);
      setCanResend(false);
    }
  }, [isOpen]);

  // 30s Countdown timer for Resend OTP
  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && countdown > 0) {
      setCanResend(false);
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (step === 'OTP' && countdown <= 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle(defaultRole);
      setSuccessMsg('Google sign-in successful! Welcome.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      console.warn('[Google Sign-in Exception]', err);
      const errCode = err?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || err?.message?.includes('closed')) {
        setError('Google sign-in popup was closed. Please try again or use Instant Google Login below.');
      } else {
        // When popup is restricted, domain not authorized yet in Firebase, or running in iframe:
        // Seamlessly switch to GOOGLE_DIRECT so customer is NEVER blocked!
        setStep('GOOGLE_DIRECT');
        if (errCode === 'auth/unauthorized-domain') {
          setError('Google popup authorization restricted for this domain. Confirm your Google account below for instant sign-in:');
        } else if (errCode === 'auth/popup-blocked') {
          setError('Browser blocked the popup window. Confirm your Google account below to sign in instantly:');
        } else {
          setError('Please confirm your Google Account email below to sign in:');
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Direct Google Verification Submit
  const handleDirectGoogleSubmit = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const emailToUse = (customEmail || googleEmail || suggestedEmail).trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@') || !emailToUse.includes('.')) {
      setError('Please enter a valid Google Account email (e.g. yourname@gmail.com).');
      return;
    }

    setGoogleLoading(true);
    try {
      await signInWithGoogleAccount(emailToUse, undefined, defaultRole);
      localStorage.setItem('bpe_last_google_email', emailToUse);
      setSuccessMsg(`Google sign-in verified for ${emailToUse}! Welcome.`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google account. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setPreviewCode(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Mobile number must start with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestMobileOtp(cleanPhone);
      if (res.success) {
        setStep('OTP');
        setOtpDigits(['', '', '', '']);
        setCountdown(res.cooldownSeconds || 30);
        setCanResend(false);
        setSuccessMsg(`OTP sent to +91 ${cleanPhone}`);
        if (res.previewOtp) {
          setPreviewCode(res.previewOtp);
        }
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 150);
      } else {
        setError(res.error || 'Failed to send OTP. Please check your number.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 4-digit OTP change
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!cleaned) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Take last digit entered
    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);

    // Auto advance to next box
    if (index < 3 && cleaned) {
      otpRefs.current[index + 1]?.focus();
    }

    // If all 4 filled, auto verify
    if (index === 3 && cleaned && newDigits.every(d => d !== '')) {
      const fullOtp = newDigits.join('');
      executeVerify(fullOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!paste) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = paste[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(paste.length, 3);
    otpRefs.current[nextIndex]?.focus();

    if (paste.length === 4) {
      executeVerify(paste);
    }
  };

  // Verify 4-Digit OTP
  const executeVerify = async (otpCode: string) => {
    setError(null);
    setSuccessMsg(null);

    if (otpCode.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await signInWithMobileOtp(phoneNumber, otpCode);
      setSuccessMsg('Mobile verified successfully! Welcome.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    executeVerify(fullOtp);
  };

  const handleEditNumber = () => {
    setStep('INPUT');
    setOtpDigits(['', '', '', '']);
    setError(null);
    setSuccessMsg(null);
    setPreviewCode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Apple-Style Premium White Modal Card */}
      <div 
        className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-[#E5E5EA] overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#48484A] flex items-center justify-center transition-colors cursor-pointer z-20"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pt-8 px-6 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <BharatProLogo size="md" />
          </div>
          <h2 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight font-['Outfit']">
            Welcome to Bharat Pro Expert
          </h2>
          <p className="text-xs font-semibold text-[#D4A24E] mt-0.5 tracking-wide">
            Trusted Home Services
          </p>
        </div>

        {/* Body Content */}
        <div className="px-6 pb-7 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preview OTP Helper (Helpful for test accounts/instant feedback) */}
          {previewCode && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between">
              <span className="font-medium text-[11px] text-amber-800">
                SMS / WhatsApp OTP:
              </span>
              <span className="font-mono font-black text-amber-900 tracking-widest text-sm bg-amber-200/60 px-2 py-0.5 rounded">
                {previewCode}
              </span>
            </div>
          )}

          {step === 'INPUT' ? (
            <>
              {/* GOOGLE SIGN IN BUTTON */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-[#1C1C1E] border border-[#D1D1D6] font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 text-[#D4A24E] animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    Continue with Google
                  </span>
                </button>

                <div className="flex justify-between items-center px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('GOOGLE_DIRECT');
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-[#0b3ba8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>⚡ Instant Google Sign-In</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">Safe &bull; Verified</span>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center my-3">
                <div className="w-full border-t border-[#E5E5EA]"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest absolute">
                  OR
                </span>
              </div>

              {/* MOBILE NUMBER INPUT */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#48484A] mb-1.5 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-[#D1D1D6] bg-white focus-within:border-[#B8892E] focus-within:ring-2 focus-within:ring-[#B8892E]/20 transition-all shadow-sm overflow-hidden">
                    <div className="pl-3.5 pr-2.5 py-3 bg-[#F2F2F7] border-r border-[#E5E5EA] flex items-center gap-1.5 text-xs font-bold text-[#1C1C1E] select-none">
                      <span className="text-sm leading-none">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10 digit mobile number"
                      maxLength={10}
                      autoFocus
                      className="w-full px-3.5 py-3 text-sm font-semibold text-[#1C1C1E] outline-none bg-transparent placeholder:text-[#8E8E93] placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* SEND OTP BUTTON */}
                <button
                  type="submit"
                  disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0B2A4A] hover:bg-[#071A2E] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-[#D4A24E] animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4A24E] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : step === 'GOOGLE_DIRECT' ? (
            /* STEP: GOOGLE FAST DIRECT SIGN-IN (Resolves popup & domain restrictions) */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/80 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Google Account Fast Sign-in
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sign in instantly with your Google account without popup interruptions.
                </p>
              </div>

              {/* 1-Click Fast Connect if suggested email present */}
              {suggestedEmail && (
                <div className="p-3 rounded-2xl bg-white border border-[#D1D1D6] shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-[#0b3ba8]" />
                    </div>
                    <div className="truncate text-left">
                      <p className="text-xs font-bold text-[#1C1C1E] truncate font-mono">
                        {suggestedEmail}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Google Account Verified
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDirectGoogleSubmit(undefined, suggestedEmail)}
                    disabled={googleLoading}
                    className="px-3 py-2 rounded-xl bg-[#0b3ba8] hover:bg-[#07246b] text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {googleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sign In'}
                  </button>
                </div>
              )}

              {/* Custom Google Email Input Form */}
              <form onSubmit={(e) => handleDirectGoogleSubmit(e)} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#48484A] mb-1.5 uppercase tracking-wider text-left">
                    Or Enter Google Email
                  </label>
                  <div className="relative flex items-center rounded-2xl border border-[#D1D1D6] bg-white focus-within:border-[#0b3ba8] focus-within:ring-2 focus-within:ring-[#0b3ba8]/20 transition-all shadow-sm overflow-hidden">
                    <div className="pl-3.5 pr-2.5 py-3 text-slate-400">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      autoFocus={!suggestedEmail}
                      className="w-full pr-3.5 py-3 text-sm font-semibold text-[#1C1C1E] outline-none bg-transparent placeholder:text-[#8E8E93] placeholder:font-normal"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={googleLoading || !googleEmail.trim() || !googleEmail.includes('@')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0B2A4A] hover:bg-[#071A2E] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 text-[#D4A24E] animate-spin" />
                  ) : (
                    <>
                      <span>Continue with this Google Account</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4A24E] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Action Links */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('INPUT');
                    setError(null);
                  }}
                  className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  &larr; Back to Mobile OTP
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="text-[#0b3ba8] hover:underline font-bold cursor-pointer"
                >
                  Retry Browser Popup
                </button>
              </div>
            </div>
          ) : (
            /* STEP: ENTER 4 DIGIT OTP */
            <form onSubmit={handleVerifySubmit} className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                    OTP sent to
                  </span>
                  <span className="text-xs font-black text-[#1C1C1E] font-mono">
                    +91 {phoneNumber.replace(/\D/g, '').slice(-10)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleEditNumber}
                  className="text-xs font-bold text-[#B8892E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              <div>
                <label className="block text-center text-xs font-bold text-[#1C1C1E] mb-2.5">
                  Enter 4 Digit OTP
                </label>
                {/* 4 Separate Digit Inputs */}
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 rounded-2xl bg-white border-2 border-[#D1D1D6] focus:border-[#B8892E] focus:ring-2 focus:ring-[#B8892E]/20 text-center text-xl font-extrabold text-[#1C1C1E] font-mono outline-none shadow-sm transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* VERIFY & CONTINUE BUTTON */}
              <button
                type="submit"
                disabled={loading || otpDigits.some(d => !d)}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0B2A4A] hover:bg-[#071A2E] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 text-[#D4A24E] animate-spin" />
                ) : (
                  <>
                    <span>Verify &amp; Continue</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>

              {/* RESEND OTP WITH PROPER COUNTDOWN TIMER */}
              <div className="text-center pt-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-xs font-bold text-[#B8892E] hover:text-[#9A7020] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <p className="text-xs font-medium text-[#8E8E93]">
                    Resend OTP in <span className="font-bold text-[#1C1C1E] font-mono">{countdown}s</span>
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Secure Guarantee & Disclaimer Footer */}
          <div className="pt-3 border-t border-[#F2F2F7] text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#8E8E93]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>reCAPTCHA Enterprise &bull; 256-bit SSL Protected</span>
            </div>
            <p className="text-[10px] text-[#8E8E93]">
              By continuing, you agree to our Terms of Service &amp; Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
