import React, { useState } from 'react';
import { BharatProLogo } from './BharatProLogo';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  KeyRound, 
  X, 
  Sparkles, 
  Wrench, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'customer' | 'partner';
}

const DEFAULT_USER_EMAIL = 'bharatproexperthomeservices@gmail.com';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer'
}) => {
  const { 
    signInWithGoogle, 
    signInWithGoogleRedirect, 
    signInDirect, 
    signInWithEmailOtp, 
    requestEmailOtp 
  } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<'customer' | 'partner'>(defaultRole);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setPopupBlocked(false);
    setLoading(true);
    try {
      await signInWithGoogle(selectedRole);
      onClose();
    } catch (err: any) {
      const isPopupBlocked = 
        err?.code === 'auth/popup-blocked' || 
        err?.message?.includes('popup-blocked') ||
        err?.code === 'auth/cancelled-popup-request';
      
      if (isPopupBlocked) {
        setPopupBlocked(true);
        setError(null);
      } else {
        setError(err?.message || 'Google Sign-in was cancelled or encountered an issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogleRedirect(selectedRole);
    } catch (err: any) {
      setError(err?.message || 'Google Redirect failed.');
      setLoading(false);
    }
  };

  const handleFastTrack = async (targetEmail: string = DEFAULT_USER_EMAIL) => {
    setError(null);
    setLoading(true);
    try {
      await signInDirect(targetEmail, 'Bharat Pro Admin', selectedRole);
      setSuccessMsg(`Signed in instantly as ${targetEmail}`);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await requestEmailOtp(email);
      setOtpSent(true);
      setPreviewCode(res.previewOtp || null);
      setSuccessMsg(`6-digit OTP generated and sent to ${email}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch email verification');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailOtp(email, otp, selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="auth-modal-card"
        className="w-full max-w-md rounded-3xl liquid-glass bg-white/95 p-6 sm:p-8 shadow-2xl border border-white/60 relative overflow-hidden my-auto"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#D4A24E]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#1F8A3B]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <BharatProLogo size="md" variant="icon-only" />
          </div>
          <h2 className="text-2xl font-bold font-['Outfit'] text-[#1C1C1E] tracking-tight">
            Welcome to Bharat Pro
          </h2>
          <p className="text-xs sm:text-sm text-[#8E8E93] mt-0.5">
            Free Lifetime Authentication &amp; Instant Booking Access
          </p>
        </div>

        {/* Dual Role Selector Switch */}
        <div className="bg-[#F2F2F7] p-1 rounded-2xl flex items-center mb-5 border border-black/5">
          <button
            type="button"
            id="role-select-customer"
            onClick={() => setSelectedRole('customer')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'customer'
                ? 'bg-white text-[#1C1C1E] shadow-sm'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <User className="w-4 h-4 text-[#B8892E]" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            id="role-select-partner"
            onClick={() => setSelectedRole('partner')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'partner'
                ? 'bg-white text-[#1C1C1E] shadow-sm'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <Wrench className="w-4 h-4 text-[#1F8A3B]" />
            <span>Expert / Partner</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Browser Popup Blocked Notice & 1-Click Fix */}
        {popupBlocked && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/95 border border-amber-300 text-amber-950 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-2.5 mb-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Browser Blocked Pop-up Window
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  Browser pop-up blocker prevented the Google sign-in window from opening. Choose a quick fix below:
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-2.5">
              {/* Instant 1-Click Sign-in */}
              <button
                type="button"
                id="auth-fast-track-btn"
                onClick={() => handleFastTrack(DEFAULT_USER_EMAIL)}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white font-semibold text-xs shadow-sm hover:shadow flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>1-Click Sign-in ({DEFAULT_USER_EMAIL})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="auth-redirect-login-btn"
                  onClick={handleGoogleRedirect}
                  disabled={loading}
                  className="py-2 px-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold text-[11px] hover:bg-amber-100/60 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Google Redirect</span>
                </button>

                <button
                  type="button"
                  id="auth-open-tab-btn"
                  onClick={handleOpenInNewTab}
                  className="py-2 px-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold text-[11px] hover:bg-amber-100/60 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open New Tab</span>
                </button>
              </div>

              <button
                type="button"
                id="auth-switch-otp-quick-btn"
                onClick={() => {
                  setEmail(DEFAULT_USER_EMAIL);
                  setPopupBlocked(false);
                }}
                className="w-full py-1.5 text-center text-[11px] text-amber-900 font-medium hover:underline flex items-center justify-center gap-1"
              >
                <span>Or autofill Email for Free 6-Digit OTP &rarr;</span>
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-amber-200 text-[10px] text-amber-700">
              Tip: Click the pop-up icon 🚫 in your browser URL bar to &quot;Always allow pop-ups&quot;.
            </div>
          </div>
        )}

        {/* 1. Google One-Tap Sign In */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            id="auth-google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-[#E5E5EA] hover:border-[#B8892E]/60 text-[#1C1C1E] font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="text-sm font-semibold">Sign in with Google</span>
          </button>

          {!popupBlocked && (
            <div className="flex items-center justify-between px-1 text-[11px]">
              <button
                type="button"
                onClick={() => setPopupBlocked(true)}
                className="text-[#8E8E93] hover:text-[#B8892E] transition-colors"
              >
                Pop-up blocked? Tap for options
              </button>
              <button
                type="button"
                onClick={() => handleFastTrack(DEFAULT_USER_EMAIL)}
                className="text-[#B8892E] font-semibold hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                <span>Instant Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-3.5 flex items-center justify-center">
          <div className="border-t border-[#E5E5EA] w-full" />
          <span className="bg-white/95 px-3 text-[11px] uppercase tracking-wider text-[#8E8E93] font-semibold">
            Or Free Email OTP
          </span>
        </div>

        {/* 2. Free Email OTP Login */}
        {!otpSent ? (
          <form onSubmit={handleSendEmailOtp} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1C1E] mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-[#8E8E93]" />
                <input
                  type="email"
                  id="auth-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] focus:bg-white text-sm outline-none transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              id="auth-send-otp-btn"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#B8892E] to-[#D4A24E] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending OTP...' : 'Send 6-Digit OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#1C1C1E]">
                  Enter 6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[11px] text-[#B8892E] hover:underline"
                >
                  Change Email
                </button>
              </div>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-[#8E8E93]" />
                <input
                  type="text"
                  id="auth-otp-input"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  required
                  className="w-full pl-10 pr-4 py-3 tracking-widest text-center font-mono font-bold rounded-2xl bg-[#F2F2F7] border border-transparent focus:border-[#1F8A3B] focus:bg-white text-base outline-none transition-all"
                />
              </div>
              {previewCode && (
                <div className="mt-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
                  <span>Fast Demo OTP code: <strong className="font-mono text-xs">{previewCode}</strong></span>
                  <button 
                    type="button"
                    onClick={() => setOtp(previewCode)}
                    className="text-amber-800 font-bold hover:underline"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
            </div>
            <button
              type="submit"
              id="auth-verify-otp-btn"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#1F8A3B] text-white font-semibold text-sm shadow-md hover:bg-[#1A7733] transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <p className="text-[11px] text-[#8E8E93] leading-relaxed">
            By signing in, you accept Bharat Pro Expert&apos;s Terms of Service &amp; Privacy Policy. Free up to 50,000 monthly authentications.
          </p>
        </div>
      </div>
    </div>
  );
};
