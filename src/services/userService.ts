import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isVip: boolean;
  isAdmin: boolean;
  createdAt: string;
}

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

export const toggleUserVip = async (uid: string, currentStatus: boolean) => {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {
      isVip: !currentStatus
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
};
