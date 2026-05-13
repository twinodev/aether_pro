import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  setPersistence, 
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../services/userService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isVip: boolean;
  isAdmin: boolean;
  trialAvailable: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getGlobalIdentity: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'tjuniemma@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trialAvailable, setTrialAvailable] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((err) => console.error('Persistence error:', err));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setIsAdmin(firebaseUser.email === ADMIN_EMAIL);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            const isAdminUser = firebaseUser.email === ADMIN_EMAIL || data.isAdmin;
            const now = new Date();
            const expiry = data.vipExpiry ? new Date(data.vipExpiry) : null;
            const hasActiveVip = data.isVip && (!expiry || now < expiry);
            
            setIsVip(isAdminUser || hasActiveVip);
            setIsAdmin(isAdminUser);
            setTrialAvailable(!data.trialActivatedAt);

            if (firebaseUser.email === ADMIN_EMAIL && !data.isAdmin) {
              setDoc(userRef, { isAdmin: true }, { merge: true }).catch(err => {
                console.warn('Silent failure updating admin state:', err);
              });
            }
          } else {
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              isVip: false,
              isAdmin: firebaseUser.email === ADMIN_EMAIL,
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newUser).catch(e => {
              // Only report if it's not a transient permission error during sign-in
              if (!e.message?.includes('permission')) {
                handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`);
              } else {
                console.warn('Transient permission error during user creation, retrying should happen on next snapshot or re-auth');
              }
            });
          }
        }, (err) => {
          // If we're authenticated but getting permission denied, it might be a token propagation delay
          if (err.message?.includes('permissions')) {
             console.warn('Firestore permissions delay detected for user:', firebaseUser.uid);
             // We don't throw here to avoid crashing the app, the listener will retry or be reset
          } else {
             handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          }
        });

        setLoading(false);
        return () => unsubDoc();
      } else {
        setProfile(null);
        setIsVip(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
       console.error('Email login failed:', error);
       throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      // setUser(cred.user) will be handled by onAuthStateChanged
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getGlobalIdentity = () => {
    if (!user) return 'ANONYMOUS';
    const role = isAdmin ? 'OVERSEER' : isVip ? 'ELITE' : 'OPERATIVE';
    const id = user.uid.slice(0, 4).toUpperCase();
    const bizName = profile?.business?.name ? ` @ ${profile.business.name.toUpperCase()}` : '';
    return `${user.displayName?.toUpperCase() || 'AGENT'}${bizName} [${role}-${id}]`;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      loading, 
      isVip, 
      isAdmin, 
      trialAvailable,
      login, 
      loginWithEmail,
      registerWithEmail,
      sendPasswordReset,
      logout,
      getGlobalIdentity
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
