import { collection, doc, getDoc, updateDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface TicketDesign {
  color: string;
  font: string;
  layout: 'standard' | 'minimal' | 'modern' | 'vintage' | 'neon' | 'brutalist' | 'elegant' | 'slim' | 'overlay';
  logoUrl?: string;
  featuredImageUrl?: string;
  orientation: 'horizontal' | 'vertical';
  codeType: 'qr' | 'barcode';
  fontSize?: number;
  fontFamily?: string;
  letterSpacing?: string;
  lineHeight?: number;
}

export interface Ticket {
  id: string;
  eventTitle: string;
  venue: string;
  date: string;
  time: string;
  ticketType: string;
  price: string;
  customerName: string;
  scanned: boolean;
  scannedAt?: any;
  design: TicketDesign;
  createdAt: any;
}

export const createTicket = async (ticket: Ticket) => {
  const path = `tickets/${ticket.id}`;
  try {
    await setDoc(doc(db, 'tickets', ticket.id), {
      ...ticket,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const createTicketsBulk = async (tickets: Ticket[]) => {
  const batch = writeBatch(db);
  tickets.forEach(ticket => {
    const docRef = doc(db, 'tickets', ticket.id);
    batch.set(docRef, {
      ...ticket,
      createdAt: serverTimestamp(),
    });
  });
  
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tickets/batch');
  }
};

export interface TicketTemplate {
  id: string;
  userId: string;
  name: string;
  eventTitle: string;
  venue: string;
  date: string;
  time: string;
  ticketType: string;
  price: string;
  design: TicketDesign;
  createdAt: any;
}

export const saveTicketTemplate = async (template: TicketTemplate) => {
  const path = `ticketTemplates/${template.id}`;
  try {
    await setDoc(doc(db, 'ticketTemplates', template.id), {
      ...template,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const validateTicket = async (ticketId: string) => {
  const path = `tickets/${ticketId}`;
  try {
    const docRef = doc(db, 'tickets', ticketId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, message: 'Invalid Ticket: Not found in database.' };
    }

    const data = docSnap.data() as Ticket;
    if (data.scanned) {
      return { 
        success: false, 
        message: 'Duplicate Ticket: Already scanned.', 
        scannedAt: data.scannedAt?.toDate?.() || data.scannedAt 
      };
    }

    await updateDoc(docRef, {
      scanned: true,
      scannedAt: serverTimestamp(),
    });

    return { success: true, message: 'Ticket Validated Successfully!', ticket: data };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { success: false, message: 'Reference verification failed.' };
  }
};
