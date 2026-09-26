import React, { useState, useEffect } from 'react';
import { 
  requestAdminLogin, 
  approveAdminLogin, 
  subscribeToAdminRequest, 
  saveAdminSession, 
  getAdminSession, 
  isOwnerEmail,
  sendAdminOtp,
  verifyAdminOtp,
  OWNER_MASTER_PIN 
} from '../services/adminAuthService';
import { OWNER_EMAIL, generateMailtoLink } from '../services/emailService';
import { AdminLoginRequest } from '../types';
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
  ExternalLink,
  ShieldAlert,
  UserCheck,
  Send,
  RefreshCw,
  Info
} from 'lucide-react';

interface AdminLoginGateProps {
  onAuthorized: () => void;
  onBackToCustomerSite: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onAuthorized,
  onBackToCustomerSite
}) => {
  // Enforced Owner User ID
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'LOGIN_INPUT' | 'OTP_VERIFICATION' | 'UNAUTHORIZED_PENDING' | 'SUCCESS'>('LOGIN_INPUT');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [unauthorizedRequest, setUnauthorizedRequest] = useState<AdminLoginRequest | null>(null);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Check existing session
  useEffect(() => {
    const existing = getAdminSession();
    if (existing && isOwnerEmail(existing.email)) {
      onAuthorized();
    }
  }, [onAuthorized]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Listen to external request if unauthorized attempt was made
  useEffect(() => {
    if (!unauthorizedRequest) return;
    const unsubscribe = subscribeToAdminRequest(unauthorizedRequest.id, (updated) => {
      setUnauthorizedRequest(updated);
      if (updated.status === 'APPROVED') {
        saveAdminSession(updated.requesterEmail, updated.id);
        setStep('SUCCESS');
        setTimeout(() => onAuthorized(), 1000);
      }
    });
    return () => unsubscribe();
  }, [unauthorizedRequest, onAuthorized]);

  // Step 1: Send Real Mail OTP for bharatproexpert@gmail.com
  const handleInitiateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('कृपया Email / User ID दर्ज करें');
      return;
    }

    setLoading(true);

    // Strict Rule: ONLY bharatproexpert@gmail.com can log in!
    if (!isOwnerEmail(cleanEmail)) {
      try {
        const req = await requestAdminLogin(cleanEmail, 'External User');
        setUnauthorizedRequest(req);
        setStep('UNAUTHORIZED_PENDING');
        setErrorMsg(`Access Denied! Admin Panel सिर्फ Owner (${OWNER_EMAIL}) के लिए आरक्षित है। आपकी लॉगिन रिक्वेस्ट Owner के पास approval के लिए भेज दी गई है।`);
      } catch (err: any) {
        setErrorMsg('अनधिकृत अनुरोध भेजने में विफल।');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Owner verified: Send Real OTP to bharatproexpert@gmail.com
    try {
      const res = await sendAdminOtp(cleanEmail);
      if (res.success) {
        setOtpSentAt(Date.now());
        setResendCooldown(60);
        setPreviewOtp(res.otp || null);
        setSuccessMsg(`Real OTP ${OWNER_EMAIL} पर भेज दिया गया है!`);
        setStep('OTP_VERIFICATION');
      } else {
        setErrorMsg(res.error || 'OTP भेजने में समस्या आई।');
      }
    } catch (err: any) {
      setErrorMsg('OTP सेवा से संपर्क नहीं हो पाया।');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Mail OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMsg('कृपया 6-अंकों का OTP दर्ज करें');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAdminOtp(email, cleanOtp);
      if (res.success) {
        setStep('SUCCESS');
        setSuccessMsg('सुरक्षा सत्यापन सफल! Bharat Pro Expert Admin Panel लोड हो रहा है...');
        setTimeout(() => {
          onAuthorized();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'गलत OTP! कृपया मेल पर भेजा गया सही कोड दर्ज करें।');
      }
    } catch (err: any) {
      setErrorMsg('सत्यापन के दौरान त्रुटि।');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await sendAdminOtp(email);
      if (res.success) {
        setResendCooldown(60);
        setPreviewOtp(res.otp || null);
        setSuccessMsg(`नया 6-अंकों का OTP पुनः ${OWNER_EMAIL} पर भेज दिया गया है।`);
      }
    } catch {
      setErrorMsg('OTP पुनः भेजने में त्रुटि।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600 font-['Inter',sans-serif]">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          onClick={onBackToCustomerSite}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Customer Website</span>
        </button>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Owner Protected Gateway
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-[#D4A24E]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-600/15 border border-blue-500/30 rounded-2xl mb-3 text-blue-400 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Bharat Pro Expert <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Admin</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real Mail OTP Security Protocol &bull; Restricted Access
          </p>
        </div>

        {/* Security Rule Pill */}
        <div className="mb-5 p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-xs text-blue-200 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-blue-100">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Dedicated Admin ID:</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
            Admin Panel me login sirf <strong className="text-white underline font-bold">{OWNER_EMAIL}</strong> se hi ho sakta hai. Real OTP email par verify hoga.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: LOGIN FORM */}
        {step === 'LOGIN_INPUT' && (
          <form onSubmit={handleInitiateLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Authorized Admin User ID / Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={OWNER_EMAIL}
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none font-medium transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Note: Koi aur email dalne par login nahi hoga, approval request jayegi.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Real OTP to {OWNER_EMAIL}...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Real Mail OTP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: REAL OTP VERIFICATION */}
        {step === 'OTP_VERIFICATION' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
            <div className="text-center py-1">
              <span className="text-xs text-slate-300 block">
                6-अंकों का Real OTP इस मेल पर भेजा गया है:
              </span>
              <span className="text-xs font-bold text-amber-400 block mt-0.5 font-mono">
                {OWNER_EMAIL}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                Enter 6-Digit Email OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="• • • • • •"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl py-3 text-center text-lg font-mono font-bold tracking-widest text-white outline-none shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify OTP &amp; Login to Admin</span>
                </>
              )}
            </button>

            {/* Quick Actions & Resend */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStep('LOGIN_INPUT');
                  setOtp('');
                  setErrorMsg(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            {/* Emergency Owner Master Key Note */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span>Mail deliverability issue? Owner emergency PIN: </span>
                <code className="text-amber-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                  {OWNER_MASTER_PIN}
                </code>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: UNAUTHORIZED ATTEMPT PENDING APPROVAL */}
        {step === 'UNAUTHORIZED_PENDING' && unauthorizedRequest && (
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="w-14 h-14 bg-red-500/15 border border-red-500/40 rounded-full flex items-center justify-center text-red-400 mx-auto">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-white">
                Admin Access Blocked &bull; Approval Request Dispatched
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Admin Panel me direct login sirf <span className="text-white underline font-semibold">{OWNER_EMAIL}</span> ka hai. Aapka login request owner ke paas approval ke liye bhej diya gaya hai.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono text-slate-300 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Request ID:</span>
                <span className="text-blue-400 font-bold">{unauthorizedRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Email:</span>
                <span className="text-white">{unauthorizedRequest.requesterEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Owner:</span>
                <span className="text-emerald-400">{OWNER_EMAIL}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-amber-400 font-sans font-semibold">Live Status:</span>
                <span className="bg-amber-950 text-amber-300 border border-amber-800/40 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">
                  Awaiting Approval
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setEmail(OWNER_EMAIL);
                  setStep('LOGIN_INPUT');
                  setErrorMsg(null);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Log In with Owner ID ({OWNER_EMAIL})
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-white">
              Identity Verified &bull; Access Granted
            </h2>
            <p className="text-xs text-slate-400">
              Welcome Super Admin (<strong className="text-emerald-400">{OWNER_EMAIL}</strong>).<br />
              Loading Bharat Pro Operations Panel...
            </p>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-500 max-w-sm">
        Official Bharat Pro Expert Operations Gateway &bull; All unauthorized access attempts are logged and reported to {OWNER_EMAIL}.
      </div>
    </div>
  );
};
