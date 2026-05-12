import { 
  collection, 
  doc, 
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

// Product Services
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, 'products'));
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

export const updateStockLevel = async (locationId: string, productId: string, quantityChange: number) => {
  try {
    const invRef = doc(db, 'locations', locationId, 'inventory', productId);
    await updateDoc(invRef, {
      quantity: increment(quantityChange),
      lastRestockedAt: quantityChange > 0 ? serverTimestamp() : undefined
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `locations/${locationId}/inventory/${productId}`);
  }
};

// Sales Services
export const recordSale = async (sale: Omit<Sale, 'id' | 'timestamp'>) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Create sale record
    const saleRef = doc(collection(db, 'locations', sale.locationId, 'sales'));
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
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `locations/${sale.locationId}/sales`);
  }
};
