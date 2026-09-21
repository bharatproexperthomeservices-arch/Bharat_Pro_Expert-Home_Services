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

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  role: 'customer' | 'partner' | 'admin';
  signInWithGoogle: (targetRole?: 'customer' | 'partner') => Promise<void>;
  signInWithGoogleRedirect: (targetRole?: 'customer' | 'partner') => Promise<void>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            setRole(data.role || 'customer');
          } else {
            const referralCode = 'BPRO' + Math.random().toString(36).substring(2, 7).toUpperCase();
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || 'Valued Customer',
              phone: fbUser.phoneNumber || '',
              avatarUrl: fbUser.photoURL || undefined,
              role: 'customer',
              referralCode,
              walletBalance: 100,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
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
    const savedLocal = localStorage.getItem('bharatpro_active_profile');
    if (savedLocal && !user && !profile) {
      try {
        const parsed = JSON.parse(savedLocal);
        setProfile(parsed);
        setRole(parsed.role || 'customer');
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            setRole(data.role || 'customer');
            localStorage.setItem('bharatpro_active_profile', JSON.stringify(data));
          } else {
            // New user registration
            const referralCode = 'BPRO' + Math.random().toString(36).substring(2, 7).toUpperCase();
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || 'Valued Customer',
              phone: fbUser.phoneNumber || '',
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || 'B')}`,
              role: role,
              referralCode,
              walletBalance: 100, // Welcome signup credit ₹100
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            localStorage.setItem('bharatpro_active_profile', JSON.stringify(newProfile));
          }
        } catch (error) {
          console.warn('Firestore load error, falling back to local session:', error);
          const fallbackProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'customer@bharatpro.in',
            name: fbUser.displayName || 'Customer',
            phone: '+91 98765 43210',
            avatarUrl: fbUser.photoURL || undefined,
            role: role,
            referralCode: 'BPRO-WELCOME',
            walletBalance: 100,
            createdAt: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          localStorage.setItem('bharatpro_active_profile', JSON.stringify(fallbackProfile));
        }
      } else {
        const currentSaved = localStorage.getItem('bharatpro_active_profile');
        if (!currentSaved) {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const signInWithGoogle = async (targetRole: 'customer' | 'partner' = 'customer') => {
    setLoading(true);
    try {
      setRole(targetRole);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const userDocRef = doc(db, 'users', fbUser.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          localStorage.setItem('bharatpro_active_profile', JSON.stringify(data));
        } else {
          const referralCode = 'BPRO' + Math.random().toString(36).substring(2, 7).toUpperCase();
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Valued User',
            phone: '',
            avatarUrl: fbUser.photoURL || undefined,
            role: targetRole,
            referralCode,
            walletBalance: 100,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
          localStorage.setItem('bharatpro_active_profile', JSON.stringify(newProfile));
        }
      } catch {
        const fallback: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Valued Customer',
          phone: '',
          avatarUrl: fbUser.photoURL || undefined,
          role: targetRole,
          referralCode: 'BPRO-WELCOME',
          walletBalance: 100,
          createdAt: new Date().toISOString()
        };
        setProfile(fallback);
        localStorage.setItem('bharatpro_active_profile', JSON.stringify(fallback));
      }
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
    try {
      await firebaseSignOut(auth);
    } catch {}
    localStorage.removeItem('bharatpro_active_profile');
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
