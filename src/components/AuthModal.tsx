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
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Phone,
  Briefcase
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'customer' | 'partner';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer'
}) => {
  const { 
    signInWithGoogle, 
    signInDirect, 
    signInWithEmailOtp, 
    requestEmailOtp 
  } = useAuth();
  
  const [authTab, setAuthTab] = useState<'login' | 'forgot'>('login');

  React.useEffect(() => {
    if (isOpen) {
      setAuthTab('login');
    }
  }, [isOpen]);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'partner'>(defaultRole);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle(selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-in was cancelled or encountered an issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await requestEmailOtp(email);
      if (res.success) {
        setOtpSent(true);
        setSuccessMsg(`OTP sent to ${email}. Check your inbox!`);
      } else {
        setError(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signInWithEmailOtp(email, otp, selectedRole);
      setSuccessMsg('Successfully authenticated!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] overflow-hidden relative my-auto animate-in zoom-in-95 duration-150 font-['Inter',sans-serif]"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <BharatProLogo size="sm" variant="horizontal" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-[#0B2A4A] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Pill */}
        <div className="p-5 pb-0">
          <div className="flex bg-[#F1F5F9] p-1 rounded-full text-xs font-bold">
            <button
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'customer' 
                  ? 'bg-[#0B2A4A] text-white shadow-xs' 
                  : 'text-gray-600 hover:text-[#0B2A4A]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Portal</span>
            </button>
            <button
              onClick={() => setSelectedRole('partner')}
              className={`flex-1 py-1.5 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'partner' 
                  ? 'bg-[#0B2A4A] text-white shadow-xs' 
                  : 'text-gray-600 hover:text-[#0B2A4A]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Professional / Pro</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E2E8F0] px-5 mt-4 text-xs font-bold text-[#0B2A4A]">
          <button
            onClick={() => { setAuthTab('login'); setError(null); }}
            className={`pb-2 mr-6 transition-all cursor-pointer ${
              authTab === 'login' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthTab('forgot'); setError(null); }}
            className={`pb-2 transition-all cursor-pointer ${
              authTab === 'forgot' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#EBF8EE] border border-[#C6ECD2] text-[#2FA84F] text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-bold text-[#0B2A4A] flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span>or use email OTP</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Form based on Tab */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#0B2A4A] block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-medium outline-none focus:border-[#0B2A4A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-full bg-[#0B2A4A] hover:bg-[#071E36] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{authTab === 'forgot' ? 'Send Password Reset Link' : 'Send One-Time Password'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F5A400]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#0B2A4A] block mb-1">Enter 6-Digit OTP</label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP (e.g. 123456)"
                    maxLength={6}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold tracking-widest outline-none focus:border-[#0B2A4A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-full bg-[#2FA84F] hover:bg-[#289244] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Verify &amp; Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-[11px] text-gray-500 hover:text-[#0B2A4A] py-1 cursor-pointer font-medium"
              >
                ← Change Email or Resend
              </button>
            </form>
          )}

          {/* Footer (Only for Forgot Password return) */}
          {authTab === 'forgot' && (
            <div className="pt-2 border-t border-gray-100 text-center text-xs text-gray-500">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setError(null); }}
                className="text-[#0B2A4A] font-bold hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
