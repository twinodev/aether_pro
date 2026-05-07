import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Broadcast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  createdAt: Timestamp;
  active: boolean;
}

export const subscribeToBroadcasts = (callback: (broadcasts: Broadcast[]) => void) => {
  const q = query(
    collection(db, 'broadcasts'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  return onSnapshot(q, (snapshot) => {
    const broadcasts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Broadcast[];
    callback(broadcasts.filter(b => b.active));
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'broadcasts');
  });
};

export const createBroadcast = async (message: string, type: Broadcast['type'] = 'info') => {
  try {
    await addDoc(collection(db, 'broadcasts'), {
      message,
      type,
      active: true,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'broadcasts');
  }
};

export const deleteBroadcast = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'broadcasts', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `broadcasts/${id}`);
  }
};
