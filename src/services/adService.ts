import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  placement: 'sidebar' | 'top' | 'bottom';
  active: boolean;
  createdAt: any;
}

export const subscribeToAds = (callback: (ads: Advertisement[]) => void) => {
  const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Advertisement[];
    callback(ads);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'ads');
  });
};

export const saveAd = async (ad: Partial<Advertisement>) => {
  const id = ad.id || doc(collection(db, 'ads')).id;
  try {
    await setDoc(doc(db, 'ads', id), {
      ...ad,
      id,
      createdAt: ad.createdAt || new Date().toISOString(),
      active: ad.active ?? true
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `ads/${id}`);
  }
};

export const deleteAd = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'ads', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `ads/${id}`);
  }
};

export const getActiveAds = async (): Promise<Advertisement[]> => {
  const q = query(collection(db, 'ads'));
  // Note: ideally we'd filter by 'active' == true in firestore but for now we'll handle it locally for simplicity if the collection is small
  return new Promise((resolve) => {
    const unsub = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as Advertisement[];
      unsub();
      resolve(ads.filter(a => a.active));
    }, (err) => {
      console.error('Ad fetch error:', err);
      resolve([]);
    });
  });
};
