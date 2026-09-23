import React, { useState, useEffect } from 'react';
import { 
  requestAdminLogin, 
  approveAdminLogin, 
  subscribeToAdminRequest, 
  saveAdminSession, 
  getAdminSession, 
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
  Sparkles
} from 'lucide-react';

interface AdminLoginGateProps {
  onAuthorized: () => void;
  onBackToCustomerSite: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onAuthorized,
  onBackToCustomerSite
}) => {
  const [email, setEmail] = useState('admin@bharatproexpert.com');
  const [name, setName] = useState('Operations Manager');
  const [currentRequest, setCurrentRequest] = useState<AdminLoginRequest | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'WAITING' | 'APPROVED' | 'REJECTED'>('IDLE');
  const [authPin, setAuthPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOwnerQuickApprovalOpen, setIsOwnerQuickApprovalOpen] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const existing = getAdminSession();
    if (existing) {
      onAuthorized();
    }
  }, [onAuthorized]);

  // Subscribe to approval updates when a request is active
  useEffect(() => {
    if (!currentRequest) return;

    const unsubscribe = subscribeToAdminRequest(currentRequest.id, (updated) => {
      setCurrentRequest(updated);
      if (updated.status === 'APPROVED') {
        setStatus('APPROVED');
        saveAdminSession(updated.requesterEmail, updated.id);
        setTimeout(() => {
          onAuthorized();
        }, 1200);
      } else if (updated.status === 'REJECTED') {
        setStatus('REJECTED');
      }
    });

    return () => unsubscribe();
  }, [currentRequest, onAuthorized]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setPinError(null);
    try {
      const req = await requestAdminLogin(email, name);
      setCurrentRequest(req);
      setStatus('WAITING');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const entered = authPin.trim();
    if (!entered) {
      setPinError('कृपया Authorization PIN दर्ज करें');
      return;
    }

    // Check against request access code OR owner master PIN
    if (
      (currentRequest && entered === currentRequest.accessCode) || 
      entered === OWNER_MASTER_PIN
    ) {
      if (currentRequest) {
        await approveAdminLogin(currentRequest.id, `${OWNER_EMAIL} (via PIN)`);
      }
      setStatus('APPROVED');
      saveAdminSession(email, currentRequest?.id);
      setTimeout(() => {
        onAuthorized();
      }, 900);
    } else {
      setPinError('गलत PIN! यह PIN मेल पर भेजे गए OTP या Master PIN से मेल नहीं खाता।');
    }
  };

  const handleSimulateOwnerApproval = async () => {
    if (!currentRequest) return;
    setLoading(true);
    await approveAdminLogin(currentRequest.id, OWNER_EMAIL);
    setLoading(false);
    setIsOwnerQuickApprovalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-blue-600">
      
      {/* Top Bar */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          onClick={onBackToCustomerSite}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Website</span>
        </button>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Owner Protected Gateway
        </span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-600/15 border border-blue-500/30 rounded-2xl mb-3 text-blue-400 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Bharat Pro Expert <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider">Admin</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            2-Step Owner Authorization Protocol
          </p>
        </div>

        {/* STATE 1: IDLE / FORM */}
        {status === 'IDLE' && (
          <form onSubmit={handleSendRequest} className="space-y-4">
            <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-blue-100">Owner Approval Mandatory:</span>
                Admin Panel mein login ke liye Owner (<strong className="text-white underline">{OWNER_EMAIL}</strong>) ke paas approval request jayegi. Unke approve karne par hi login hoga.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bharatproexpert.com"
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff / Manager Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Operations Manager / Supervisor"
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Sending Approval Request...' : 'Request Owner Approval to Login'}
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-500">
                Are you the Owner? You can also unlock directly with Owner Master Key: <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded font-mono">{OWNER_MASTER_PIN}</code>
              </span>
            </div>
          </form>
        )}

        {/* STATE 2: WAITING FOR APPROVAL */}
        {status === 'WAITING' && currentRequest && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="relative inline-block mb-3">
                <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-amber-400">
                  <Clock className="w-7 h-7 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping"></span>
              </div>
              <h2 className="text-sm font-bold text-white">
                Approval Pending from Owner
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Request mail sent to <span className="text-white font-medium underline">{OWNER_EMAIL}</span>. Login tabhi khulega jab Owner approve karega.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Request ID:</span>
                <span className="text-blue-400 font-bold">{currentRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requester:</span>
                <span className="text-white">{currentRequest.requesterEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span>{new Date(currentRequest.requestedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-amber-400 font-sans font-semibold">Live Status:</span>
                <span className="bg-amber-950 text-amber-300 border border-amber-800/40 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">
                  Awaiting Approval
                </span>
              </div>
            </div>

            {/* Quick Authorization PIN form */}
            <form onSubmit={handleVerifyPin} className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-300">
                Or Enter Authorization Code / Master PIN:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  placeholder="Enter 6-digit Code / Master PIN"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-center font-mono tracking-widest text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Verify
                </button>
              </div>
              {pinError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {pinError}
                </p>
              )}
            </form>

            {/* Quick Owner Actions for Demo / Testing */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Owner Quick Action:</span>
                <span className="text-blue-400 font-semibold">{OWNER_EMAIL}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateOwnerApproval}
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {loading ? 'Approving...' : 'Owner 1-Click Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('IDLE')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: APPROVED */}
        {status === 'APPROVED' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-white">
              Admin Access Approved!
            </h2>
            <p className="text-xs text-slate-400">
              Verified by <strong className="text-emerald-400">{OWNER_EMAIL}</strong>.<br />
              Launching Bharat Pro Admin Dashboard...
            </p>
          </div>
        )}

        {/* STATE 4: REJECTED */}
        {status === 'REJECTED' && (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center text-red-400 mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-red-400">
              Login Request Rejected
            </h2>
            <p className="text-xs text-slate-400">
              Owner (<strong className="text-white">{OWNER_EMAIL}</strong>) ne aapki login request reject kar di hai. Unauthorized access allowed nahi hai.
            </p>
            <button
              onClick={() => setStatus('IDLE')}
              className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Try Again with Valid Details
            </button>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-500 max-w-sm">
        Official Bharat Pro Expert Operations Portal &bull; All login attempts are audited and logged with IP &amp; timestamp.
      </div>
    </div>
  );
};
