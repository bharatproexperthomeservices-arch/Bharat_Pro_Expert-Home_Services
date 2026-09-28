import React, { useState, useEffect } from 'react';
import { 
  initiateAdminLoginStep1,
  verifyAdminOtp,
  resendAdminOtp,
  getAdminLockoutStatus,
  getAdminSession,
  resetFailedAttempts,
  registerAdminAccount
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
  User,
  UserPlus,
  LogIn,
  ArrowRight,
  Phone,
  Briefcase,
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
  // Mode: Sign In vs Sign Up
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Sign In Flow Sub-steps: EMAIL -> PASSWORD -> OTP -> SUCCESS
  const [signInStep, setSignInStep] = useState<'EMAIL' | 'PASSWORD' | 'OTP' | 'SUCCESS'>('EMAIL');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign Up Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('Operations Manager');
  const [regPassphrase, setRegPassphrase] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [regShowPass, setRegShowPass] = useState(false);

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
      setErrorMsg('Please enter your admin email address.');
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
      setErrorMsg('Please enter your admin email address.');
      setSignInStep('EMAIL');
      return;
    }
    if (!passphrase.trim()) {
      setErrorMsg('Please enter your admin security key / passphrase.');
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
        // Uniform error response (user enumeration prevention)
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

  // 4. Sign Up Handler (Register New Admin)
  const handleSignUpAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Please enter your admin email address.');
      return;
    }
    if (!regPassphrase.trim() || regPassphrase.length < 6) {
      setErrorMsg('Security passphrase must be at least 6 characters long.');
      return;
    }
    if (regPassphrase !== regConfirmPass) {
      setErrorMsg('Passphrase and Confirm Passphrase do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerAdminAccount({
        name: regName,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        passphrase: regPassphrase
      });

      if (res.success) {
        setInfoMsg(res.message);
        setEmail(regEmail.trim());
        setPassphrase(regPassphrase.trim());
        setAuthMode('SIGN_IN');
        setSignInStep('PASSWORD');
      } else {
        setErrorMsg(res.error || 'Failed to register admin account.');
      }
    } catch {
      setErrorMsg('Registration service error. Please retry.');
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
        setOtp('');
        setOtpExpirySeconds(300);
        setResendCooldown(60);
        setInfoMsg(res.message);
      } else {
        setErrorMsg(res.error || 'Failed to resend verification code.');
      }
    } catch {
      setErrorMsg('Network error while resending code.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 font-['Inter',sans-serif]">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-md mb-5 flex items-center justify-between">
        <button
          onClick={onBackToCustomerSite}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customer Website</span>
        </button>
        <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Restricted Security Gateway
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Branding & Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3 bg-blue-600/15 border border-blue-500/30 rounded-2xl mb-3 text-blue-400 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Bharat Pro Expert <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Layered Security &bull; Multi-Factor Administrator Authentication
          </p>
        </div>

        {/* TOP TABS: SIGN IN vs SIGN UP */}
        <div className="mb-5 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 flex text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('SIGN_IN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'SIGN_IN'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In (Login)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('SIGN_UP');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'SIGN_UP'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up (Register)</span>
          </button>
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
        {/* MODE 1: SIGN IN FLOW */}
        {/* ========================================================= */}
        {authMode === 'SIGN_IN' && (
          <div>
            {/* STEP 1A: PEHLE MAIL ID DAALNE KA OPTION */}
            {signInStep === 'EMAIL' && (
              <form onSubmit={handleProceedWithEmail} className="space-y-4 animate-in fade-in">
                <div className="text-left pb-1">
                  <span className="text-xs font-bold text-slate-200 block">
                    Step 1: Admin Account Email
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Pehle apna registered Admin Email ID enter karein
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Admin Email ID
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
                      placeholder="Enter Admin Email ID"
                      className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none font-medium transition-all disabled:opacity-50"
                      autoComplete="email"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Authorized account access strictly monitored &bull; IP logged
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

                <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
                  <span>Don't have an admin account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('SIGN_UP');
                      setErrorMsg(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                  >
                    Sign Up here
                  </button>
                </div>
              </form>
            )}

            {/* STEP 1B: ENTER PASSWORD / PASSPHRASE */}
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
                      Admin Security Key / Passphrase
                    </label>
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
                      placeholder="Enter Security Key"
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

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSignInStep('EMAIL')}
                    className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading || lockoutSeconds > 0}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Proceed to 2FA Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: REAL 6-DIGIT EMAIL OTP VERIFICATION */}
            {signInStep === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                <div className="text-center py-1">
                  <span className="text-xs text-slate-300 block">
                    Two-Factor Security Verification
                  </span>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-blue-400 mt-1 font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Code expires in: {formatTimer(otpExpirySeconds)}</span>
                  </div>
                </div>

                {/* If OTP notification was dispatched to owner */}
                {dispatchedOtp && (
                  <div className="p-3 bg-blue-950/70 border border-blue-600/60 rounded-xl text-xs text-blue-200 flex items-center justify-between animate-in fade-in">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wider">
                        Dispatched Owner Token:
                      </span>
                      <span className="font-mono text-sm font-bold text-white tracking-widest">{dispatchedOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(dispatchedOtp)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                    Enter 6-Digit Email OTP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      disabled={loading || lockoutSeconds > 0}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl py-3.5 text-center text-xl font-mono font-bold tracking-widest text-white outline-none shadow-inner"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Single-use security token valid for 5 minutes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6 || lockoutSeconds > 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing Session...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Verify OTP &amp; Authorize Access</span>
                    </>
                  )}
                </button>

                {/* Change Credentials / Resend */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInStep('PASSWORD');
                      setOtp('');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ← Back to Key
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading || lockoutSeconds > 0}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer disabled:opacity-40"
                  >
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {signInStep === 'SUCCESS' && (
              <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Identity Verified &bull; Session Authorized
                </h2>
                <p className="text-xs text-slate-400">
                  Decrypting management dashboard and synchronization modules...
                </p>
                <div className="w-36 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: SIGN UP FLOW (REGISTER NEW ADMIN) */}
        {/* ========================================================= */}
        {authMode === 'SIGN_UP' && (
          <form onSubmit={handleSignUpAdmin} className="space-y-3.5 animate-in fade-in">
            <div className="text-left pb-1">
              <span className="text-xs font-bold text-slate-200 block">
                Create Admin Portal Account
              </span>
              <span className="text-[11px] text-slate-400">
                Register administrative credentials for portal access
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. admin@bharatproexpert.com"
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-8 pr-2.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-2.5 py-2.5 text-xs text-white outline-none font-medium cursor-pointer"
                >
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Master Administrator">Master Admin</option>
                  <option value="Quality Supervisor">Quality Supervisor</option>
                  <option value="Dispatch Head">Dispatch Head</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Create Security Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={regShowPass ? 'text' : 'password'}
                  required
                  value={regPassphrase}
                  onChange={(e) => setRegPassphrase(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-medium"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setRegShowPass(!regShowPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {regShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={regShowPass ? 'text' : 'password'}
                  required
                  value={regConfirmPass}
                  onChange={(e) => setRegConfirmPass(e.target.value)}
                  placeholder="Re-enter passphrase"
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Complete Admin Sign Up</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
              <span>Already registered as Admin? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('SIGN_IN');
                  setErrorMsg(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
