import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  barcode?: string;
  price: number;
  cost: number;
  unit: string;
  imageUrl?: string;
  ownerId: string;
  createdAt: any;
}

export interface InventoryItem {
  productId: string;
  locationId: string;
  quantity: number;
  minStockLevel: number;
  lastRestockedAt: any;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerId: string;
}

export interface Sale {
  id: string;
  items: Array<{ productId: string, quantity: number, price: number }>;
  total: number;
  paymentMethod: 'mpesa' | 'cash' | 'credit';
  locationId: string;
  userId: string;
  timestamp: any;
}

export interface Membership {
  userId: string;
  email?: string;
  role: 'manager' | 'cashier';
  addedAt: any;
}

export interface ScanRecord {
  code: string;
  locationId: string;
  userId: string;
  scannedAt: any;
}

// Product Services
export const subscribeToProducts = (ownerId: string, callback: (products: Product[]) => void) => {
  const q = query(collection(db, 'products'), where('ownerId', '==', ownerId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
  try {
    return await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'products');
  }
};

export const updateProduct = async (productId: string, updates: Partial<Product>) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
  }
};

// Location Services
export const subscribeToLocations = (ownerId: string, callback: (locations: Location[]) => void) => {
  const q = query(collection(db, 'locations'), where('ownerId', '==', ownerId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Location[]);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'locations'));
};

export const createLocation = async (location: Omit<Location, 'id'>) => {
  try {
    return await addDoc(collection(db, 'locations'), location);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'locations');
  }
};

// Inventory Services
export const subscribeToInventory = (locationId: string, callback: (items: InventoryItem[]) => void) => {
  const q = collection(db, 'locations', locationId, 'inventory');
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data() })) as InventoryItem[]);
  }, (err) => handleFirestoreError(err, OperationType.LIST, `locations/${locationId}/inventory`));
};

export const updateStockLevel = async (locationId: string, productId: string, quantityChange: number, minStockLevel: number = 0) => {
  try {
    const invRef = doc(db, 'locations', locationId, 'inventory', productId);
    await setDoc(invRef, {
      productId,
      locationId,
      quantity: increment(quantityChange),
      minStockLevel: increment(0), // Ensure it stays same if exists, or initialize to 0
      lastRestockedAt: quantityChange > 0 ? serverTimestamp() : undefined
    }, { merge: true });

    // Ensure minStockLevel is set if it's a new entry and we provided a value
    if (minStockLevel > 0) {
      await updateDoc(invRef, { minStockLevel });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `locations/${locationId}/inventory/${productId}`);
  }
};

// Sales Services
export const subscribeToSales = (locationId: string, callback: (sales: Sale[]) => void) => {
  const q = collection(db, 'locations', locationId, 'sales');
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[]);
  }, (err) => handleFirestoreError(err, OperationType.LIST, `locations/${locationId}/sales`));
};

export const recordSale = async (sale: Omit<Sale, 'id' | 'timestamp'>) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Create sale record
    const saleRef = doc(collection(db, 'locations', sale.locationId, 'sales'));
    const saleId = saleRef.id;
    
    batch.set(saleRef, {
      ...sale,
      timestamp: serverTimestamp()
    });

    // 2. Update inventory for each item
    for (const item of sale.items) {
      const invRef = doc(db, 'locations', sale.locationId, 'inventory', item.productId);
      batch.update(invRef, {
        quantity: increment(-item.quantity)
      });
    }

    await batch.commit();
    return saleId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `locations/${sale.locationId}/sales`);
    throw err;
  }
};

// Membership Services
export const subscribeToMemberships = (locationId: string, callback: (memberships: Membership[]) => void) => {
  const q = collection(db, 'locations', locationId, 'memberships');
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data() })) as Membership[]);
  }, (err) => handleFirestoreError(err, OperationType.LIST, `locations/${locationId}/memberships`));
};

export const addMembership = async (locationId: string, userId: string, role: 'manager' | 'cashier', email?: string) => {
  try {
    const memRef = doc(db, 'locations', locationId, 'memberships', userId);
    await setDoc(memRef, {
      userId,
      role,
      email: email || '',
      addedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `locations/${locationId}/memberships/${userId}`);
  }
};

export const removeMembership = async (locationId: string, userId: string) => {
  try {
    const memRef = doc(db, 'locations', locationId, 'memberships', userId);
    await deleteDoc(memRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `locations/${locationId}/memberships/${userId}`);
  }
};

// Scan Services
export const validateScan = async (locationId: string, userId: string, code: string): Promise<{ success: boolean, alreadyScanned: boolean }> => {
  try {
    // We use the code as the document ID (safely handled by Firestore for standard barcodes)
    // If the barcode contains invalid characters, we might need to hash it, but for retail it's usually fine.
    const scanRef = doc(db, 'locations', locationId, 'scans', code);
    const scanSnap = await getDoc(scanRef);

    if (scanSnap.exists()) {
      return { success: false, alreadyScanned: true };
    }

    // Record the first scan
    await setDoc(scanRef, {
      code,
      locationId,
      userId,
      scannedAt: serverTimestamp()
    });

    return { success: true, alreadyScanned: false };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `locations/${locationId}/scans/${code}`);
    return { success: false, alreadyScanned: false };
  }
};
