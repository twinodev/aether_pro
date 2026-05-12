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
  title?: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  createdAt: Timestamp;
  expiresAt?: Timestamp | null;
  active: boolean;
  pinned?: boolean;
}

export const subscribeToBroadcasts = (callback: (broadcasts: Broadcast[]) => void, includeInactive: boolean = false) => {
  const q = query(
    collection(db, 'broadcasts'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const broadcasts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Broadcast[];
    
    // Sort pinned broadcasts first, then by date
    broadcasts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    });
    
    if (includeInactive) {
      callback(broadcasts);
    } else {
      const now = Timestamp.now();
      callback(broadcasts.filter(b => 
        b.active && (!b.expiresAt || b.expiresAt.toMillis() > now.toMillis())
      ));
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'broadcasts');
  });
};

export const createBroadcast = async (
  message: string, 
  title: string = '', 
  type: Broadcast['type'] = 'info',
  pinned: boolean = false,
  expiresInDays: number | null = null
) => {
  try {
    const expiresAt = expiresInDays 
      ? Timestamp.fromMillis(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await addDoc(collection(db, 'broadcasts'), {
      title,
      message,
      type,
      active: true,
      pinned,
      expiresAt,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'broadcasts');
  }
};

export const updateBroadcastStatus = async (id: string, active: boolean) => {
  try {
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'broadcasts', id), { active });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `broadcasts/${id}`);
  }
};

export const deleteBroadcast = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'broadcasts', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `broadcasts/${id}`);
  }
};
