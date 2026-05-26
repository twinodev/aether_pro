import React, { useState, useRef, ChangeEvent } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Barcode from "react-barcode";
import { toPng } from "html-to-image";
import { useReactToPrint } from "react-to-print";
import {
  Download,
  Share2,
  Copy,
  Check,
  Tickets,
  Type,
  Image as ImageIcon,
  X,
  Sparkles,
  Layout,
  Palette,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Save,
  Printer,
  Shield,
  FolderHeart,
  Plus,
  Trash2,
  ListChecks,
  Globe,
  Edit2,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Ticket,
  TicketDesign,
  createTicket,
  saveTicketTemplate,
  TicketTemplate,
  createTicketsBulk,
  Event,
  createEvent,
  TicketTier,
  updateEventDocs,
  deleteEventDoc,
  updateTicketDoc,
  getLocalList,
  saveLocalList,
} from "../../services/ticketService";
import { jsPDF } from "jspdf";
import { emailService } from "../../services/emailService";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface TicketPreset {
  id: string;
  name: string;
  layout: "standard" | "minimal" | "modern" | "vintage" | "neon" | "brutalist" | "elegant" | "slim" | "overlay" | "bento" | "industrial";
  color: string;
  font: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
}

const ticketPresets: TicketPreset[] = [
  {
    id: "neon-cyber",
    name: "Neon Cyber (Midnight & Cyan)",
    layout: "neon",
    color: "#00f3ff",
    font: "Space Grotesk",
    fontSize: 0.9,
    letterSpacing: 2,
    lineHeight: 1.1,
  },
  {
    id: "minimal-modern",
    name: "Minimal Modern (Slate & White)",
    layout: "minimal",
    color: "#1e293b",
    font: "Inter",
    fontSize: 1.0,
    letterSpacing: 0,
    lineHeight: 1.2,
  },
  {
    id: "vintage-press",
    name: "Vintage/Classic Press (Cream)",
    layout: "vintage",
    color: "#78350f",
    font: "Playfair Display",
    fontSize: 0.95,
    letterSpacing: 1,
    lineHeight: 1.3,
  },
  {
    id: "bento-tech",
    name: "Bento Tech (Emerald)",
    layout: "bento",
    color: "#10b981",
    font: "JetBrains Mono",
    fontSize: 0.85,
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
  {
    id: "high-society",
    name: "High Society (Wine & Gold)",
    layout: "elegant",
    color: "#881337",
    font: "Playfair Display",
    fontSize: 1.05,
    letterSpacing: 1.5,
    lineHeight: 1.25,
  }
];

export default function TicketingTool() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"edit" | "preview">(
    "edit",
  );
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "event",
  );

  const [eventTitle, setEventTitle] = useState("Kampala Music Festival 2026");
  const [venue, setVenue] = useState("Namboole Stadium");
  const [date, setDate] = useState("2026-12-25");
  const [time, setTime] = useState("06:00 PM");
  const [ticketType, setTicketType] = useState("General Admission");
  const [price, setPrice] = useState("50,000");
  const [customerName, setCustomerName] = useState("JOEL MUKASA");

  const [color, setColor] = useState("#6366f1");
  const [layout, setLayout] = useState<
    | "standard"
    | "minimal"
    | "modern"
    | "vintage"
    | "neon"
    | "brutalist"
    | "elegant"
    | "slim"
    | "overlay"
    | "bento"
    | "industrial"
  >("standard");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "vertical",
  );
  const [useBackgroundImage, setUseBackgroundImage] = useState(true);
  const [extractColor, setExtractColor] = useState(true);
  const [codePosition, setCodePosition] = useState<
    "bottom-right" | "bottom-left" | "top-right" | "top-left"
  >("bottom-right");
  const [codeType, setCodeType] = useState<"qr" | "barcode">("qr");
  const [logo, setLogo] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(1);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);

  // Bulk processing
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkNames, setBulkNames] = useState("");

  // Template Management
  const [templates, setTemplates] = useState<TicketTemplate[]>(() => getLocalList<TicketTemplate>('duka_offline_templates'));
  const [showTemplates, setShowTemplates] = useState(false);

  // Custom Events & Attendee Management State
  const [activeToolTab, setActiveToolTab] = useState<"designer" | "manager" | "explore">(
    "explore"
  );
  const [myEvents, setMyEvents] = useState<Event[]>(() => getLocalList<Event>('duka_offline_events'));
  const [allPublicEvents, setAllPublicEvents] = useState<Event[]>(() => getLocalList<Event>('duka_offline_events'));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEditEventId, setSelectedEditEventId] = useState<string | null>(null);
  const [eventDescription, setEventDescription] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("0772000000");
  const [isFree, setIsFree] = useState(false);
  const [eventTiers, setEventTiers] = useState<TicketTier[]>([
    { id: "1", name: "Ordinary", price: "20,000" },
    { id: "2", name: "VIP", price: "80,000" }
  ]);
  const [eventTickets, setEventTickets] = useState<Ticket[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  
  // Real-time notification states
  const [notifications, setNotifications] = useState<{
    id: string;
    type: "live" | "purchase";
    ticketId: string;
    eventTitle: string;
    customerName: string;
    ticketType: string;
    price: string;
    timestamp: string;
    read: boolean;
  }[]>([]);
  const [showNotificationsHub, setShowNotificationsHub] = useState(false);
  const [toastQueue, setToastQueue] = useState<{
    id: string;
    type: "live" | "purchase";
    ticketId: string;
    eventTitle: string;
    customerName: string;
    ticketType: string;
    price: string;
    timestamp: string;
    read: boolean;
  }[]>([]);

  // Publish validation & success modal states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [newlyPublishedEvent, setNewlyPublishedEvent] = useState<Event | null>(null);
  const [justUpdatedEvent, setJustUpdatedEvent] = useState<boolean>(false);
  const [copiedSuccessLink, setCopiedSuccessLink] = useState<boolean>(false);
  // Simplified designer step and advanced toggle states
  const [designerStep, setDesignerStep] = useState<number>(1);
  const [showAdvancedDesign, setShowAdvancedDesign] = useState<boolean>(false);
  // Guest registration flow states
  const [selectedExploreEvent, setSelectedExploreEvent] = useState<Event | null>(null);
  const [exploreRegisterModal, setExploreRegisterModal] = useState(false);
  const [exploreTierId, setExploreTierId] = useState("");
  const [exploreContactName, setExploreContactName] = useState("");
  const [exploreContactEmail, setExploreContactEmail] = useState("");
  const [exploreContactPhone, setExploreContactPhone] = useState("");
  const [exploreSearch, setExploreSearch] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [exploreRegisteredTicket, setExploreRegisteredTicket] = useState<Ticket | null>(null);

  const filteredExploreEvents = allPublicEvents.filter((evt) => {
    const q = exploreSearch.toLowerCase();
    return (
      (evt.eventTitle || "").toLowerCase().includes(q) ||
      (evt.venue || "").toLowerCase().includes(q) ||
      (evt.description || "").toLowerCase().includes(q)
    );
  });
  const [selectedEventQrOverlayId, setSelectedEventQrOverlayId] = useState<
    string | null
  >(
    null,
  );
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredImageRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const qAll = query(collection(db, "events"));
    const unsubscribeAll = onSnapshot(qAll, (snapshot) => {
      const docs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Event,
      );
      // Synchronize back to local
      const local = getLocalList<Event>('duka_offline_events');
      const mergedMap = new Map(local.map(e => [e.id, e]));
      docs.forEach(e => mergedMap.set(e.id, e));
      const merged = Array.from(mergedMap.values());
      saveLocalList('duka_offline_events', merged);
      setAllPublicEvents(merged);
    }, (error) => {
      console.warn("Firestore collection subscription offline, using locale data cache:", error);
      setAllPublicEvents(getLocalList<Event>('duka_offline_events'));
    });
    return () => unsubscribeAll();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "ticketTemplates"),
      where("userId", "==", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as TicketTemplate,
      );
      const local = getLocalList<TicketTemplate>('duka_offline_templates');
      const mergedMap = new Map(local.map(t => [t.id, t]));
      docs.forEach(t => mergedMap.set(t.id, t));
      const merged = Array.from(mergedMap.values());
      saveLocalList('duka_offline_templates', merged);
      setTemplates(merged);
    }, (error) => {
      console.warn("Templates subscription offline, querying local fallbacks:", error);
      setTemplates(getLocalList<TicketTemplate>('duka_offline_templates'));
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const qEvents = query(
      collection(db, "events"),
      where("userId", "==", user.uid),
    );
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const docs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Event,
      );
      const local = getLocalList<Event>('duka_offline_events');
      const mergedMap = new Map(local.map(e => [e.id, e]));
      docs.forEach(e => mergedMap.set(e.id, e));
      const merged = Array.from(mergedMap.values());
      saveLocalList('duka_offline_events', merged);
      setMyEvents(merged.filter(e => e.userId === user.uid));
    }, (error) => {
      console.warn("User events subscription offline, querying local fallbacks:", error);
      const local = getLocalList<Event>('duka_offline_events');
      setMyEvents(local.filter(e => e.userId === user.uid));
    });
    return () => unsubscribeEvents();
  }, [user]);

  // Live listener to watch for registration notifications on user's events
  React.useEffect(() => {
    if (!user) return;

    // Listen to ALL tickets where current owner is the organizer
    const qAllMyTickets = query(
      collection(db, "tickets"),
      where("organizerId", "==", user.uid)
    );

    let initialLoad = true;

    const unsubscribeAllMyTickets = onSnapshot(qAllMyTickets, (snapshot) => {
      const docs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Ticket
      );

      const newChanges = snapshot.docChanges().filter(change => change.type === "added");

      if (initialLoad) {
        initialLoad = false;
        // Parse current tickets as quiet historical notifications
        const initialNotifs = docs.map(data => ({
          id: `NOTIF-${data.id}-${Date.now()}`,
          type: "live" as const,
          ticketId: data.id,
          eventTitle: data.eventTitle,
          customerName: data.customerName,
          ticketType: data.ticketType,
          price: data.price,
          timestamp: data.createdAt || new Date().toISOString(),
          read: true
        })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(initialNotifs.slice(0, 30));
        return;
      }

      newChanges.forEach((change) => {
        const data = change.doc.data() as Ticket;
        const notificationId = `NOTIF-${data.id}-${Date.now()}`;

        const newNotif = {
          id: notificationId,
          type: "live" as const,
          ticketId: data.id,
          eventTitle: data.eventTitle,
          customerName: data.customerName,
          ticketType: data.ticketType,
          price: data.price,
          timestamp: data.createdAt || new Date().toISOString(),
          read: false
        };

        setNotifications((prev) => {
          if (prev.some(n => n.ticketId === data.id)) return prev;
          return [newNotif, ...prev];
        });

        // Add to toast queue to show floating transient banner
        setToastQueue((prev) => [...prev, newNotif]);
      });
    }, (error) => {
      console.warn("My tickets notification watcher offline:", error);
    });

    return () => unsubscribeAllMyTickets();
  }, [user]);

  React.useEffect(() => {
    if (!selectedEventId) {
      setEventTickets([]);
      return;
    }
    const qTickets = query(
      collection(db, "tickets"),
      where("eventId", "==", selectedEventId),
    );
    const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
      const docs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Ticket,
      );
      const local = getLocalList<Ticket>('duka_offline_tickets');
      const mergedMap = new Map(local.map(t => [t.id, t]));
      docs.forEach(t => mergedMap.set(t.id, t));
      const merged = Array.from(mergedMap.values());
      saveLocalList('duka_offline_tickets', merged);
      setEventTickets(merged.filter(t => t.eventId === selectedEventId));
    }, (error) => {
      console.warn("Tickets subscription offline, querying local fallback registry:", error);
      const local = getLocalList<Ticket>('duka_offline_tickets');
      setEventTickets(local.filter(t => t.eventId === selectedEventId));
    });
    return () => unsubscribeTickets();
  }, [selectedEventId]);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDominantColor = (imgUrl: string) => {
    if (!extractColor) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const hex =
        "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      setColor(hex);
    };
  };

  const handleFeaturedImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setFeaturedImage(url);
        getDominantColor(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTicketId = () => {
    return "TKT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleDeploy = async () => {
    setLoading(true);
    setLoadingProgress(0);

    // Tiny delay to allow React to paint the loading state
    await new Promise((resolve) => setTimeout(resolve, 50));

    const ticketId = generateTicketId();

    const design: TicketDesign = {
      color,
      font: fontFamily,
      layout,
      logoUrl: logo || undefined,
      featuredImageUrl: featuredImage || undefined,
      orientation,
      codeType,
      fontSize,
      fontFamily,
      letterSpacing: `${letterSpacing}px`,
      lineHeight,
    };

    const ticketData: Ticket = {
      id: ticketId,
      eventTitle,
      venue,
      date,
      time,
      ticketType,
      price,
      customerName,
      scanned: false,
      design,
      createdAt: null,
    };

    // Firebase sync in background
    try {
      setLoadingProgress(50);
      await createTicket(ticketData);
      setLoadingProgress(100);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Relational sync failed", err);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    setLoadingProgress(0);
    const ticketId = generateTicketId();

    try {
      setLoadingProgress(30);
      // Generate PDF
      const doc = new jsPDF({
        orientation: orientation === "horizontal" ? "l" : "p",
        unit: "mm",
        format: [139.7, 63.5], // 5.5" x 2.5"
      });

      // Handle Featured/Overlay Image for PDF
      if (featuredImage) {
        doc.addImage(
          featuredImage,
          "JPEG",
          0,
          0,
          139.7,
          63.5,
          undefined,
          "FAST",
        );
      }

      setLoadingProgress(60);
      const qrCanvas = ticketRef.current?.querySelector("canvas");
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL("image/png");

        if (layout === "overlay") {
          const x = codePosition.includes("right") ? 115 : 5;
          const y = codePosition.includes("bottom") ? 35 : 5;

          doc.setFillColor(255, 255, 255);
          doc.rect(x - 1, y - 1, 22, 22, "F");
          doc.addImage(qrDataUrl, "PNG", x, y, 20, 20, undefined, "FAST");

          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text(ticketId, x, y + 23);
        } else {
          // Standard layout PDF logic
          doc.setFillColor(color);
          if (orientation === "horizontal") {
            doc.rect(0, 0, 10, 63.5, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18 * fontSize);
            doc.setTextColor(40, 40, 40);
            doc.text(eventTitle.toUpperCase(), 15, 15);
            doc.setFontSize(12 * fontSize);
            doc.text(price === "0" || price === "Free" || !price ? "FREE" : `UGX ${price}`, 15, 55);
            doc.setFontSize(10 * fontSize);
            doc.text(customerName.toUpperCase(), 15, 30);

            doc.addImage(qrDataUrl, "PNG", 110, 10, 25, 25, undefined, "FAST");
            doc.setFontSize(6 * fontSize);
            doc.text(ticketId, 110, 38);
          } else {
            doc.rect(0, 0, 139.7, 10, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16 * fontSize);
            doc.setTextColor(40, 40, 40);
            doc.text(eventTitle.toUpperCase(), 5, 25);

            doc.addImage(qrDataUrl, "PNG", 15, 10, 20, 20, undefined, "FAST");
            doc.setFontSize(6 * fontSize);
            doc.text(ticketId, 15, 32);

            doc.setFontSize(10 * fontSize);
            doc.text(customerName.toUpperCase(), 5, 40);
            doc.setFontSize(12 * fontSize);
            doc.text(price === "0" || price === "Free" || !price ? "FREE" : `UGX ${price}`, 5, 55);
          }
        }
      }

      setLoadingProgress(100);
      doc.save(`ticket-${ticketId}.pdf`);
    } catch (err) {
      console.error("PDF generation failure", err);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleExportImage = () => {
    if (ticketRef.current === null) return;

    toPng(ticketRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `ticket-${eventTitle}-${customerName}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Could not export image", err);
      });
  };

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
  });

  const handleBulkGenerate = async () => {
    const names = bulkNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    setLoading(true);
    setLoadingProgress(0);

    // Chunk processing for responsive UI
    const ticketsToCreate: Ticket[] = [];

    for (const name of names) {
      const ticketId = generateTicketId();
      const design: TicketDesign = {
        color,
        font: fontFamily,
        layout,
        logoUrl: logo || undefined,
        featuredImageUrl: featuredImage || undefined,
        orientation,
        codeType,
        fontSize,
        fontFamily,
        letterSpacing: `${letterSpacing}px`,
        lineHeight,
      };
      const ticketData: Ticket = {
        id: ticketId,
        eventTitle,
        venue,
        date,
        time,
        ticketType,
        price,
        customerName: name,
        scanned: false,
        design,
        createdAt: null,
      };
      ticketsToCreate.push(ticketData);
    }

    try {
      await createTicketsBulk(ticketsToCreate, (progress) => {
        setLoadingProgress(progress);
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Bulk generation failed", err);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user) return;
    const templateId =
      "TMP-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    await saveTicketTemplate({
      id: templateId,
      userId: user.uid,
      name: eventTitle || "Unnamed Template",
      eventTitle,
      venue,
      date,
      time,
      ticketType,
      price,
      design: {
        color,
        font: fontFamily,
        layout,
        logoUrl: logo || undefined,
        featuredImageUrl: featuredImage || undefined,
        orientation,
        codeType,
        fontSize,
        fontFamily,
        letterSpacing: `${letterSpacing}px`,
        lineHeight,
      },
      createdAt: null,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const loadTemplate = (template: TicketTemplate) => {
    setEventTitle(template.eventTitle);
    setVenue(template.venue);
    setDate(template.date);
    setTime(template.time);
    setTicketType(template.ticketType);
    setPrice(template.price);
    setColor(template.design.color);
    setLayout(template.design.layout);
    setOrientation(template.design.orientation);
    setCodeType(template.design.codeType);
    if (template.design.fontSize) setFontSize(template.design.fontSize);
    if (template.design.fontFamily) setFontFamily(template.design.fontFamily);
    if (template.design.letterSpacing)
      setLetterSpacing(parseFloat(template.design.letterSpacing));
    if (template.design.lineHeight) setLineHeight(template.design.lineHeight);
    if (template.design.logoUrl) setLogo(template.design.logoUrl);
    if (template.design.featuredImageUrl)
      setFeaturedImage(template.design.featuredImageUrl);
    setShowTemplates(false);
  };

  const handleExploreRegister = async () => {
    if (!selectedExploreEvent) {
      alert("No event selected.");
      return;
    }

    if (!exploreContactName.trim()) {
      alert("Attendee full name is required.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(exploreContactEmail.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!exploreContactPhone.trim()) {
      alert("Please enter a valid phone number.");
      return;
    }

    // Find selected tier name & price
    const selectedTierObj = selectedExploreEvent.tiers?.find((t) => t.id === exploreTierId) || 
                            (selectedExploreEvent.tiers && selectedExploreEvent.tiers[0]) || { id: "1", name: selectedExploreEvent.ticketType || "General Admission", price: selectedExploreEvent.price || "50,000" };

    setIsRegistering(true);

    try {
      // Create modern formatted ticket
      const ticketId = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const newTicket: Ticket = {
        id: ticketId,
        eventId: selectedExploreEvent.id,
        organizerId: selectedExploreEvent.userId,
        eventTitle: selectedExploreEvent.eventTitle,
        venue: selectedExploreEvent.venue,
        date: selectedExploreEvent.date,
        time: selectedExploreEvent.time,
        ticketType: selectedTierObj.name,
        price: selectedTierObj.price,
        customerName: exploreContactName.trim(),
        customerEmail: exploreContactEmail.trim(),
        customerPhone: exploreContactPhone.trim(),
        selectedTierId: selectedTierObj.id,
        scanned: false,
        design: selectedExploreEvent.design || {
          color: "#4f46e5",
          font: "Inter",
          layout: "standard",
          orientation: "horizontal",
          codeType: "qr"
        },
        createdAt: new Date().toISOString()
      };

      await createTicket(newTicket);
      setExploreRegisteredTicket(newTicket);

      // Trigger user registration purchase notification
      const purchaseNotif = {
        id: `NOTIF-GUEST-${newTicket.id}-${Date.now()}`,
        type: "purchase" as const,
        ticketId: newTicket.id,
        eventTitle: newTicket.eventTitle,
        customerName: newTicket.customerName,
        ticketType: newTicket.ticketType,
        price: newTicket.price,
        timestamp: newTicket.createdAt,
        read: false
      };
      setNotifications((prev) => [purchaseNotif, ...prev]);
      setToastQueue((prev) => [...prev, purchaseNotif]);
    } catch (err) {
      console.error("Failed to purchase/register ticket:", err);
      alert("An error occurred during registration. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePrefillMagicData = () => {
    setEventTitle("Nile Eco-Tech Summit 2026");
    setVenue("Kampala Serena Conference Hall C");
    setDate("2026-10-18");
    setTime("09:00 AM");
    setEventDescription("The premier gathering of green innovators, software builders, and clean tech retailers across Uganda. This token secures full keynote entry, workshop access, espresso & networking service, and souvenir retail merchandise.");
    setEventTiers([
      { id: "1", name: "Standard Delegate Pass", price: "45,000" },
      { id: "2", name: "VIP Executive Lounge Access", price: "185,000" }
    ]);
    setIsFree(false);
    setValidationError(null);
  };

  const handlePublishEvent = async () => {
    if (!user) return;

    if (!eventTitle.trim()) {
      setValidationError("Event Title cannot be empty. Give your ticket archetype a clear name!");
      return;
    }
    if (!venue.trim()) {
      setValidationError("Venue or terminal location cannot be empty. Where is the gateway scan happening?");
      return;
    }
    if (!date) {
      setValidationError("Please select a calendar date first.");
      return;
    }

    setValidationError(null);
    setPublishing(true);

    const design: TicketDesign = {
      color,
      font: fontFamily,
      layout,
      logoUrl: logo || undefined,
      featuredImageUrl: featuredImage || undefined,
      orientation,
      codeType,
      fontSize,
      fontFamily,
      letterSpacing: `${letterSpacing}px`,
      lineHeight,
    };

    const finalTiers = isFree ? eventTiers.map(t => ({ ...t, price: "0" })) : eventTiers;
    const finalPrice = isFree ? "0" : (finalTiers[0]?.price || price);
    const finalTicketType = finalTiers[0]?.name || ticketType;

    if (selectedEditEventId) {
      // Update/editing mode
      const eventData: Partial<Event> = {
        eventTitle: eventTitle.trim(),
        venue: venue.trim(),
        date,
        time,
        ticketType: finalTicketType,
        price: finalPrice,
        tiers: finalTiers,
        description: eventDescription,
        design,
        organizerPhone: organizerPhone.trim()
      };

      try {
        await updateEventDocs(selectedEditEventId, eventData);
        setSelectedEventId(selectedEditEventId);
        
        const fullEvent: Event = {
          id: selectedEditEventId,
          userId: user.uid,
          eventTitle: eventTitle.trim(),
          venue: venue.trim(),
          date,
          time,
          ticketType: finalTicketType,
          price: finalPrice,
          tiers: finalTiers,
          description: eventDescription,
          design,
          createdAt: null,
          organizerPhone: organizerPhone.trim()
        };
        
        setNewlyPublishedEvent(fullEvent);
        setJustUpdatedEvent(true);
        setSelectedEditEventId(null);
      } catch (err) {
        console.error("Failed to update event document:", err);
        setValidationError("Could not upload updates to database. Check your network or permissions.");
      } finally {
        setPublishing(false);
      }
      return;
    }

    // Creating mode
    const eventId = "EVT-" + Math.random().toString(36).substr(2, 9).toUpperCase();

    const eventData: Event = {
      id: eventId,
      userId: user.uid,
      eventTitle: eventTitle.trim(),
      venue: venue.trim(),
      date,
      time,
      ticketType: finalTicketType,
      price: finalPrice,
      tiers: finalTiers,
      description: eventDescription,
      design,
      createdAt: null,
      organizerPhone: organizerPhone.trim()
    };

    try {
      await createEvent(eventData);
      setSelectedEventId(eventId);
      setNewlyPublishedEvent(eventData);
      setJustUpdatedEvent(false);
      // Glow and display copying feedback
      setCopiedEventId(eventId);
      setTimeout(() => setCopiedEventId(null), 3000);
    } catch (err) {
      console.error("Core event publish aborted:", err);
      setValidationError("Failed to publish to registry.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event and decommission all its linked passes?")) return;
    try {
      await deleteEventDoc(id);
      if (selectedEventId === id) setSelectedEventId(null);
    } catch (err) {
      console.error("Failed to delete event", err);
    }
  };

  const handleToggleAttendeeScanned = async (ticketId: string, currentStatus: boolean) => {
    try {
      await updateTicketDoc(ticketId, {
        scanned: !currentStatus,
        scannedAt: !currentStatus ? new Date().toISOString() : null,
      });
    } catch (err) {
      console.error("Failed to toggle admission scan status", err);
    }
  };

  const handleApprovePayment = async (ticket: Ticket) => {
    try {
      await updateTicketDoc(ticket.id, {
        paymentConfirmed: true
      });
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; padding: 10px 20px; background-color: ${ticket.design.color || '#6366f1'}; color: #ffffff; border-radius: 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em;">
              CONFIRMED PASS TO ${ticket.eventTitle.toUpperCase()}
            </div>
          </div>
          
          <p style="font-size: 15px; color: #333333; line-height: 1.6;">Hello <strong>${ticket.customerName}</strong>,</p>
          <p style="font-size: 14px; color: #666666; line-height: 1.6;">Your Mobile Money payment has been verified by the organizer! Your ticket is secured and ready for scanning at check-in.</p>
          
          <div style="margin: 25px 0; padding: 20px; background-color: #fcfcfc; border: 1px solid #ebebeb; border-radius: 12px;">
            <h2 style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #a3a3a3; margin-top: 0; margin-bottom: 12px;">Ticket Logistics</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #737373; width: 40%;">Ticket Reference ID</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #171717;">${ticket.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #737373;">Venue Location</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #171717;">${ticket.venue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #737373;">Operational Timing</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #171717;">${ticket.date} @ ${ticket.time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #737373;">Admission Tier</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #171717; text-transform: uppercase;">${ticket.ticketType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #737373;">Investment Claimed</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #171717;">UGX ${ticket.price}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #737373;">MoMo Trans. ID</td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: bold; color: #b45309; font-family: monospace;">${ticket.paymentTxId || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0; font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em;">
            Please display this email or your downloaded ticket at check-in for scanning.
          </div>
          
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 25px 0;" />
          <p style="font-size: 10px; color: #b5b5b5; text-align: center; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">Duka Sync Suite Mobile Money Protocol // 2026</p>
        </div>
      `;
      
      if (ticket.customerEmail) {
        try {
          await emailService.sendEmail({
            to: ticket.customerEmail,
            subject: `Payment Verified & Confirmed: ${ticket.eventTitle}`,
            html: emailHtml
          });
        } catch (mailErr) {
          console.error("Brevo dispatch failure, simulation taken over", mailErr);
        }
      }
      
      // Update local setEventTickets state so it reflects instantaneously without page refresh
      setEventTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, paymentConfirmed: true } : t));
    } catch (err) {
      console.error("Failed to approve payment", err);
    }
  };

  const layouts = [
    { id: "bento", label: "Bento Grid" },
    { id: "industrial", label: "Industrial" },
    { id: "modern", label: "Modern" },
    { id: "standard", label: "Standard" },
    { id: "minimal", label: "Minimalist" },
    { id: "vintage", label: "Vintage" },
    { id: "neon", label: "Neon" },
    { id: "brutalist", label: "Brutalist" },
    { id: "elegant", label: "Elegant" },
    { id: "slim", label: "Slim" },
    { id: "overlay", label: "Overlay" },
  ];

  // Auto-expire oldest notifications from the floating toast block
  React.useEffect(() => {
    if (toastQueue.length === 0) return;
    const timer = setTimeout(() => {
      setToastQueue((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastQueue]);

  return (
    <>
      {/* Dynamic Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {toastQueue.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 100 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto bg-neutral-950 text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 flex flex-col text-left gap-1 cursor-pointer hover:border-indigo-500 transition-colors"
              onClick={() => {
                // Remove this toast on click
                setToastQueue((prev) => prev.filter((t) => t.id !== toast.id));
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 text-[7px] font-black uppercase tracking-wider rounded-md bg-indigo-500 text-white">
                    {toast.type === "live" ? "Live Registration" : "My Order"}
                  </div>
                  <span className="text-[8px] font-mono text-neutral-400">
                    {toast.ticketId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToastQueue((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="mt-1">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  {toast.eventTitle}
                </p>
                <p className="text-xs font-black text-white mt-0.5">
                  {toast.customerName}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-neutral-300">
                  <span className="text-indigo-400 font-extrabold">{toast.ticketType}</span>
                  <span>•</span>
                  <span>{toast.price === "0" || toast.price === "Free" || !toast.price ? "FREE" : `UGX ${toast.price}`}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
      @media print {
        @page {
          size: 5.5in 2.5in;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        /* Ensure the ticket takes up the full print page */
        #ticket-render {
          width: 5.5in !important;
          height: 2.5in !important;
          max-width: none !important;
          transform: none !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      }
    `,
        }}
      />

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12">
        <header className="mb-8 md:mb-12 flex flex-col xl:flex-row xl:items-end justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
                <Tickets size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic">
                Ticket Engine
              </h1>
            </div>
            <p className="text-neutral-500 font-medium italic">
              Design, generate, and deploy mission-critical access tokens.
            </p>
            <div className="flex bg-neutral-100 p-1 rounded-2xl w-fit mt-4 flex-wrap gap-1">
              <button
                onClick={() => setActiveToolTab("explore")}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                   ${activeToolTab === "explore" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                <Globe size={12} /> Explore Events
              </button>
              <button
                onClick={() => setActiveToolTab("designer")}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                   ${activeToolTab === "designer" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                <Palette size={12} /> Design & Create
              </button>
              <button
                onClick={() => setActiveToolTab("manager")}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                   ${activeToolTab === "manager" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                <ListChecks size={12} /> My Roster
              </button>
            </div>
          </div>

          {/* Real-time Notification Hub Trigger & Flydown Panel */}
          <div className="relative self-stretch xl:self-auto">
            <button
              onClick={() => {
                setShowNotificationsHub(!showNotificationsHub);
                // Mark all current notifications as read when opening hub
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              className={`w-full xl:w-auto p-3.5 border rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative shadow-sm
                ${showNotificationsHub ? "bg-neutral-900 border-neutral-900 text-white" : "bg-white border-neutral-200 text-neutral-600 hover:border-indigo-500 hover:text-indigo-600"}`}
            >
              <div className="relative">
                <Bell size={16} className={notifications.filter((n) => !n.read).length > 0 ? "animate-bounce text-indigo-500" : ""} />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </div>
              <span>Roster Feed ({notifications.length})</span>
            </button>

            <AnimatePresence>
              {showNotificationsHub && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-neutral-100 rounded-3xl p-5 shadow-2xl z-50 text-left font-sans flex flex-col max-h-[450px]"
                >
                  <div className="flex items-center justify-between border-b border-neutral-150 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Bell size={14} />
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-800">
                        Live Registration Wire
                      </span>
                    </div>
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[8px] font-black tracking-wider uppercase text-neutral-400 hover:text-rose-600 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-2 flex-1 pr-1 scrollbar-thin max-h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-neutral-400 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2">
                        <Bell size={24} className="opacity-30 mb-1" />
                        No admissions registered
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 bg-neutral-50 border border-neutral-100/50 hover:border-indigo-100 rounded-2xl transition-all flex flex-col text-left relative group overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono text-neutral-400">
                              {notif.ticketId}
                            </span>
                            <span className="text-[7px] font-black tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                              {notif.ticketType}
                            </span>
                          </div>
                          <span className="text-xs font-black text-neutral-800 mt-1">
                            {notif.customerName}
                          </span>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 tracking-tight truncate">
                            {notif.eventTitle}
                          </span>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100/30 text-[8px] font-black text-neutral-400 uppercase tracking-wider">
                            <span>
                              {notif.price === "0" || notif.price === "Free" || !notif.price ? "FREE" : `UGX ${notif.price}`}
                            </span>
                            <span>
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>



        {activeToolTab === "explore" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* SEO Banner / Hero */}
            <div className="bg-neutral-900 text-white rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-r from-indigo-900/50 to-transparent pointer-events-none" />
              <div className="space-y-4 relative z-10 max-w-xl text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                  Public Portal
                </span>
                <h2 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight leading-none text-white text-left">
                  Discover Live Events & <br />Secure Official Passes
                </h2>
                <p className="text-xs text-neutral-400 font-medium max-w-md">
                  Browse public ticketing registries, review premium design formats, select your seating tier, and register for digital passes instantly. Only valid retail tickets verified here will grant access.
                </p>
              </div>
              <div className="w-full md:w-80 relative z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl flex items-center shadow-lg">
                  <span className="pl-3.5 text-neutral-400"><Globe size={14} /></span>
                  <input
                    type="text"
                    placeholder="Search by name, site, or tag..."
                    value={exploreSearch}
                    onChange={(e) => setExploreSearch(e.target.value)}
                    className="w-full h-11 bg-transparent text-white border-0 focus:ring-0 text-xs font-semibold placeholder-neutral-400 pl-2 focus:outline-none"
                  />
                  {exploreSearch && (
                    <button onClick={() => setExploreSearch("")} className="p-2 text-neutral-400 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Event Cards Grid */}
            {filteredExploreEvents.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-12 text-center max-w-md mx-auto my-12 shadow-sm space-y-4">
                <div className="w-16 h-16 bg-neutral-50 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                  <Globe size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-neutral-800 tracking-wider">No Events Listed</h3>
                  <p className="text-[11px] text-neutral-400 font-medium leading-relaxed uppercase mt-1">
                    Check back soon or publish an event from the design studio to see it appear in this catalog.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExploreEvents.map((evt) => {
                  const hasTiers = evt.tiers && evt.tiers.length > 0;
                  const startingPrice = hasTiers
                    ? Math.min(...evt.tiers!.map((t) => parseFloat(String(t.price).replace(/,/g, "")) || 0))
                    : parseFloat(String(evt.price).replace(/,/g, "")) || 0;
                  const startingPriceLabel = startingPrice === 0 ? "FREE" : `UGX ${startingPrice.toLocaleString()}`;

                  return (
                    <div
                      key={evt.id}
                      className="bg-white border border-neutral-100 hover:border-indigo-400 hover:shadow-xl rounded-[2.2rem] p-6 lg:p-8 flex flex-col justify-between transition-all group duration-300"
                    >
                      <div className="space-y-4 text-left">
                        {/* Status + Price Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[8px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            ID: {evt.id}
                          </span>
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            {startingPrice === 0 ? "FREE" : `Starts at ${startingPriceLabel}`}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black uppercase italic tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {evt.eventTitle}
                        </h3>

                        {/* Date & Location */}
                        <div className="space-y-2 text-[10px] text-neutral-500 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-neutral-400 shrink-0" />
                            <span>{evt.date} @ {evt.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={13} className="text-neutral-400 shrink-0" />
                            <span>{evt.venue}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {evt.description ? (
                          <p className="text-[11px] text-neutral-400 font-medium leading-relaxed line-clamp-3 border-t border-neutral-50 pt-3">
                            {evt.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-neutral-300 italic font-medium leading-relaxed border-t border-neutral-50 pt-3">
                            No special instructions compiled for this event.
                          </p>
                        )}
                      </div>

                      {/* Buy Ticket Button */}
                      <button
                        onClick={() => {
                          setSelectedExploreEvent(evt);
                          setExploreTierId(evt.tiers?.[0]?.id || "1");
                          setExploreContactName("");
                          setExploreContactEmail("");
                          setExploreContactPhone("");
                          setExploreRegisteredTicket(null);
                          setExploreRegisterModal(true);
                        }}
                        className="w-full h-12 bg-neutral-900 hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md mt-6 flex items-center justify-center gap-2"
                      >
                        <Tickets size={14} />
                        Get Tickets
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Booking / Checkout Modal overlay */}
            {exploreRegisterModal && selectedExploreEvent && (
              <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white border border-neutral-100 rounded-[2.5rem] w-full max-w-lg p-6 lg:p-8 shadow-2xl relative animate-fade-in my-8 text-left max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setExploreRegisterModal(false);
                      setSelectedExploreEvent(null);
                      setExploreRegisteredTicket(null);
                    }}
                    className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-all z-10"
                  >
                    <X size={16} />
                  </button>

                  {!exploreRegisteredTicket ? (
                    <div className="space-y-6">
                      <div className="space-y-2 border-b border-neutral-50 pb-4">
                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Order Ticket
                        </span>
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-neutral-900 mt-2 line-clamp-2">
                          {selectedExploreEvent.eventTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                          <span>{selectedExploreEvent.date}</span>
                          <span>•</span>
                          <span>{selectedExploreEvent.venue}</span>
                        </div>
                      </div>

                      {/* Ticket Tiers selection */}
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
                          Select Ticket Tier
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedExploreEvent.tiers && selectedExploreEvent.tiers.length > 0 ? (
                            selectedExploreEvent.tiers.map((tier) => {
                              const isSelected = exploreTierId === tier.id;
                              return (
                                <button
                                  key={tier.id}
                                  type="button"
                                  onClick={() => setExploreTierId(tier.id)}
                                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between
                                    ${isSelected ? "border-indigo-600 bg-indigo-50/10 shadow-sm" : "border-neutral-100 hover:border-indigo-300"}`}
                                >
                                  <div>
                                    <span className={`text-[11px] font-black uppercase tracking-wide ${isSelected ? "text-indigo-600" : "text-neutral-800"}`}>
                                      {tier.name}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-black text-emerald-600">
                                    {tier.price === "0" || !tier.price ? "FREE" : `UGX ${tier.price}`}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <button
                              type="button"
                              className="p-4 rounded-2xl border border-indigo-600 bg-indigo-50/10 text-left flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wide">
                                  {selectedExploreEvent.ticketType || "General Admission"}
                                </span>
                              </div>
                              <span className="text-[11px] font-black text-emerald-600">
                                {selectedExploreEvent.price === "0" || !selectedExploreEvent.price ? "FREE" : `UGX ${selectedExploreEvent.price}`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attendee details with phone verification */}
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
                          Attendee Information
                        </label>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold uppercase text-neutral-400">Full Name</span>
                            <input
                              type="text"
                              value={exploreContactName}
                              onChange={(e) => setExploreContactName(e.target.value)}
                              placeholder="e.g. Mukasa Arthur"
                              className="w-full h-11 px-4 border border-neutral-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold uppercase text-neutral-400">Valid Email Address</span>
                              <input
                                type="email"
                                value={exploreContactEmail}
                                onChange={(e) => setExploreContactEmail(e.target.value)}
                                placeholder="e.g. arthur@gmail.com"
                                className="w-full h-11 px-4 border border-neutral-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold uppercase text-neutral-400">Phone Number (MTN / Airtel)</span>
                              <input
                                type="tel"
                                value={exploreContactPhone}
                                onChange={(e) => setExploreContactPhone(e.target.value)}
                                placeholder="e.g. 0772123456"
                                className="w-full h-11 px-4 border border-neutral-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] text-neutral-400 font-semibold bg-neutral-50 p-3 rounded-xl border border-neutral-100 uppercase leading-relaxed text-center">
                        ⚠️ **Compliance Warning:** Your ticket is non-transferable and must exactly match a government photo ID at the event gateway.
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleExploreRegister}
                          type="button"
                          disabled={isRegistering}
                          className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          {isRegistering ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Securing Pass...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>Confirm & Order Ticket</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExploreRegisterModal(false);
                            setSelectedExploreEvent(null);
                          }}
                          className="px-5 h-14 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Ticket presentation screen upon successful booking */
                    <div className="space-y-6 text-center py-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Check size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase text-neutral-800 tracking-wider">Pass Secured Successfully</h4>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase max-w-sm mx-auto leading-relaxed">
                          Registration completed! Your unique token pass has been signed. Download or present the digital code card below for direct gate entry.
                        </p>
                      </div>

                      {/* Live Generated visual ticket presentation */}
                      <div className="border border-neutral-100 bg-neutral-50 p-4 rounded-2xl flex flex-col items-center">
                        <div
                          ref={ticketRef}
                          className={`w-full max-w-sm p-5 bg-white border border-neutral-100 rounded-2xl relative shadow-md text-left
                            ${exploreRegisteredTicket.design?.layout === "neon" ? "bg-black text-white border-[#00f3ff]/40 shadow-[0_0_20px_rgba(0,243,255,0.15)]" : ""}`}
                        >
                          <div className="flex justify-between items-start border-b border-dashed border-neutral-200 pb-3 mb-3 gap-2">
                            <div className="space-y-1 overflow-hidden">
                              <span className="text-[7px] font-black tracking-widest uppercase text-indigo-600">Off-Grid Live Ticket</span>
                              <h5 className="text-xs font-black uppercase text-neutral-900 tracking-tight line-clamp-1">
                                {exploreRegisteredTicket.eventTitle}
                              </h5>
                              <p className="text-[8px] text-neutral-400 font-bold uppercase truncate">{exploreRegisteredTicket.venue}</p>
                            </div>
                            <span className="text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded shrink-0">
                              {exploreRegisteredTicket.price === "0" || !exploreRegisteredTicket.price ? "FREE" : `UGX ${exploreRegisteredTicket.price}`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[9px] mb-3 font-semibold uppercase text-neutral-500">
                            <div>
                              <span className="text-[7px] font-bold text-neutral-400 block mb-0.5">Attendee</span>
                              <span className="text-neutral-800 font-black truncate block">{exploreRegisteredTicket.customerName}</span>
                            </div>
                            <div>
                              <span className="text-[7px] font-bold text-neutral-400 block mb-0.5">Contact</span>
                              <span className="text-neutral-800 font-black truncate block">{exploreRegisteredTicket.customerPhone || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[7px] font-bold text-neutral-400 block mb-0.5">Date & Time</span>
                              <span>{exploreRegisteredTicket.date} @ {exploreRegisteredTicket.time}</span>
                            </div>
                            <div>
                              <span className="text-[7px] font-bold text-neutral-400 block mb-0.5">TICKET TIER</span>
                              <span className="text-indigo-600 font-black truncate block">{exploreRegisteredTicket.ticketType}</span>
                            </div>
                          </div>

                          {/* Render visual QR Code code */}
                          <div className="flex flex-col items-center border-t border-dashed border-neutral-200 pt-3 text-center">
                            <QRCodeCanvas
                              value={exploreRegisteredTicket.id}
                              size={100}
                              level="H"
                              fgColor={exploreRegisteredTicket.design?.layout === "neon" ? "#00f3ff" : "#000000"}
                              bgColor={exploreRegisteredTicket.design?.layout === "neon" ? "#000000" : "#ffffff"}
                              className="w-24 h-24 border border-neutral-50 p-1.5 bg-white rounded-lg shadow-sm"
                            />
                            <span className="text-[7px] font-mono mt-2 tracking-widest text-neutral-400">{exploreRegisteredTicket.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Download/Print Action elements */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="flex-1 h-12 bg-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border"
                        >
                          <Printer size={13} />
                          Print Ticket
                        </button>
                        <button
                          onClick={() => {
                            setExploreRegisterModal(false);
                            setSelectedExploreEvent(null);
                            setExploreRegisteredTicket(null);
                          }}
                          className="px-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                        >
                          Finish Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeToolTab === "designer" && (
          !user ? (
            <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-12 text-center max-w-md mx-auto my-12 shadow-sm space-y-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-neutral-800 tracking-wider">Authentication Required</h3>
                <p className="text-[11px] text-neutral-400 font-medium leading-relaxed mt-2 uppercase">
                  Please connect an active retail/organizer profile on the home dashboard to design custom ticket archetypes and issue tokens.
                </p>
              </div>
              <button 
                onClick={() => {
                  window.location.hash = "";
                }}
                className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
              >
                Go back to login desk
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Full Width Step Guided Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/40 rounded-3xl p-5 flex gap-4 items-start shadow-sm">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-md">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    How to Launch Your Event Booking Page:
                  </h3>
                  <p className="text-[11px] text-indigo-800 font-semibold mt-1 leading-normal">
                    This designer operates in <strong>3 simple steps</strong>: 
                    1️⃣ Enter your event's info below, 
                    2️⃣ Choose ticket pricing tiers, and 
                    3️⃣ Select a polished design template. 
                    Once configured, click <strong>"Publish Booking Page"</strong> at the bottom to launch a live page where your customers can buy and secure official event passes!
                  </p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto w-full space-y-6">
            <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 lg:p-8 space-y-6 lg:space-y-8 shadow-sm">
              {/* Collapsible Sections for Mobile */}
              <div className="space-y-4">
                {/* Event Section */}
                <div className="border-b border-neutral-50 pb-4">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "event" ? null : "event",
                      )
                    }
                    className="w-full flex items-center justify-between group"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">
                      Event Details
                    </label>
                    <div
                      className={`transition-transform md:hidden ${expandedSection === "event" ? "rotate-180" : ""}`}
                    >
                      <Plus size={14} className="text-neutral-300" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {(expandedSection === "event" ||
                      window.innerWidth >= 768) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-3 pt-4 overflow-hidden"
                      >
                        <div className="relative">
                          <Type
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Event Title"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                          />
                        </div>
                        <div className="relative">
                          <MapPin
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Venue"
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <Calendar
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
                              size={16}
                            />
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                          </div>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full bg-neutral-50 border-none rounded-xl h-12 px-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-neutral-400 uppercase">Event Description</label>
                          <textarea
                            placeholder="Ex: Main conference networking session and POS intelligence seminar."
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            className="w-full bg-neutral-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all h-20"
                          />
                        </div>
                        {!isFree && (
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase">Mobile Money Recipient Number (For Ticket Collection)</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: +256 772 123 456"
                              value={organizerPhone}
                              onChange={(e) => setOrganizerPhone(e.target.value)}
                              className="w-full bg-neutral-50 border-none rounded-xl h-12 px-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                            <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-tight leading-relaxed">
                              Attendees will transfer the entrance fee directly to this MoMo number and submit their checkout with their Transaction ID.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Identity Section */}
                <div className="border-b border-neutral-50 pb-4">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "identity" ? null : "identity",
                      )
                    }
                    className="w-full flex items-center justify-between group"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">
                      Security & Identity
                    </label>
                    <div
                      className={`transition-transform md:hidden ${expandedSection === "identity" ? "rotate-180" : ""}`}
                    >
                      <Plus size={14} className="text-neutral-300" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {(expandedSection === "identity" ||
                      window.innerWidth >= 768) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 pt-4 overflow-hidden"
                      >
                        {/* Free Event Toggle Option */}
                        <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-800">
                              Free Event Access
                            </span>
                            <span className="text-[8px] text-neutral-400 font-bold uppercase mt-0.5">
                              Check this to issue passes at zero cost
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextFree = !isFree;
                              setIsFree(nextFree);
                              if (nextFree) {
                                setPrice("0");
                                setEventTiers(eventTiers.map(t => ({ ...t, price: "0" })));
                              } else {
                                setPrice("20,000");
                                setEventTiers(eventTiers.map((t, idx) => ({ ...t, price: idx === 1 ? "80,000" : "20,000" })));
                              }
                            }}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isFree ? "bg-indigo-600" : "bg-neutral-200"}`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isFree ? "left-5" : "left-0.5"}`}
                            />
                          </button>
                        </div>

                        {/* Event Ticket Tiers */}
                        <div className="space-y-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                              Ticket Tiers
                            </span>
                            <button
                              type="button"
                              disabled={isFree}
                              onClick={() => {
                                const nextId = (eventTiers.length + 1).toString();
                                setEventTiers([
                                  ...eventTiers,
                                  { id: nextId, name: `Tier ${nextId}`, price: isFree ? "0" : "50,000" }
                                ]);
                              }}
                              className="px-2 py-1 bg-white hover:bg-neutral-100 text-indigo-600 border border-neutral-200 rounded-md text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 leading-none h-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={10} /> Add Tier
                            </button>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {eventTiers.map((tier, idx) => (
                              <div key={tier.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-neutral-100">
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    placeholder="Tier Name (e.g. VIP)"
                                    value={tier.name}
                                    onChange={(e) => {
                                      const updated = [...eventTiers];
                                      updated[idx].name = e.target.value;
                                      setEventTiers(updated);
                                    }}
                                    className="w-full bg-neutral-50 border-none rounded-lg h-8 px-2 text-[10px] font-bold focus:ring-1 ring-indigo-500/20"
                                  />
                                </div>
                                <div className="w-20">
                                  <input
                                    type="text"
                                    placeholder="Price"
                                    disabled={isFree}
                                    value={isFree ? "0" : tier.price}
                                    onChange={(e) => {
                                      const updated = [...eventTiers];
                                      updated[idx].price = e.target.value;
                                      setEventTiers(updated);
                                    }}
                                    className="w-full bg-neutral-50 border-none rounded-lg h-8 px-2 text-[10px] font-bold text-right"
                                  />
                                </div>
                                {eventTiers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEventTiers(eventTiers.filter((t) => t.id !== tier.id));
                                    }}
                                    className="p-1 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Default Tier"
                            value={ticketType}
                            onChange={(e) => setTicketType(e.target.value)}
                            className="w-full bg-neutral-50 border-none rounded-xl h-12 px-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                          />
                          <div className="relative">
                            <DollarSign
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
                              size={16}
                            />
                            <input
                              type="text"
                              placeholder="Default Price"
                              disabled={isFree}
                              value={isFree ? "0" : price}
                              onChange={(e) => setPrice(e.target.value)}
                              className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setBulkMode(!bulkMode)}
                          className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${bulkMode ? "bg-indigo-600 text-white shadow-md" : "bg-neutral-100 text-neutral-400"}`}
                        >
                          <ListChecks size={14} />
                          {bulkMode ? "Direct Input" : "Enable Bulk Mode"}
                        </button>

                        {bulkMode ? (
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase text-neutral-400">
                              Customer Names
                            </label>
                            <textarea
                              value={bulkNames}
                              onChange={(e) => setBulkNames(e.target.value)}
                              placeholder="John Doe&#10;Jane Smith"
                              className="w-full bg-neutral-50 border-none rounded-xl p-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all h-32"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <User
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
                              size={16}
                            />
                            <input
                              type="text"
                              placeholder="Attendant Name"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={bulkMode ? handleBulkGenerate : handleDeploy}
                disabled={loading}
                className={`w-full h-20 rounded-2xl flex flex-col items-center justify-center gap-1 text-[12px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group
                  ${success ? "bg-emerald-500 text-white shadow-emerald-200 shadow-xl" : "bg-neutral-900 text-white hover:bg-black shadow-xl"}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="flex items-center gap-3 relative z-10">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : success ? (
                    <Check size={20} />
                  ) : bulkMode ? (
                    <ListChecks size={20} />
                  ) : (
                    <Sparkles size={20} className="text-indigo-400" />
                  )}
                  <span>
                    {loading
                      ? bulkMode
                        ? `Generating...`
                        : "Rendering..."
                      : success
                        ? "Asset Deployed"
                        : bulkMode
                          ? "Run Bulk Protocol"
                          : "Deploy Digital Token"}
                  </span>
                </div>
                {!loading && !success && (
                  <span className="text-[8px] opacity-40 font-bold tracking-widest relative z-10">
                    Sign & Verify Asset
                  </span>
                )}
                {loading && bulkMode && (
                  <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-1 relative z-10">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                )}
              </button>

              {/* Validation Feedback & Magic Pre-filler */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2 mt-4 text-left">
                  <div className="flex items-start gap-2.5">
                    <Shield size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                        Input Required
                      </p>
                      <p className="text-[10px] text-rose-600 font-semibold mt-0.5 leading-normal">
                        {validationError}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrefillMagicData}
                    className="w-full py-1.5 bg-rose-150 hover:bg-rose-200 text-rose-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    ⚡ Auto-Fill Demo Summit Data
                  </button>
                </div>
              )}

              {/* If empty but no validation error shown yet, show a clean helper option to auto-fill */}
              {!validationError && (!eventTitle.trim() || !venue.trim()) && (
                <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3 mt-4 text-left flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500 shrink-0 animate-pulse" />
                    <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                      Quick start with demo details:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrefillMagicData}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                  >
                    Load Demo
                  </button>
                </div>
              )}

              {selectedEditEventId ? (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handlePublishEvent}
                    disabled={publishing}
                    className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 group"
                  >
                    {publishing ? (
                      <div className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Share2
                        size={16}
                        className="text-white group-hover:scale-110 transition-transform"
                      />
                    )}
                    <span>{publishing ? "Saving..." : "Save Changes"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEditEventId(null);
                      setActiveToolTab("manager");
                    }}
                    className="px-5 h-14 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePublishEvent}
                  disabled={publishing}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 group mt-4"
                >
                  {publishing ? (
                    <div className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Share2
                      size={16}
                      className="text-white group-hover:scale-110 transition-transform"
                    />
                  )}
                  <span>
                    {publishing ? "Publishing Link..." : "Publish Booking Page"}
                  </span>
                </button>
              )}
            </div>

          {/* Live Preview Block */}
          <div
            className="hidden"
          >
            <div className="w-full flex items-center justify-between mb-6 bg-neutral-900 p-4 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full shrink-0">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    Live Monitor
                  </span>
                </div>
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">
                  Canvas: {orientation.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportImage}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 group"
                  title="Download as PNG"
                >
                  <ImageIcon
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest font-mono">
                    PNG
                  </span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 group"
                  title="Download as PDF"
                >
                  <Download
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest font-mono">
                    PDF
                  </span>
                </button>
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 group"
                >
                  <Printer
                    size={14}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                    Print
                  </span>
                </button>
              </div>
            </div>

            <div
              className={`w-full min-h-[450px] md:min-h-[600px] bg-neutral-50 rounded-[3rem] border border-neutral-100 shadow-inner flex items-center justify-center p-4 md:p-12 relative overflow-hidden group/workspace transition-all
             ${orientation === "vertical" ? "h-[800px] md:h-[900px]" : ""}`}
            >
              {/* Grid Pattern Background for Workspace */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />

              <div
                className={`w-full perspective-1000 flex justify-center ${orientation === "vertical" ? "overflow-auto md:overflow-visible h-[80vh] md:h-full items-start md:items-center pt-4 md:pt-0" : ""}`}
              >
                <motion.div
                  ref={ticketRef}
                  id="ticket-render"
                  className={`mx-auto rounded-[1.5rem] overflow-hidden shadow-2xl flex transition-all duration-300 relative
                    ${
                      orientation === "horizontal"
                        ? "w-full max-w-4xl aspect-[11/5] flex-row scale-[0.85] sm:scale-100"
                        : "w-full max-w-[300px] sm:max-w-[320px] aspect-[4/9] md:aspect-[4/10] flex-col origin-top scale-[0.8] sm:scale-100"
                    }
                    ${
                      layout === "vintage"
                        ? "bg-[#fdfbf7] border-4 border-[#8B4513]/20 font-serif"
                        : layout === "neon"
                          ? "bg-[#0a0a0a] border border-[#00f3ff]/30 text-[#00f3ff]"
                          : layout === "brutalist"
                            ? "bg-white border-4 border-black shadow-[12px_12px_0_0_#000] rounded-none"
                            : layout === "elegant"
                              ? "bg-[#ffffff] border border-neutral-100"
                              : layout === "industrial"
                                ? "bg-neutral-900 text-white font-mono rounded-none"
                                : layout === "bento"
                                  ? "bg-white border border-neutral-100 p-1 md:p-2"
                                  : layout === "overlay"
                                    ? "bg-neutral-100"
                                    : "bg-white border border-neutral-100"
                    }`}
                  style={{
                    transformStyle: "preserve-3d",
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}em`,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight,
                  }}
                >
                  {/* Holographic Security Strip */}
                  {(layout === "modern" ||
                    layout === "bento" ||
                    layout === "elegant") && (
                    <div
                      className={`absolute z-30 holo-shimmer opacity-30 pointer-events-none
                      ${orientation === "horizontal" ? "right-[20%] top-0 bottom-0 w-8" : "bottom-[20%] left-0 right-0 h-4"}`}
                    />
                  )}
                  {/* Overlay Mode Content */}
                  {layout === "overlay" ? (
                    <div className="absolute inset-0 z-0">
                      {featuredImage ? (
                        <img
                          src={featuredImage}
                          alt="base design"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-2 border-4 border-dashed border-neutral-200">
                          <ImageIcon size={48} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Upload base design image
                          </span>
                        </div>
                      )}

                      <div
                        className={`absolute z-20 group transition-all duration-300
                         ${
                           codePosition === "bottom-right"
                             ? "bottom-4 right-4 md:bottom-8 md:right-8"
                             : codePosition === "bottom-left"
                               ? "bottom-4 left-4 md:bottom-8 md:left-8"
                               : codePosition === "top-right"
                                 ? "top-4 right-4 md:top-8 md:right-8"
                                 : "top-4 left-4 md:top-8 md:left-8"
                         }`}
                      >
                        <div className="p-2 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-2xl border border-white/50 group-hover:scale-110 transition-transform">
                          {codeType === "qr" ? (
                            <QRCodeCanvas
                              value="TKT-SAMPLE-PROTOTYPE"
                              size={80}
                              level="H"
                              fgColor="#000000"
                              className="w-12 h-12 md:w-24 md:h-24"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Barcode
                                value="TKT-SAMPLE-CODE"
                                width={0.4}
                                height={15}
                                displayValue={false}
                                font="Inter"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : layout === "bento" ? (
                    <div className="flex-1 flex gap-[2px] md:gap-2 h-full">
                      {/* Main Info Block */}
                      <div className="flex-[2] bg-neutral-50 rounded-[1rem] p-2 md:p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 md:space-y-4">
                            {logo && (
                              <img
                                src={logo}
                                alt="logo"
                                className="h-4 w-4 md:h-10 md:w-10 object-contain mb-1 md:mb-2"
                              />
                            )}
                            <div className="space-y-0.5 md:space-y-1">
                              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                                Official Pass
                              </div>
                              <h2 className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-black uppercase leading-tight tracking-tighter text-neutral-900 line-clamp-2">
                                {eventTitle}
                              </h2>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] md:text-[10px] font-black uppercase text-neutral-400">
                              Tier
                            </span>
                            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-neutral-900 text-white rounded-full text-[7px] md:text-[10px] font-black uppercase tracking-widest leading-none mt-1">
                              {ticketType}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl border border-neutral-100 shadow-sm">
                            <div className="text-[7px] md:text-[8px] font-black uppercase text-neutral-300 mb-0.5 md:mb-1">
                              Venue Logistics
                            </div>
                            <div className="text-[8px] md:text-[10px] font-bold text-neutral-900 uppercase truncate">
                              <MapPin
                                size={8}
                                className="inline mr-1 text-indigo-500"
                              />{" "}
                              {venue}
                            </div>
                          </div>
                          <div className="bg-white p-2 md:p-3 rounded-xl md:rounded-2xl border border-neutral-100 shadow-sm">
                            <div className="text-[7px] md:text-[8px] font-black uppercase text-neutral-300 mb-0.5 md:mb-1">
                              Temporal Window
                            </div>
                            <div className="text-[8px] md:text-[10px] font-bold text-neutral-900 uppercase">
                              <Calendar
                                size={8}
                                className="inline mr-1 text-indigo-500"
                              />{" "}
                              {date}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Image/Visual Block */}
                      <div className="flex-1 flex flex-col gap-[2px] md:gap-2">
                        <div className="flex-1 bg-neutral-900 rounded-[1rem] overflow-hidden relative group">
                          {featuredImage ? (
                            <img
                              src={featuredImage}
                              alt="featured"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-1">
                              <ImageIcon size={20} />
                              <span className="text-[6px] md:text-[8px] font-black uppercase">
                                Visual Asset
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-white">
                            <div className="text-[6px] md:text-[8px] font-black uppercase text-white/50">
                              Investment
                            </div>
                            <div className="text-[10px] md:text-sm font-black italic">
                              {price === "0" || price === "Free" || !price ? "FREE" : `UGX ${price}`}
                            </div>
                          </div>
                        </div>

                        <div className="h-1/4 md:h-1/3 bg-neutral-100 rounded-[1rem] p-2 md:p-3 flex flex-col justify-center">
                          <div className="text-[6px] md:text-[8px] font-black uppercase text-neutral-400 mb-0.5">
                            Authentic Holder
                          </div>
                          <div className="text-[8px] md:text-xs font-black uppercase tracking-tighter text-neutral-900 truncate">
                            {customerName}
                          </div>
                        </div>
                      </div>

                      {/* Validator Block */}
                      <div className="flex-none w-20 md:w-32 bg-neutral-50 rounded-[1rem] p-2 md:p-3 flex flex-col items-center justify-center border-l border-neutral-100 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl" />
                        <div className="bg-white p-1.5 md:p-3 rounded-xl shadow-xl border border-neutral-100 relative z-10 transition-transform hover:scale-110">
                          {codeType === "qr" ? (
                            <QRCodeCanvas
                              value="TKT-SAMPLE-PROTOTYPE"
                              size={80}
                              level="H"
                              fgColor="#000000"
                              className="w-10 h-10 md:w-20 md:h-20"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Barcode
                                value="TKT-SAMPLE-CODE"
                                width={0.4}
                                height={20}
                                displayValue={false}
                                font="Inter"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 md:mt-4 text-[6px] md:text-[8px] font-black uppercase tracking-[0.3em] text-neutral-400 rotate-90 truncate">
                          ID: {generateTicketId()}
                        </div>
                      </div>
                    </div>
                  ) : layout === "industrial" ? (
                    <div className="flex-1 flex flex-col border-[2px] md:border-4 border-white m-1 md:m-2 box-border overflow-hidden">
                      <div className="bg-white text-neutral-900 p-2 md:p-4 flex justify-between items-center border-b-[2px] md:border-b-4 border-white">
                        <div className="text-xs md:text-xl font-black italic tracking-tighter uppercase truncate pr-4">
                          {eventTitle}
                        </div>
                        <div className="px-2 py-0.5 md:px-3 md:py-1 bg-neutral-900 text-white text-[7px] md:text-[10px] font-black">
                          {ticketType}
                        </div>
                      </div>

                      <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 p-3 md:p-6 border-r-[2px] md:border-r-4 border-white space-y-3 md:space-y-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                            <div className="space-y-0.5 md:space-y-1">
                              <div className="text-[6px] md:text-[8px] font-black uppercase text-neutral-400">
                                LOC_ID
                              </div>
                              <div className="text-[10px] md:text-sm font-black uppercase truncate max-w-[120px] md:max-w-none">
                                {venue}
                              </div>
                            </div>
                            <div className="space-y-0.5 md:space-y-1">
                              <div className="text-[6px] md:text-[8px] font-black uppercase text-neutral-400">
                                TEMPORAL_MARK
                              </div>
                              <div className="text-[10px] md:text-sm font-black uppercase">
                                {date} // {time}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 md:space-y-2">
                            <div className="text-[6px] md:text-[8px] font-black uppercase text-neutral-400">
                              ASSIGNED_OPERATOR
                            </div>
                            <div className="text-sm md:text-2xl font-black uppercase tracking-tighter border-[1px] md:border-2 border-white/20 p-2 md:p-4 truncate">
                              {customerName}
                            </div>
                          </div>

                          <div className="flex items-end justify-between pt-1">
                            <div className="text-xl md:text-4xl font-black italic">
                              {price === "0" || price === "Free" || !price ? "FREE" : `UGX ${price}`}
                            </div>
                            <div className="hidden sm:block text-[8px] md:text-[10px] font-black uppercase text-neutral-500">
                              Verified Protocol // 2026
                            </div>
                          </div>
                        </div>

                        <div className="w-20 md:w-32 bg-white flex flex-col items-center justify-center p-2 md:p-4 shrink-0">
                          <div className="p-1 md:p-2 bg-white border-[1px] md:border-2 border-neutral-900">
                            {codeType === "qr" ? (
                              <QRCodeCanvas
                                value="TKT-SAMPLE-PROTOTYPE"
                                size={80}
                                level="H"
                                fgColor="#000000"
                                className="w-10 h-10 md:w-16 md:h-16"
                              />
                            ) : (
                              <Barcode
                                value="TKT-SAMPLE-CODE"
                                width={0.4}
                                height={20}
                                displayValue={false}
                                font="Inter"
                              />
                            )}
                          </div>
                          <div className="mt-2 md:mt-4 rotate-90 text-[6px] md:text-[8px] font-black tracking-widest text-neutral-900 whitespace-nowrap">
                            {generateTicketId()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Background Featured Image */}
                      {featuredImage && useBackgroundImage && (
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                          <img
                            src={featuredImage}
                            alt="bg"
                            className="w-full h-full object-cover grayscale"
                          />
                        </div>
                      )}

                      {/* Featured Image Section (Modern/Selected Styles) */}
                      {featuredImage &&
                        !useBackgroundImage &&
                        (layout === "modern" ||
                          layout === "neon" ||
                          layout === "elegant") && (
                          <div
                            className={`${orientation === "horizontal" ? "w-32" : "h-48"} shrink-0 overflow-hidden relative z-10`}
                          >
                            <img
                              src={featuredImage}
                              alt="featured"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          </div>
                        )}

                      {/* Left/Top Stub / Header Stripe */}
                      <div
                        className={`shrink-0 flex items-center justify-center transition-colors duration-500 z-10
                         ${orientation === "horizontal" ? "w-full md:w-[15%]" : "w-full h-[15%]"}
                         ${layout === "brutalist" ? (orientation === "horizontal" ? "border-r-4 border-black bg-white" : "border-b-4 border-black bg-white") : ""}`}
                        style={{
                          backgroundColor:
                            layout === "brutalist"
                              ? undefined
                              : layout === "neon"
                                ? "#00f3ff22"
                                : color,
                        }}
                      >
                        <div
                          className={`${orientation === "horizontal" ? "md:-rotate-90 md:whitespace-nowrap" : ""} flex items-center gap-3`}
                        >
                          <span
                            className={`text-[10px] font-black uppercase tracking-[0.5em] 
                              ${layout === "neon" ? "text-[#00f3ff]" : layout === "brutalist" ? "text-black" : "text-white"} opacity-80`}
                          >
                            {ticketType}
                          </span>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div
                        className={`flex-1 p-3 md:p-5 flex flex-col justify-between z-10 ${layout === "neon" ? "text-[#00f3ff]" : ""} space-y-2 md:space-y-4`}
                      >
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div className="space-y-2 max-w-sm">
                            {logo && (
                              <img
                                src={logo}
                                alt="logo"
                                className={`h-10 w-10 object-cover rounded-full mb-4 ${layout === "neon" ? "brightness-150 border border-[#00f3ff]" : "filter grayscale border-2 border-neutral-100"}`}
                              />
                            )}
                            <h2
                              className={`${orientation === "vertical" ? "text-lg md:text-xl" : "text-sm md:text-3xl"} font-black tracking-tight leading-tight uppercase italic truncate max-w-[200px] md:max-w-none
                                 ${
                                   layout === "vintage"
                                     ? "font-serif normal-case italic text-[#2c1810]"
                                     : layout === "neon"
                                       ? "text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] font-mono"
                                       : layout === "brutalist"
                                         ? "font-black tracking-tighter text-black"
                                         : layout === "elegant"
                                           ? "font-serif tracking-normal normal-case text-neutral-900"
                                           : "text-neutral-900"
                                 }`}
                            >
                              {eventTitle}
                            </h2>
                            <div className="flex flex-col gap-1">
                              <div
                                className={`flex items-center gap-2 font-bold text-[8px] uppercase tracking-widest ${layout === "neon" ? "text-[#00f3ff]/60" : "text-neutral-400"}`}
                              >
                                <MapPin
                                  size={10}
                                  className={
                                    layout === "neon"
                                      ? "text-[#00f3ff]"
                                      : "text-rose-500"
                                  }
                                />
                                {venue}
                              </div>
                              <div
                                className={`flex items-center gap-2 font-bold text-[8px] uppercase tracking-widest ${layout === "neon" ? "text-[#00f3ff]/60" : "text-neutral-400"}`}
                              >
                                <Calendar
                                  size={10}
                                  className={
                                    layout === "neon"
                                      ? "text-[#00f3ff]"
                                      : "text-indigo-500"
                                  }
                                />
                                {date} @ {time}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 text-right">
                            <span
                              className={`text-[8px] font-black uppercase tracking-widest ${layout === "neon" ? "text-[#00f3ff]/40" : "text-neutral-300"}`}
                            >
                              Cost
                            </span>
                            <span
                              className={`${orientation === "vertical" ? "text-base md:text-lg" : "text-xs md:text-2xl"} font-black tracking-tighter italic ${layout === "neon" ? "text-[#00f3ff]" : "text-neutral-900"}`}
                            >
                              {price === "0" || price === "Free" || !price ? "FREE" : `UGX ${price}`}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`pt-4 border-t flex flex-row items-end justify-between gap-4 
                           ${layout === "neon" ? "border-[#00f3ff]/20" : "border-neutral-100"}
                           ${layout === "brutalist" ? "border-black border-t-4" : ""}`}
                        >
                          <div className="space-y-2">
                            <div className="flex flex-col">
                              <span
                                className={`text-[7px] font-black uppercase tracking-[0.3em] mb-1 ${layout === "neon" ? "text-[#00f3ff]/40" : "text-neutral-400"}`}
                              >
                                Holder
                              </span>
                              <span
                                className={`${orientation === "vertical" ? "text-lg" : "text-base md:text-xl"} font-black tracking-tighter italic ${layout === "neon" ? "text-[#00f3ff]" : "text-neutral-900"} truncate max-w-[120px] md:max-w-none`}
                              >
                                {customerName}
                              </span>
                            </div>
                            <div
                              className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded inline-flex items-center gap-1 md:gap-1.5 
                                  ${
                                    layout === "neon"
                                      ? "bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30"
                                      : layout === "brutalist"
                                        ? "bg-black text-white rounded-none border-2 border-black"
                                        : "bg-neutral-900 text-white"
                                  }`}
                            >
                              <Shield
                                size={8}
                                className={
                                  layout === "neon"
                                    ? "text-[#00f3ff]"
                                    : "text-indigo-400"
                                }
                              />
                              <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest">
                                Verified
                              </span>
                            </div>
                          </div>

                          <div
                            className={`p-1.5 md:p-2 bg-white rounded-xl shadow-xl border border-neutral-50 transition-transform duration-500 group hover:scale-[1.05] mb-1 mr-1 md:mb-2 md:mr-2
                              ${
                                layout === "neon"
                                  ? "bg-black border border-[#00f3ff]/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]"
                                  : layout === "brutalist"
                                    ? "bg-white border-4 border-black rounded-none shadow-none"
                                    : ""
                              }`}
                          >
                            {codeType === "qr" ? (
                              <QRCodeCanvas
                                value="TKT-SAMPLE-PROTOTYPE"
                                size={orientation === "vertical" ? 60 : 70}
                                level="H"
                                fgColor={
                                  layout === "neon" ? "#00f3ff" : "#000000"
                                }
                                bgColor={
                                  layout === "neon" ? "#000000" : "#ffffff"
                                }
                                className="w-12 h-12 md:w-16 md:h-16"
                              />
                            ) : (
                              <div className="flex flex-col items-center">
                                <Barcode
                                  value="TKT-SAMPLE-CODE"
                                  width={0.4}
                                  height={15}
                                  displayValue={false}
                                  font="Inter"
                                  lineColor={
                                    layout === "neon" ? "#00f3ff" : color
                                  }
                                  background={
                                    layout === "neon"
                                      ? "transparent"
                                      : "#ffffff"
                                  }
                                />
                                <span
                                  className={`text-[4px] md:text-[6px] font-mono mt-0.5 opacity-40 ${layout === "neon" ? "text-[#00f3ff]" : ""}`}
                                >
                                  AUTO-UID
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Perforation Effect */}
                  {orientation === "horizontal" &&
                    layout !== "bento" &&
                    layout !== "industrial" && (
                      <>
                        <div className="hidden md:block absolute left-[15%] top-0 bottom-0 w-px border-l-2 border-dashed border-neutral-200" />
                        <div className="hidden md:block absolute left-[15%] top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                        <div className="hidden md:block absolute left-[15%] top-0 -mt-2.5 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                        <div className="hidden md:block absolute left-[15%] bottom-0 -mb-2.5 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                      </>
                    )}
                  {orientation === "vertical" && (
                    <>
                      <div
                        className={`absolute left-0 right-0 top-[15%] h-px border-t-2 border-dashed ${layout === "industrial" ? "border-white" : "border-neutral-200"}`}
                      />
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 top-[15%] -mt-2.5 w-5 h-5 rounded-full shadow-inner ${layout === "industrial" ? "bg-neutral-900 border-2 border-white" : "bg-neutral-50"}`}
                      />
                      <div
                        className={`absolute left-0 top-[15%] -mt-2.5 -ml-2.5 w-5 h-5 rounded-full shadow-inner ${layout === "industrial" ? "bg-neutral-900 border-2 border-white" : "bg-neutral-50"}`}
                      />
                      <div
                        className={`absolute right-0 top-[15%] -mt-2.5 -mr-2.5 w-5 h-5 rounded-full shadow-inner ${layout === "industrial" ? "bg-neutral-900 border-2 border-white" : "bg-neutral-50"}`}
                      />
                    </>
                  )}
                </motion.div>
              </div>
            </div>

            <div className="mt-12 w-full max-w-lg grid grid-cols-3 gap-4">
              <div className="card p-4 flex flex-col items-center gap-2 text-center bg-white/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Check size={16} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-tight">
                  Persistence Protocol Ready
                </span>
              </div>
              <div className="card p-4 flex flex-col items-center gap-2 text-center bg-white/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-tight">
                  Fraud Detection Active
                </span>
              </div>
              <div className="card p-4 flex flex-col items-center gap-2 text-center bg-white/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                  <X size={16} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-tight">
                  One-Time Scannable
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
          )
        )}

      {/* Admissions & Events Management Dashboard */}
        {activeToolTab === "manager" && (
          !user ? (
            <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-12 text-center max-w-md mx-auto my-12 shadow-sm space-y-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-neutral-800 tracking-wider">Authentication Required</h3>
                <p className="text-[11px] text-neutral-400 font-medium leading-relaxed mt-2 uppercase">
                  Please connect an active retail/organizer profile on the home dashboard to monitor attendees, scan admission tickets, and review sales logs.
                </p>
              </div>
              <button 
                onClick={() => {
                  window.location.hash = "";
                }}
                className="w-full h-12 bg-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
              >
                Go back to login desk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Side: Events List */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-neutral-400">
                  Published Channels ({myEvents.length})
                </h3>
              </div>
              {myEvents.length === 0 ? (
                <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 text-center flex flex-col items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <Tickets size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-neutral-800">No Channels Published</h4>
                    <p className="text-[10px] text-neutral-400 font-medium">Create and customize a prototype, then click "Publish Booking Page" to begin syncing attendance.</p>
                  </div>
                  <button 
                    onClick={() => setActiveToolTab("designer")}
                    className="px-5 py-2.5 bg-neutral-900 text-white hover:bg-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Go to Designer
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                  {myEvents.map((evt) => {
                    const regUrl = `${window.location.origin}/#event-register?e=${evt.id}`;
                    const isSelected = selectedEventId === evt.id;
                    const eventDate = new Date(evt.date);
                    const formattedDate = eventDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });
                    
                    return (
                      <div 
                        key={evt.id} 
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`bg-white border text-left p-6 rounded-[2.2rem] transition-all cursor-pointer flex flex-col gap-4 shadow-sm group relative
                          ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-neutral-100 hover:border-indigo-400'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold uppercase">
                                {evt.id}
                              </span>
                              <span className="text-[8px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                {evt.price === '0' || !evt.price ? 'FREE' : `UGX ${evt.price}`}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-neutral-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight line-clamp-2">
                              {evt.eventTitle}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEventTitle(evt.eventTitle);
                                setVenue(evt.venue);
                                setDate(evt.date);
                                setTime(evt.time);
                                setTicketType(evt.ticketType || "General Admission");
                                setPrice(evt.price || "50,000");
                                setIsFree(evt.price === "0" || evt.price === "Free" || !evt.price);
                                setEventTiers(evt.tiers || [
                                  { id: "1", name: evt.ticketType || "General Admission", price: evt.price || "50,000" }
                                ]);
                                setEventDescription(evt.description || "");
                                setOrganizerPhone(evt.organizerPhone || "0772000000");
                                if (evt.design) {
                                  setColor(evt.design.color);
                                  setLayout(evt.design.layout);
                                  setOrientation(evt.design.orientation || "horizontal");
                                  setCodeType(evt.design.codeType || "qr");
                                  if (evt.design.fontSize) setFontSize(evt.design.fontSize);
                                  if (evt.design.font) setFontFamily(evt.design.font);
                                }
                                setSelectedEditEventId(evt.id);
                                setActiveToolTab("designer");
                              }}
                              className="p-2 text-neutral-300 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Edit Event Details"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(evt.id);
                              }}
                              className="p-2 text-neutral-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Decommission Channel"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 font-medium">
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar size={12} className="text-neutral-300 shrink-0" />
                            <span>{formattedDate} @ {evt.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={12} className="text-neutral-300 shrink-0" />
                            <span>{evt.venue}</span>
                          </div>
                        </div>

                        {/* Expandable actions for copying link & showing QR code */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-50" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(regUrl);
                                setCopiedEventId(evt.id);
                                setTimeout(() => setCopiedEventId(null), 2500);
                              } catch (err) {
                                console.error('Failed to copy', err);
                              }
                            }}
                            className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5
                              ${copiedEventId === evt.id ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-neutral-50 border-neutral-100 text-neutral-600 hover:border-indigo-400 hover:bg-white'}`}
                          >
                            {copiedEventId === evt.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedEventId === evt.id ? 'Url Copied' : 'Share URL'}</span>
                          </button>
                          
                          <button 
                            onClick={() => setSelectedEventQrOverlayId(selectedEventQrOverlayId === evt.id ? null : evt.id)}
                            className={`px-3 h-9 rounded-xl border flex items-center justify-center transition-all text-neutral-500 border-neutral-100 bg-neutral-50 hover:border-indigo-400 hover:bg-white
                              ${selectedEventQrOverlayId === evt.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`}
                            title="View Gatekeeper Credentials (QR Code)"
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest mr-1 sm:mr-2">QR Code</span>
                            <Palette size={12} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {selectedEventQrOverlayId === evt.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 flex flex-col items-center gap-3 overflow-hidden"
                            >
                              <div className="bg-white p-3 rounded-2xl shadow-inner border border-neutral-100">
                                <QRCodeCanvas value={regUrl} size={150} level="M" />
                              </div>
                              <span className="text-[8px] font-bold tracking-wider uppercase text-neutral-400 text-center leading-normal">
                                Attendees scan this matrix code to load registration on mobile
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Side: Roster, Scanning, and Gatekeeper admission */}
            <div className="lg:col-span-7 space-y-6">
              {selectedEventId ? (
                (() => {
                  const currentEvent = myEvents.find(e => e.id === selectedEventId);
                  if (!currentEvent) return null;
                  
                  // Filter attendees based on query
                  const filteredTickets = eventTickets.filter(t => 
                    t.customerName.toLowerCase().includes(attendeeSearchQuery.toLowerCase()) ||
                    (t.customerEmail && t.customerEmail.toLowerCase().includes(attendeeSearchQuery.toLowerCase())) ||
                    t.id.toLowerCase().includes(attendeeSearchQuery.toLowerCase())
                  );

                  // Calculation stats
                  const totalCount = eventTickets.length;
                  const scannedCount = eventTickets.filter(t => t.scanned).length;
                  const ticketPriceNumber = parseFloat(currentEvent.price.replace(/,/g, '')) || 0;
                  const totalRevenue = eventTickets.length * ticketPriceNumber;
                  const formattedRevenue = totalRevenue.toLocaleString("en-US");

                  return (
                    <div className="space-y-6">
                      {/* Active Event Metrics Container */}
                      <div className="bg-neutral-900 text-white rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest text-[#00f3ff]">
                              Gatekeeper Live Monitor
                            </span>
                            <h3 className="text-xl font-black italic uppercase italic tracking-tight text-white mt-1">
                              {currentEvent.eventTitle}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-neutral-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>Real-Time Ingress listening</span>
                          </div>
                        </div>

                        {/* Numbers grid */}
                        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#00f3ff] block">ADMITTED</span>
                            <span className="text-2xl font-black tracking-tight text-[#00f3ff]">
                              {scannedCount} <span className="text-xs font-normal text-white/50">/ {totalCount}</span>
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400 block">TOTAL SALES</span>
                            <span className="text-2xl font-black tracking-tight text-white">{totalCount}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400 block">REVENUE EST</span>
                            <span className="text-2xl font-black tracking-tight text-[#10b981]">
                              {currentEvent.price === '0' || !currentEvent.price ? 'Free' : `UGX ${formattedRevenue}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Attendee search & list container */}
                      <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                              Attendance Roster ({filteredTickets.length})
                            </h4>
                            <p className="text-[9px] font-medium text-neutral-400 uppercase">Search by name, email or secure signature ID</p>
                          </div>
                          
                          <input 
                            type="text"
                            placeholder="Search attendee..."
                            value={attendeeSearchQuery}
                            onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                            className="bg-neutral-50 rounded-xl h-10 px-4 text-xs font-bold w-full sm:w-64 border-none focus:ring-2 ring-indigo-500/20 transition-all"
                          />
                        </div>

                        {filteredTickets.length === 0 ? (
                          <div className="text-center py-12 text-neutral-400 text-xs font-black uppercase tracking-widest">
                            No matching attendee records
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {filteredTickets.map((ticket) => {
                              const admissionTime = ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                second: "2-digit"
                              }) : "";

                              const isPaidTicket = ticket.price && ticket.price !== '0' && ticket.price.toLowerCase() !== 'free';
                              const isPaymentApproved = !isPaidTicket || ticket.paymentConfirmed;

                              return (
                                <div 
                                  key={ticket.id}
                                  className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-neutral-50/50
                                    ${ticket.scanned ? 'border-emerald-100 bg-emerald-50/10' : 'border-neutral-100'}`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-black text-neutral-800 uppercase tracking-tight">
                                        {ticket.customerName}
                                      </span>
                                      <span className="text-[8px] font-mono bg-neutral-150 px-1.5 py-0.5 rounded text-neutral-400 font-bold uppercase">
                                        {ticket.id}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-neutral-400 font-medium font-mono">
                                      {ticket.customerEmail || "No Email Provided"}
                                    </div>
                                    {ticket.scanned && (
                                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                        Admitted @ {admissionTime}
                                      </span>
                                    )}
                                    {isPaidTicket && (
                                      <div className="flex flex-col gap-1 mt-1">
                                        {ticket.paymentConfirmed ? (
                                          <span className="text-[7.5px] font-black uppercase text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-100 self-start">
                                            <Check size={8} /> Payment Verified ({ticket.paymentMethod?.toUpperCase() || 'MOMO'})
                                          </span>
                                        ) : (
                                          <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 self-start">
                                            <span className="text-[7.5px] font-black uppercase text-amber-700 flex items-center gap-1">
                                              <span>⚠️ Awaiting Verification</span>
                                            </span>
                                            <span className="font-mono text-[7px] text-amber-600 font-bold">
                                              TxID: {ticket.paymentTxId || 'Not Entered'} ({ticket.paymentMethod?.toUpperCase() || 'MOMO'})
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {!isPaymentApproved ? (
                                    <button 
                                      onClick={() => handleApprovePayment(ticket)}
                                      className="h-10 px-4 bg-amber-500 hover:bg-amber-600 border border-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 animate-pulse"
                                    >
                                      <Check size={12} />
                                      <span>Verify Payment</span>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleToggleAttendeeScanned(ticket.id, !!ticket.scanned)}
                                      className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border
                                        ${ticket.scanned 
                                          ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' 
                                          : 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/10'}`}
                                    >
                                      <ListChecks size={12} />
                                      <span>{ticket.scanned ? 'Revoke Admission' : 'Admit Pass'}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-12 text-center flex flex-col items-center gap-4 shadow-sm min-h-[400px] justify-center">
                  <div className="w-16 h-16 rounded-[2.2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <Tickets size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-neutral-800">No Channel Selected</h4>
                    <p className="text-[10px] text-neutral-400 font-medium max-w-sm mx-auto">
                      Select one of your published channels on the left to see live metrics, manage gatekeeper admission, and admit ticket codes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          )
        )}
        {/* SUCCESS MODAL FOR EVENT PUBLISH OR UPDATE */}
        {newlyPublishedEvent && (
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white border border-neutral-100 rounded-[3rem] w-full max-w-lg p-8 lg:p-10 shadow-2xl relative text-left my-8 scale-in max-h-[90vh] overflow-y-auto">
              {/* Confetti element decoration (gorgeously simulated in self-contained CSS) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem]">
                <div className="absolute top-10 left-10 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
                <div className="absolute top-20 right-12 w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="absolute bottom-16 left-16 w-3 h-3 bg-pink-400 rounded-sm rotate-45 animate-pulse" />
                <div className="absolute bottom-24 right-24 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </div>

              {/* Header section with bouncing success crest */}
              <div className="text-center space-y-4 pb-6 border-b border-neutral-100">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-neutral-900">
                    {justUpdatedEvent ? "Access Channel Updated" : "Booking Channel Deployed!"}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                    {justUpdatedEvent 
                      ? "Cloud database registry synchronisation successful!" 
                      : "Your premium digital event booking page is now officially live."}
                  </p>
                </div>
              </div>

              {/* Event Quick Details Card */}
              <div className="my-6 bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex gap-4 items-start">
                <div 
                  className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white"
                  style={{ backgroundColor: newlyPublishedEvent.design?.color || "#6366f1" }}
                >
                  <Tickets size={20} />
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h4 className="text-xs font-black uppercase text-neutral-800 tracking-tight truncate">
                    {newlyPublishedEvent.eventTitle}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2.5 text-[9px] text-neutral-400 font-bold uppercase">
                    <span>{newlyPublishedEvent.date}</span>
                    <span>•</span>
                    <span className="truncate">{newlyPublishedEvent.venue}</span>
                  </div>
                  <span className="inline-block text-[8px] font-mono font-bold bg-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded mt-1 select-all">
                    ID: {newlyPublishedEvent.id}
                  </span>
                </div>
              </div>

              {/* Booking URL Copy Box */}
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-400">
                  Shareable Public Access Link
                </label>
                <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-500 truncate pl-2 select-all">
                    {window.location.origin + window.location.pathname + "#explore?id=" + newlyPublishedEvent.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = window.location.origin + window.location.pathname + "#explore?id=" + newlyPublishedEvent.id;
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        setCopiedSuccessLink(true);
                        setTimeout(() => setCopiedSuccessLink(false), 2000);
                      }).catch((err) => {
                        console.error('Failed to copy', err);
                      });
                    }}
                    className={`h-9 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-1
                      ${copiedSuccessLink ? "bg-emerald-500 text-white animate-pulse" : "bg-white hover:bg-neutral-100 text-neutral-800 border"}`}
                  >
                    {copiedSuccessLink ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedSuccessLink ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* Interactive QR Code scan preview for Live checking */}
              <div className="flex flex-col items-center bg-indigo-50/20 border border-indigo-100 rounded-[2rem] p-6 mt-6 text-center space-y-3">
                <div className="bg-white p-3 rounded-2xl shadow-md border inline-block">
                  <QRCodeCanvas
                    value={window.location.origin + window.location.pathname + "#explore?id=" + newlyPublishedEvent.id}
                    size={110}
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider">Attendee Entry QR Scanner Mock</h5>
                  <p className="text-[9px] text-neutral-400 font-semibold uppercase mt-1 leading-normal">
                    Or scan this barcode instantly with any smartphone camera to inspect the responsive customer checkout portal.
                  </p>
                </div>
              </div>

              {/* Dual Close Action elements */}
              <div className="flex flex-col sm:flex-row gap-2 mt-8 pt-4 border-t border-neutral-50">
                <button
                  type="button"
                  onClick={() => {
                    const evtSource = newlyPublishedEvent;
                    setNewlyPublishedEvent(null);
                    setExploreSearch(evtSource.id); // pre-populate searchable text inside public catalog!
                    setActiveToolTab("explore"); // navigate to catalog
                  }}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Globe size={13} />
                  View in Public Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewlyPublishedEvent(null);
                    setActiveToolTab("manager"); // go to manager list to verify
                  }}
                  className="px-5 h-12 bg-neutral-900 hover:bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <ListChecks size={13} />
                  Check Attendee Roster
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewlyPublishedEvent(null);
                  }}
                  className="px-4 h-12 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Stay Here
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
