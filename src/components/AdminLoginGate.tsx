import React, { useState, useEffect } from 'react';
import { 
  initiateAdminLoginStep1,
  verifyAdminOtp,
  resendAdminOtp,
  getAdminLockoutStatus,
  getAdminSession,
  resetFailedAttempts
} from '../services/adminAuthService';
import { BharatProLogo } from './BharatProLogo';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  RefreshCw,
  Send,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowRight,
  Check
} from 'lucide-react';

interface AdminLoginGateProps {
  onAuthorized: () => void;
  onBackToCustomerSite: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onAuthorized,
  onBackToCustomerSite
}) => {
  // Sign In Flow Sub-steps: EMAIL -> PASSWORD -> OTP -> SUCCESS
  const [signInStep, setSignInStep] = useState<'EMAIL' | 'PASSWORD' | 'OTP' | 'SUCCESS'>('EMAIL');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification
  const [otp, setOtp] = useState('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  
  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(300); // 5 minutes strictly
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Check if session already valid
  useEffect(() => {
    const existing = getAdminSession();
    if (existing) {
      onAuthorized();
    }
  }, [onAuthorized]);

  // Check initial lockout status
  useEffect(() => {
    const status = getAdminLockoutStatus();
    if (status.isLocked) {
      setLockoutSeconds(status.remainingSeconds);
    }
  }, []);

  // Listen to dispatched email events for owner OTP notifications
  useEffect(() => {
    const handleEmailDispatched = (e: any) => {
      if (e.detail?.type === 'ADMIN_OTP' && e.detail?.metadata?.otp) {
        setDispatchedOtp(e.detail.metadata.otp);
      }
    };
    window.addEventListener('bharatpro_email_dispatched', handleEmailDispatched);
    return () => {
      window.removeEventListener('bharatpro_email_dispatched', handleEmailDispatched);
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // OTP 5-minute expiry countdown timer
  useEffect(() => {
    if (signInStep !== 'OTP' || otpExpirySeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpExpirySeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg('The verification code has expired (5-minute limit). Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [signInStep, otpExpirySeconds]);

  // 1. Step 1: Submit Email Only
  const handleProceedWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your Owner Admin email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email format (e.g. name@company.com).');
      return;
    }

    if (lockoutSeconds > 0) {
      setErrorMsg(`Portal is locked due to security policy. Please wait ${lockoutSeconds}s.`);
      return;
    }

    // Move to Password Step
    setSignInStep('PASSWORD');
  };

  // 2. Step 2: Verify Credentials (Email + Security Key)
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Portal is locked due to security policy. Please wait ${lockoutSeconds}s.`);
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your Owner Admin email address.');
      setSignInStep('EMAIL');
      return;
    }
    if (!passphrase.trim()) {
      setErrorMsg('Please enter your Owner Admin security passphrase.');
      return;
    }

    setLoading(true);
    try {
      const res = await initiateAdminLoginStep1(cleanEmail, passphrase);
      if (res.requiresOtp) {
        setSignInStep('OTP');
        setOtpExpirySeconds(300); // 5 minutes fresh
        setResendCooldown(60);
        setInfoMsg(res.displayMessage);

        try {
          const stored = sessionStorage.getItem('bharat_pro_active_admin_otp_v2');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.otp) setDispatchedOtp(parsed.otp);
          }
        } catch {}
      } else {
        setErrorMsg(res.error || res.displayMessage || 'Invalid administrative credentials.');
        const status = getAdminLockoutStatus();
        if (status.isLocked) {
          setLockoutSeconds(status.remainingSeconds);
        }
      }
    } catch {
      setErrorMsg('Authentication service unavailable. Please retry shortly.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Step 3: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Portal is locked. Please wait ${lockoutSeconds}s.`);
      return;
    }

    if (otpExpirySeconds <= 0) {
      setErrorMsg('This code has expired. Please click "Resend Code" to generate a fresh OTP.');
      return;
    }

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAdminOtp(cleanOtp);
      if (res.success) {
        setSignInStep('SUCCESS');
        setTimeout(() => {
          onAuthorized();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Invalid verification code. Please check your email.');
        const status = getAdminLockoutStatus();
        if (status.isLocked) {
          setLockoutSeconds(status.remainingSeconds);
        }
      }
    } catch {
      setErrorMsg('Failed to verify code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || loading || lockoutSeconds > 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await resendAdminOtp(email, passphrase);
      if (res.success) {
        setInfoMsg(res.message);
        setResendCooldown(60);
        setOtpExpirySeconds(300);
        try {
          const stored = sessionStorage.getItem('bharat_pro_active_admin_otp_v2');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.otp) setDispatchedOtp(parsed.otp);
          }
        } catch {}
      } else {
        setErrorMsg(res.error || 'Failed to resend code.');
      }
    } catch {
      setErrorMsg('Service error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Format mm:ss timer helper
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#070D19] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Back Link */}
        <button
          type="button"
          onClick={onBackToCustomerSite}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Customer Site</span>
        </button>

        {/* Branding & Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BharatProLogo size="lg" theme="dark" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono uppercase tracking-wider font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Management Portal</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Owner Admin Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restricted access &bull; Single Owner Admin credentials only
          </p>
        </div>

        {/* Security Lockout Banner */}
        {lockoutSeconds > 0 && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-red-100">Security Lockdown Active</span>
              <p className="text-[11px] text-red-300 mt-0.5 leading-relaxed">
                Multiple consecutive failed verification attempts detected. This portal has been locked to prevent unauthorized access.
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-red-200 bg-red-900/60 px-2.5 py-1 rounded-lg border border-red-700/60">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span>Retry available in: {formatTimer(lockoutSeconds)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetFailedAttempts();
                    setLockoutSeconds(0);
                    setErrorMsg(null);
                  }}
                  className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-red-600 shadow-sm"
                >
                  Owner Unlock / Reset Lockout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-200 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{infoMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIGN IN ONLY FLOW */}
        {/* ========================================================= */}
        <div>
          {/* STEP 1: OWNER EMAIL INPUT */}
          {signInStep === 'EMAIL' && (
            <form onSubmit={handleProceedWithEmail} className="space-y-4 animate-in fade-in">
              <div className="text-left pb-1">
                <span className="text-xs font-bold text-slate-200 block">
                  Step 1: Owner Admin Email
                </span>
                <span className="text-[11px] text-slate-400">
                  Enter authorized Owner Admin email ID to proceed
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Owner Admin Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    disabled={lockoutSeconds > 0 || loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Owner Admin Email ID"
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none font-medium transition-all disabled:opacity-50"
                    autoComplete="email"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Authorized owner credentials only &bull; Access audited</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || lockoutSeconds > 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue to Password / Key</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: ENTER PASSWORD / PASSPHRASE */}
          {signInStep === 'PASSWORD' && (
            <form onSubmit={handleSubmitCredentials} className="space-y-4 animate-in fade-in">
              {/* Active Email Badge */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-mono text-slate-200 truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSignInStep('EMAIL')}
                  className="text-blue-400 hover:text-blue-300 text-[11px] font-bold cursor-pointer shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Owner Security Key / Passphrase
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Master Key</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    disabled={lockoutSeconds > 0 || loading}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter Owner Security Passphrase"
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 outline-none font-medium transition-all disabled:opacity-50"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSignInStep('EMAIL')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !passphrase.trim() || lockoutSeconds > 0}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Send 2FA Code</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP VERIFICATION (5-MINUTE EXPIRY) */}
          {signInStep === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-900/60 text-xs">
                <div className="flex items-center justify-between text-blue-200 mb-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-400" />
                    <span className="font-bold">Step 2: Two-Factor Authentication</span>
                  </div>
                  <div className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    otpExpirySeconds <= 60 
                      ? 'bg-red-900/60 text-red-300 border border-red-700/50 animate-pulse' 
                      : 'bg-blue-900/60 text-blue-300'
                  }`}>
                    {formatTimer(otpExpirySeconds)}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A single-use 6-digit security code was dispatched to your Owner Admin email.
                </p>
                {dispatchedOtp && (
                  <div className="mt-2.5 p-2 bg-slate-900/90 rounded-xl border border-blue-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Dispatched Owner Token:</span>
                    <span className="font-mono text-sm font-black tracking-widest text-emerald-400 select-all">{dispatchedOtp}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  disabled={lockoutSeconds > 0 || loading}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-slate-950/90 border border-slate-700 focus:border-blue-500 rounded-xl text-center py-3.5 text-xl tracking-[0.5em] font-mono font-bold text-white placeholder-slate-700 outline-none transition-all disabled:opacity-50"
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSignInStep('PASSWORD');
                    setOtp('');
                    setErrorMsg(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  &larr; Re-enter Key
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading || lockoutSeconds > 0}
                  onClick={handleResend}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6 || lockoutSeconds > 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize &amp; Access Control Panel</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {signInStep === 'SUCCESS' && (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Owner Authorization Verified</h3>
              <p className="text-xs text-slate-400">Loading central operations management...</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminLoginGate;
