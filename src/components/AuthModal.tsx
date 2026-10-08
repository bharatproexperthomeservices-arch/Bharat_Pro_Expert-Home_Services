import React, { useState, useEffect } from 'react';
import { BharatProLogo } from './BharatProLogo';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

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
  const { signInWithGoogle, user } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  // Login hote hi (Firebase user mil gaya) modal band karo
  useEffect(() => {
    if (isOpen && user) {
      setGoogleLoading(false);
      onSuccess?.();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // Popup me Google login khulega
      await signInWithGoogle(defaultRole);
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setError('Google login is not enabled. Please enable it in Firebase Console.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Please contact support.');
      } else {
        setError('Google Sign-in encountered an issue. Please try again.');
      }
    } finally {
      // Popup band ho ya login ho jaye, button hamesha wapas normal ho
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>

        <div className="pt-8 px-6 pb-4 text-center">
          <div className="flex justify-center mb-3"><BharatProLogo size="md" /></div>
          <h2 className="text-xl font-extrabold text-slate-800">Welcome to Bharat Pro Expert</h2>
          <p className="text-xs font-semibold text-amber-500 mt-0.5">Trusted Home Services</p>
        </div>

        <div className="px-6 pb-7 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border font-bold text-xs shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 text-amber-500 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <div className="pt-3 border-t text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit SSL Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;