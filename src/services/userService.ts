import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency: string;
  logoUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isVip: boolean;
  isAdmin: boolean;
  business?: BusinessInfo;
  trialActivatedAt?: string;
  vipExpiry?: string;
  billingCycle?: 'monthly' | 'annually' | 'lifetime' | 'none';
  createdAt: string;
}

export const updateBusinessProfile = async (uid: string, business: BusinessInfo) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, { business });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
};

export const subscribeToAllUsers = (callback: (users: UserProfile[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      ...doc.data()
    })) as UserProfile[];
    callback(users);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'users');
  });
};

export const activateTrial = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const now = new Date();
  const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  try {
    await updateDoc(userRef, {
      trialActivatedAt: now.toISOString(),
      vipExpiry: expiry.toISOString(),
      isVip: true,
      billingCycle: 'none'
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
};

export const grantVipAccess = async (uid: string, cycle: 'monthly' | 'annually' | 'lifetime') => {
  const userRef = doc(db, 'users', uid);
  const now = new Date();
  let expiry: Date | null = null;

  if (cycle === 'monthly') {
    expiry = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  } else if (cycle === 'annually') {
    expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  } else if (cycle === 'lifetime') {
    expiry = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
  }

  try {
    await updateDoc(userRef, {
      isVip: true,
      vipExpiry: expiry?.toISOString() || null,
      billingCycle: cycle
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
};

export const toggleUserVip = async (uid: string, currentStatus: boolean) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      isVip: !currentStatus,
      vipExpiry: null,
      billingCycle: 'none'
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
};
