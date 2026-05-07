import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Activity {
  id?: string;
  toolId: string;
  toolName: string;
  timestamp: any;
  userId: string;
}

export const logActivity = async (userId: string, toolId: string, toolName: string) => {
  const path = `users/${userId}/activities`;
  try {
    await addDoc(collection(db, path), {
      toolId,
      toolName,
      userId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToRecentActivities = (userId: string, callback: (activities: Activity[]) => void) => {
  const path = `users/${userId}/activities`;
  const q = query(
    collection(db, path),
    orderBy('timestamp', 'desc'),
    limit(5)
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Activity[];
    callback(activities);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
  });
};

export const subscribeToAllActivities = (callback: (activities: Activity[]) => void) => {
  const q = query(
    collectionGroup(db, 'activities'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Activity[];
    callback(activities);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'all-activities');
  });
};
