import { collection, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface TicketDesign {
  color: string;
  font: string;
  layout: 'standard' | 'minimal' | 'modern' | 'vintage' | 'neon' | 'brutalist' | 'elegant' | 'slim' | 'overlay' | 'bento' | 'industrial';
  logoUrl?: string;
  featuredImageUrl?: string;
  orientation: 'horizontal' | 'vertical';
  codeType: 'qr' | 'barcode';
  fontSize?: number;
  fontFamily?: string;
  letterSpacing?: string;
  lineHeight?: number;
}

export interface TicketTier {
  id: string;
  name: string;
  price: string;
  capacity?: number;
}

export interface Ticket {
  id: string;
  eventId?: string;
  organizerId?: string;
  eventTitle: string;
  venue: string;
  date: string;
  time: string;
  ticketType: string;
  price: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  selectedTierId?: string;
  scanned: boolean;
  scannedAt?: any;
  design: TicketDesign;
  createdAt: any;
  organizerPhone?: string;
  organizerPhoneName?: string;
  paymentConfirmed?: boolean;
  paymentTxId?: string;
  paymentMethod?: 'momo' | 'airtel';
}

export interface Event {
  id: string;
  userId: string;
  eventTitle: string;
  venue: string;
  date: string;
  time: string;
  ticketType: string;
  price: string;
  tiers?: TicketTier[];
  description?: string;
  design: TicketDesign;
  createdAt: any;
  organizerPhone?: string;
  organizerPhoneName?: string;
}

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

// Local Storage Helper Utilities
export const getLocalList = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn(`Failed to read localStorage index for: ${key}`, err);
    return [];
  }
};

export const saveLocalList = <T>(key: string, list: T[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn(`Failed to write localStorage index for: ${key}`, err);
  }
};

// 1. Create Event with robust offline backup
export const createEvent = async (event: Event) => {
  const local = getLocalList<Event>('duka_offline_events');
  const filtered = local.filter(e => e.id !== event.id);
  const updatedEvent = { ...event, createdAt: event.createdAt || new Date().toISOString() };
  saveLocalList('duka_offline_events', [...filtered, updatedEvent]);

  const path = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), {
      ...updatedEvent,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Firestore direct write failed for event ${event.id}; localized offline persistence secured.`, error);
  }
};

// 2. Fetch Event with robust local fallback
export const getEvent = async (eventId: string): Promise<Event | null> => {
  const path = `events/${eventId}`;
  try {
    const docSnap = await getDoc(doc(db, 'events', eventId));
    if (docSnap.exists()) {
      return docSnap.data() as Event;
    }
  } catch (error) {
    console.warn(`Firestore download failed for event ${eventId}, utilizing localized cache.`, error);
  }

  const localEvents = getLocalList<Event>('duka_offline_events');
  return localEvents.find(e => e.id === eventId) || null;
};

// 3. Update Event with dual-write backup
export const updateEventDocs = async (eventId: string, eventData: Partial<Event>) => {
  const local = getLocalList<Event>('duka_offline_events');
  const updated = local.map(e => e.id === eventId ? { ...e, ...eventData } : e);
  saveLocalList('duka_offline_events', updated);

  try {
    await updateDoc(doc(db, 'events', eventId), eventData);
  } catch (error) {
    console.warn(`Firestore update bypassed for local event ${eventId}:`, error);
  }
};

// 4. Delete Event with local synchronization
export const deleteEventDoc = async (eventId: string) => {
  const local = getLocalList<Event>('duka_offline_events');
  const updated = local.filter(e => e.id !== eventId);
  saveLocalList('duka_offline_events', updated);

  const localTickets = getLocalList<Ticket>('duka_offline_tickets');
  const filteredTickets = localTickets.filter(t => t.eventId !== eventId);
  saveLocalList('duka_offline_tickets', filteredTickets);

  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.warn(`Firestore deletion bypassed for event ${eventId}:`, error);
  }
};

// 5. Fetch Ticket with offline fallbacks
export const getTicket = async (ticketId: string): Promise<Ticket | null> => {
  const path = `tickets/${ticketId}`;
  try {
    const docSnap = await getDoc(doc(db, 'tickets', ticketId));
    if (docSnap.exists()) {
      return docSnap.data() as Ticket;
    }
  } catch (error) {
    console.warn(`Firestore fetch failed for ticket ${ticketId}, searching offline indexes.`, error);
  }

  const localTickets = getLocalList<Ticket>('duka_offline_tickets');
  return localTickets.find(t => t.id === ticketId) || null;
};

// 6. Deploy Single Ticket
export const createTicket = async (ticket: Ticket) => {
  const local = getLocalList<Ticket>('duka_offline_tickets');
  const filtered = local.filter(t => t.id !== ticket.id);
  const updatedTicket = { ...ticket, createdAt: ticket.createdAt || new Date().toISOString() };
  saveLocalList('duka_offline_tickets', [...filtered, updatedTicket]);

  try {
    await setDoc(doc(db, 'tickets', ticket.id), {
      ...updatedTicket,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Firestore direct write failed for ticket ${ticket.id}; localized offline persistence secured.`, error);
  }
};

