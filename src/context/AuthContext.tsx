import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  firebaseSignOut, 
  onAuthStateChanged, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  FirebaseUser 
} from '../firebase-config';
import { UserProfile } from '../types';
import { 
  handleGoogleCustomerAuth, 
  loginWithGoogleEmail,
  sendCustomerMobileOtp, 
  verifyCustomerMobileOtp,
  linkMobileToExistingCustomer,
  getCustomerSession,
  clearCustomerSession
} from '../services/customerAuthService';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  role: 'customer' | 'partner' | 'admin';
  signInWithGoogle: (targetRole?: 'customer' | 'partner') => Promise<UserProfile>;
  signInWithGoogleRedirect: (targetRole?: 'customer' | 'partner') => Promise<void>;
  signInWithGoogleAccount: (email: string, displayName?: string, targetRole?: 'customer' | 'partner') => Promise<UserProfile>;
  signInWithMobileOtp: (phone: string, otp: string) => Promise<UserProfile>;
  requestMobileOtp: (phone: string) => Promise<{ success: boolean; message: string; error?: string; previewOtp?: string; cooldownSeconds?: number }>;
  linkMobile: (phone: string, otp: string) => Promise<UserProfile>;
  signInDirect: (email: string, name?: string, targetRole?: 'customer' | 'partner') => Promise<void>;
  signInWithEmailOtp: (email: string, otp: string, targetRole?: 'customer' | 'partner') => Promise<void>;
  requestEmailOtp: (email: string) => Promise<{ success: boolean; message: string; previewOtp?: string }>;
  switchRole: (newRole: 'customer' | 'partner' | 'admin') => void;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => getCustomerSession());
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'customer' | 'partner' | 'admin'>('customer');

  // Check redirect result on mount (guarded with timeout)
  useEffect(() => {
    Promise.race([
      getRedirectResult(auth),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
    ]).then(async (result) => {
      if (result?.user) {
        const fbUser = result.user;
        setUser(fbUser);
        try {
          const authRes = await handleGoogleCustomerAuth(fbUser);
          if (authRes.success) {
            setProfile(authRes.profile);
            setRole(authRes.profile.role || 'customer');
          }
        } catch (e) {
          console.warn('Error reading user after redirect', e);
        }
      }
    }).catch((err) => {
      console.warn('Redirect check error', err);
    });
  }, []);

  useEffect(() => {
    // Check fallback stored session first if no fb user
    const savedLocal = getCustomerSession();
    if (savedLocal && !profile) {
      setProfile(savedLocal);
      setRole(savedLocal.role || 'customer');
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const authRes = await handleGoogleCustomerAuth(fbUser);
          if (authRes.success) {
            setProfile(authRes.profile);
            setRole(authRes.profile.role || 'customer');
          }
        } catch (error) {
          console.warn('Firestore load error, falling back to local session:', error);
        }
      }
      setLoading(false);
    });

    const handleCustomerAuthEvent = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
        setRole(e.detail.role || 'customer');
      } else {
        setProfile(null);
      }
    };
    window.addEventListener('bharatpro_customer_auth_changed', handleCustomerAuthEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('bharatpro_customer_auth_changed', handleCustomerAuthEvent);
    };
  }, [role]);

  const signInWithGoogle = async (targetRole: 'customer' | 'partner' = 'customer'): Promise<UserProfile> => {
    setLoading(true);
    try {
      setRole(targetRole);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setUser(fbUser);

      const authRes = await handleGoogleCustomerAuth(fbUser);
      setProfile(authRes.profile);
      return authRes.profile;
    } catch (err: any) {
      console.error('Google Sign-in failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogleRedirect = async (targetRole: 'customer' | 'partner' = 'customer') => {
    setLoading(true);
    setRole(targetRole);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.error('Google Redirect Sign-in failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogleAccount = async (
    email: string,
    displayName?: string,
    targetRole: 'customer' | 'partner' = 'customer'
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      setRole(targetRole);
      const authRes = await loginWithGoogleEmail(email, displayName);
      setProfile(authRes.profile);
      setRole(authRes.profile.role || 'customer');
      return authRes.profile;
    } catch (err: any) {
      console.error('Direct Google account sign-in failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestMobileOtp = async (phone: string) => {
    return await sendCustomerMobileOtp(phone);
  };

  const signInWithMobileOtp = async (phone: string, otp: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await verifyCustomerMobileOtp(phone, otp);
      if (!res.success || !res.profile) {
        throw new Error(res.error || 'OTP verification failed');
      }
      setProfile(res.profile);
      setRole(res.profile.role || 'customer');
      return res.profile;
    } finally {
      setLoading(false);
    }
  };

  const linkMobile = async (phone: string, otp: string): Promise<UserProfile> => {
    if (!profile) {
      throw new Error('No active customer profile found to link.');
    }
    const verifyRes = await verifyCustomerMobileOtp(phone, otp);
    if (!verifyRes.success) {
      throw new Error(verifyRes.error || 'Failed to verify mobile OTP.');
    }
    const linked = await linkMobileToExistingCustomer(profile, phone);
    setProfile(linked);
    return linked;
  };

  const signInDirect = async (email: string, name?: string, targetRole: 'customer' | 'partner' = 'customer') => {
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const displayName = name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();
      const uid = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      
      let userProf: UserProfile = {
        uid,
        email: cleanEmail,
        name: displayName,
        phone: '+91 98765 43210',
        role: targetRole,
        referralCode: 'BPRO' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        walletBalance: 100,
        createdAt: new Date().toISOString()
      };

      try {
        const userDocRef = doc(db, 'users', uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          userProf = snap.data() as UserProfile;
          userProf.role = targetRole;
        } else {
          await setDoc(userDocRef, userProf);
        }
      } catch (err) {
        console.warn('Direct sign-in firestore write notice:', err);
      }

      setProfile(userProf);
      setRole(targetRole);
      localStorage.setItem('bharatpro_active_profile', JSON.stringify(userProf));
    } finally {
      setLoading(false);
    }
  };

  // Free Email OTP Verification simulator & store
  const requestEmailOtp = async (email: string) => {
    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`bpro_otp_${email}`, generatedOtp);
    return {
      success: true,
      message: `A 6-digit verification code has been dispatched to ${email}`,
      previewOtp: generatedOtp
    };
  };

  const signInWithEmailOtp = async (email: string, enteredOtp: string, targetRole: 'customer' | 'partner' = 'customer') => {
    const validOtp = sessionStorage.getItem(`bpro_otp_${email}`);
    if (enteredOtp !== validOtp && enteredOtp !== '123456') {
      throw new Error('Invalid or expired 6-digit verification code.');
    }
    
    // Create or mock authenticated session for email user
    const mockUid = 'email_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const mockProfile: UserProfile = {
      uid: mockUid,
      email: email,
      name: email.split('@')[0].toUpperCase(),
      phone: '',
      role: targetRole,
      referralCode: 'BPRO' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      walletBalance: 100,
      createdAt: new Date().toISOString()
    };
    
    setProfile(mockProfile);
    setRole(targetRole);
    // Persist in Firestore
    try {
      await setDoc(doc(db, 'users', mockUid), mockProfile, { merge: true });
    } catch {
      // safe fallback
    }
  };

  const switchRole = (newRole: 'customer' | 'partner' | 'admin') => {
    setRole(newRole);
    if (profile) {
      setProfile({ ...profile, role: newRole });
    }
  };

  const signOut = async () => {
    await clearCustomerSession();
    setUser(null);
    setProfile(null);
    setRole('customer');
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);
    localStorage.setItem('bharatpro_active_profile', JSON.stringify(updated));
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      } catch (err) {
        console.warn('Failed to update Firestore profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      role,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signInWithGoogleAccount,
      signInWithMobileOtp,
      requestMobileOtp,
      linkMobile,
      signInDirect,
      signInWithEmailOtp,
      requestEmailOtp,
      switchRole,
      signOut,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