// 7. Update Ticket Scanned State
export const updateTicketDoc = async (ticketId: string, ticketData: Partial<Ticket>) => {
  const local = getLocalList<Ticket>('duka_offline_tickets');
  const updated = local.map(t => t.id === ticketId ? { ...t, ...ticketData } : t);
  saveLocalList('duka_offline_tickets', updated);

  try {
    await updateDoc(doc(db, 'tickets', ticketId), ticketData);
  } catch (error) {
    console.warn(`Firestore status update bypassed for ticket ${ticketId}:`, error);
  }
};

// 8. Bulk Generation with robust chunk limits and localStorage preservation
export const createTicketsBulk = async (tickets: Ticket[], onProgress?: (progress: number) => void) => {
  const local = getLocalList<Ticket>('duka_offline_tickets');
  const updatedTicketsMap = new Map(local.map(t => [t.id, t]));
  
  tickets.forEach(ticket => {
    updatedTicketsMap.set(ticket.id, {
      ...ticket,
      createdAt: ticket.createdAt || new Date().toISOString()
    });
  });
  
  saveLocalList('duka_offline_tickets', Array.from(updatedTicketsMap.values()));
  if (onProgress) onProgress(50);

  const CHUNK_SIZE = 400; 
  const chunks = [];
  
  for (let i = 0; i < tickets.length; i += CHUNK_SIZE) {
    chunks.push(tickets.slice(i, i + CHUNK_SIZE));
  }
  
  let processed = 0;
  try {
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(ticket => {
        const docRef = doc(db, 'tickets', ticket.id);
        batch.set(docRef, {
          ...ticket,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      processed += chunk.length;
      if (onProgress) {
        onProgress(Math.round((processed / tickets.length) * 100));
      }
    }
  } catch (error) {
    console.warn('Firestore bulk generation failed, continuing offline-only successfully.', error);
    if (onProgress) onProgress(100);
  }
};

// 9. Save Design Template
export const saveTicketTemplate = async (template: TicketTemplate) => {
  const local = getLocalList<TicketTemplate>('duka_offline_templates');
  const filtered = local.filter(t => t.id !== template.id);
  const updatedTemplate = { ...template, createdAt: template.createdAt || new Date().toISOString() };
  saveLocalList('duka_offline_templates', [...filtered, updatedTemplate]);

  try {
    await setDoc(doc(db, 'ticketTemplates', template.id), {
      ...updatedTemplate,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Firestore write bypass for template ${template.id}; localized caching secured.`, error);
  }
};

// 10. Admission Validation with dual sources
export const validateTicket = async (ticketId: string) => {
  const path = `tickets/${ticketId}`;
  try {
    const docRef = doc(db, 'tickets', ticketId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
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

      // Synchronize back to local
      const local = getLocalList<Ticket>('duka_offline_tickets');
      const updated = local.map(t => t.id === ticketId ? { ...t, scanned: true, scannedAt: new Date().toISOString() } : t);
      saveLocalList('duka_offline_tickets', updated);

      return { success: true, message: 'Ticket Validated Successfully!', ticket: data };
    }
  } catch (error) {
    console.warn(`Firestore validation bypassed, executing local lookup for ticket ${ticketId}`, error);
  }

  // Local storage validating algorithm
  const local = getLocalList<Ticket>('duka_offline_tickets');
  const ticketIndex = local.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) {
    return { success: false, message: 'Invalid Ticket: Not found in database.' };
  }

  const ticket = local[ticketIndex];
  if (ticket.scanned) {
    return { 
      success: false, 
      message: 'Duplicate Ticket: Already scanned.', 
      scannedAt: ticket.scannedAt 
    };
  }

  ticket.scanned = true;
  ticket.scannedAt = new Date().toISOString();
  local[ticketIndex] = ticket;
  saveLocalList('duka_offline_tickets', local);

  return { success: true, message: 'Ticket Validated Successfully!', ticket };
};
