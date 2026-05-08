import React, { useState, useRef, ChangeEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image';
import { useReactToPrint } from 'react-to-print';
import { Download, Share2, Copy, Check, Tickets, Type, Image as ImageIcon, X, Sparkles, Layout, Palette, Calendar, MapPin, User, DollarSign, Save, Printer, Shield, FolderHeart, Plus, Trash2, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketDesign, createTicket, saveTicketTemplate, TicketTemplate, createTicketsBulk } from '../../services/ticketService';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function TicketingTool() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [expandedSection, setExpandedSection] = useState<string | null>('event');
  
  const [eventTitle, setEventTitle] = useState('Kampala Music Festival 2026');
  const [venue, setVenue] = useState('Namboole Stadium');
  const [date, setDate] = useState('2026-12-25');
  const [time, setTime] = useState('06:00 PM');
  const [ticketType, setTicketType] = useState('General Admission');
  const [price, setPrice] = useState('50,000');
  const [customerName, setCustomerName] = useState('JOEL MUKASA');
  
  const [color, setColor] = useState('#6366f1');
  const [layout, setLayout] = useState<'standard' | 'minimal' | 'modern' | 'vintage' | 'neon' | 'brutalist' | 'elegant' | 'slim' | 'overlay'>('modern');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [useBackgroundImage, setUseBackgroundImage] = useState(true);
  const [extractColor, setExtractColor] = useState(true);
  const [codePosition, setCodePosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [codeType, setCodeType] = useState<'qr' | 'barcode'>('qr');
  const [logo, setLogo] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(1);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  
  // Bulk processing
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkNames, setBulkNames] = useState('');

  // Template Management
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredImageRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'ticketTemplates'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketTemplate));
      setTemplates(docs);
    });
    return () => unsubscribe();
  }, [user]);

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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
    return 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleSaveAndPrint = async () => {
    setLoading(true);
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

    // Parallelize Firestore write and PDF generation to reduce delays
    const deployPromise = createTicket(ticketData);
    
    // Generate PDF
    const doc = new jsPDF({
      orientation: orientation === 'horizontal' ? 'l' : 'p',
      unit: 'mm',
      format: [139.7, 50.8] // 5.5" x 2"
    });

    // Handle Featured/Overlay Image for PDF
    if (featuredImage) {
      try {
        // Use FAST compression
        doc.addImage(featuredImage, 'JPEG', 0, 0, 139.7, 50.8, undefined, 'FAST');
      } catch (e) {
        console.error('Error adding image to PDF', e);
      }
    }

    const qrCanvas = ticketRef.current?.querySelector('canvas');
    if (qrCanvas) {
      const qrDataUrl = qrCanvas.toDataURL('image/png', 0.8); // Slight compression
      
      if (layout === 'overlay') {
        const x = codePosition.includes('right') ? 115 : 5;
        const y = codePosition.includes('bottom') ? 35 : 5;
        
        doc.setFillColor(255, 255, 255);
        doc.rect(x - 1, y - 1, 22, 22, 'F');
        doc.addImage(qrDataUrl, 'PNG', x, y, 20, 20, undefined, 'FAST');
        
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text(ticketId, x, y + 23);
      } else {
        // Standard layout PDF logic
        doc.setFillColor(color);
        if (orientation === 'horizontal') {
          doc.rect(0, 0, 10, 50.8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18 * fontSize);
          doc.setTextColor(40, 40, 40);
          doc.text(eventTitle.toUpperCase(), 15, 15);
          doc.setFontSize(12 * fontSize);
          doc.text(`UGX ${price}`, 15, 45);
          doc.setFontSize(10 * fontSize);
          doc.text(customerName.toUpperCase(), 15, 30);
          
          doc.addImage(qrDataUrl, 'PNG', 115, 10, 20, 20, undefined, 'FAST');
          doc.setFontSize(6 * fontSize);
          doc.text(ticketId, 115, 32);
        } else {
          doc.rect(0, 0, 50.8, 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16 * fontSize);
          doc.setTextColor(40, 40, 40);
          doc.text(eventTitle.toUpperCase(), 5, 25);
          
          doc.addImage(qrDataUrl, 'PNG', 15, 10, 20, 20, undefined, 'FAST');
          doc.setFontSize(6 * fontSize);
          doc.text(ticketId, 15, 32);
          
          doc.setFontSize(10 * fontSize);
          doc.text(customerName.toUpperCase(), 5, 40);
          doc.setFontSize(12 * fontSize);
          doc.text(`UGX ${price}`, 5, 48);
        }
      }
    }
    
    // Wait for deployment to finish before marking success
    await deployPromise;
    doc.save(`ticket-${ticketId}.pdf`);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleExportImage = () => {
    if (ticketRef.current === null) return;
    
    toPng(ticketRef.current, { cacheBust: true, })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `ticket-${eventTitle}-${customerName}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Could not export image', err);
      });
  };

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
  });

  const handleBulkGenerate = async () => {
    const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    setLoading(true);
    const ticketsToCreate: Ticket[] = [];
    
    for (const name of names) {
      const ticketId = generateTicketId();
      const design: TicketDesign = {
        color, font: fontFamily, layout, logoUrl: logo || undefined, featuredImageUrl: featuredImage || undefined, orientation, codeType,
        fontSize, fontFamily, letterSpacing: `${letterSpacing}px`, lineHeight,
      };
      const ticketData: Ticket = {
        id: ticketId, eventTitle, venue, date, time, ticketType, price, customerName: name, scanned: false, design, createdAt: null,
      };
      ticketsToCreate.push(ticketData);
    }
    
    await createTicketsBulk(ticketsToCreate);
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  const handleSaveTemplate = async () => {
    if (!user) return;
    const templateId = 'TMP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await saveTicketTemplate({
      id: templateId,
      userId: user.uid,
      name: eventTitle || 'Unnamed Template',
      eventTitle, venue, date, time, ticketType, price,
      design: { color, font: fontFamily, layout, logoUrl: logo || undefined, featuredImageUrl: featuredImage || undefined, orientation, codeType, fontSize, fontFamily, letterSpacing: `${letterSpacing}px`, lineHeight },
      createdAt: null
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
    if (template.design.letterSpacing) setLetterSpacing(parseFloat(template.design.letterSpacing));
    if (template.design.lineHeight) setLineHeight(template.design.lineHeight);
    if (template.design.logoUrl) setLogo(template.design.logoUrl);
    if (template.design.featuredImageUrl) setFeaturedImage(template.design.featuredImageUrl);
    setShowTemplates(false);
  };

  const layouts = [
    { id: 'standard', label: 'Standard' },
    { id: 'minimal', label: 'Minimalist' },
    { id: 'modern', label: 'Ultra Modern' },
    { id: 'vintage', label: 'Retro Vintage' },
    { id: 'neon', label: 'Neon Cyber' },
    { id: 'brutalist', label: 'Raw Brutalist' },
    { id: 'elegant', label: 'Gold Elegant' },
    { id: 'slim', label: 'Slim Compact' },
    { id: 'overlay', label: 'Pre-designed Overlay' },
  ];

  return (
    <>
    {/* Print Styles */}
    <style dangerouslySetInnerHTML={{ __html: `
      @media print {
        @page {
          size: 5.5in 2in;
          margin: 0;
        }
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
        }
        .perspective-1000 {
          perspective: none !important;
          transform: none !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `}} />

    <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12">
      <header className="mb-8 md:mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
                <Tickets size={24} />
              </div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic">Ticket Engine</h1>
           </div>
           <p className="text-neutral-500 font-medium italic">Design, generate, and deploy mission-critical access tokens.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
           >
              <FolderHeart size={16} />
              <span>Design Vault ({templates.length})</span>
           </button>
           <button 
              onClick={handleSaveTemplate}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
           >
              <Save size={16} />
              <span>Save Template</span>
           </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden mb-6 bg-neutral-100 p-1 rounded-2xl">
         <button 
            onClick={() => setActiveMobileTab('edit')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === 'edit' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}
         >
            Configure
         </button>
         <button 
            onClick={() => setActiveMobileTab('preview')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === 'preview' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}
         >
            Preview
         </button>
      </div>

      <AnimatePresence>
         {showTemplates && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="mb-12 overflow-hidden"
            >
               <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 shadow-sm flex gap-4 overflow-x-auto pb-4">
                  {templates.length === 0 ? (
                    <div className="w-full text-center py-8 text-neutral-400 text-xs font-bold uppercase tracking-widest">No saved designs found</div>
                  ) : (
                    templates.map(tmp => (
                       <button 
                          key={tmp.id}
                          onClick={() => loadTemplate(tmp)}
                          className="shrink-0 w-48 card p-4 flex flex-col gap-2 hover:border-indigo-500 text-left transition-all group"
                       >
                          <div className="h-2 w-full rounded-full mb-2" style={{ backgroundColor: tmp.design.color }} />
                          <span className="text-[10px] font-black uppercase tracking-widest block truncate">{tmp.name}</span>
                          <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{tmp.ticketType}</span>
                       </button>
                    ))
                  )}
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Editor Block */}
        <div className={`md:col-span-5 lg:col-span-4 space-y-6 ${activeMobileTab === 'preview' ? 'hidden md:block' : 'block'}`}>
          <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 lg:p-8 space-y-6 lg:space-y-8 shadow-sm">
             
             {/* Collapsible Sections for Mobile */}
             <div className="space-y-4">
                {/* Event Section */}
                <div className="border-b border-neutral-50 pb-4">
                   <button 
                      onClick={() => setExpandedSection(expandedSection === 'event' ? null : 'event')}
                      className="w-full flex items-center justify-between group"
                   >
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">Event Details</label>
                      <div className={`transition-transform md:hidden ${expandedSection === 'event' ? 'rotate-180' : ''}`}>
                         <Plus size={14} className="text-neutral-300" />
                      </div>
                   </button>
                   
                   <AnimatePresence initial={false}>
                      {(expandedSection === 'event' || window.innerWidth >= 768) && (
                         <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-3 pt-4 overflow-hidden"
                         >
                            <div className="relative">
                               <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                               <input 
                                 type="text" 
                                 placeholder="Event Title" 
                                 value={eventTitle}
                                 onChange={e => setEventTitle(e.target.value)}
                                 className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                               />
                            </div>
                            <div className="relative">
                               <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                               <input 
                                 type="text" 
                                 placeholder="Venue" 
                                 value={venue}
                                 onChange={e => setVenue(e.target.value)}
                                 className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="relative">
                                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                                 <input 
                                   type="date" 
                                   value={date}
                                   onChange={e => setDate(e.target.value)}
                                   className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                                 />
                               </div>
                               <input 
                                 type="time" 
                                 value={time}
                                 onChange={e => setTime(e.target.value)}
                                 className="w-full bg-neutral-50 border-none rounded-xl h-12 px-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                               />
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Identity Section */}
                <div className="border-b border-neutral-50 pb-4">
                   <button 
                      onClick={() => setExpandedSection(expandedSection === 'identity' ? null : 'identity')}
                      className="w-full flex items-center justify-between group"
                   >
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">Security & Identity</label>
                      <div className={`transition-transform md:hidden ${expandedSection === 'identity' ? 'rotate-180' : ''}`}>
                         <Plus size={14} className="text-neutral-300" />
                      </div>
                   </button>
                   
                   <AnimatePresence initial={false}>
                      {(expandedSection === 'identity' || window.innerWidth >= 768) && (
                         <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4 pt-4 overflow-hidden"
                         >
                            <div className="grid grid-cols-2 gap-3">
                               <input 
                                  type="text" 
                                  placeholder="Tier (e.g. VIP)" 
                                  value={ticketType}
                                  onChange={e => setTicketType(e.target.value)}
                                  className="w-full bg-neutral-50 border-none rounded-xl h-12 px-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                               />
                               <div className="relative">
                                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                                  <input 
                                    type="text" 
                                    placeholder="Price (UGX)" 
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                                  />
                               </div>
                            </div>

                            <button 
                               onClick={() => setBulkMode(!bulkMode)}
                               className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${bulkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-400'}`}
                            >
                               <ListChecks size={14} />
                               {bulkMode ? 'Direct Input' : 'Enable Bulk Mode'}
                            </button>

                            {bulkMode ? (
                               <div className="space-y-2">
                                  <label className="text-[9px] font-bold uppercase text-neutral-400">Customer Names</label>
                                  <textarea 
                                    value={bulkNames}
                                    onChange={e => setBulkNames(e.target.value)}
                                    placeholder="John Doe&#10;Jane Smith" 
                                    className="w-full bg-neutral-50 border-none rounded-xl p-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all h-32"
                                  />
                               </div>
                            ) : (
                               <div className="relative">
                                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                                 <input 
                                   type="text" 
                                   placeholder="Attendant Name" 
                                   value={customerName}
                                   onChange={e => setCustomerName(e.target.value)}
                                   className="w-full bg-neutral-50 border-none rounded-xl h-12 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-indigo-500/20 transition-all"
                                 />
                               </div>
                            )}
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Typography Section */}
                <div className="border-b border-neutral-50 pb-4">
                   <button 
                      onClick={() => setExpandedSection(expandedSection === 'type' ? null : 'type')}
                      className="w-full flex items-center justify-between group"
                   >
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">Typography & Scale</label>
                      <div className={`transition-transform md:hidden ${expandedSection === 'type' ? 'rotate-180' : ''}`}>
                         <Plus size={14} className="text-neutral-300" />
                      </div>
                   </button>
                   
                   <AnimatePresence initial={false}>
                      {(expandedSection === 'type' || window.innerWidth >= 768) && (
                         <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-6 pt-4 overflow-hidden"
                         >
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Type size={12} className="text-neutral-400" />
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Typeface</span>
                                  </div>
                                  <select 
                                    value={fontFamily}
                                    onChange={e => setFontFamily(e.target.value)}
                                    className="w-full h-10 rounded-xl bg-neutral-50 border-none text-[10px] font-bold uppercase"
                                  >
                                     <option value="Inter">Sans Modern</option>
                                     <option value="'JetBrains Mono'">Tech Mono</option>
                                     <option value="'Playfair Display'">Classic Serif</option>
                                     <option value="Outfit">Geometric</option>
                                     <option value="Space Grotesk">Technical</option>
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Scale</span>
                                    <span className="text-[8px] font-mono text-indigo-500">{Math.round(fontSize * 100)}%</span>
                                  </div>
                                  <input 
                                    type="range" min="0.5" max="1.5" step="0.05"
                                    value={fontSize}
                                    onChange={e => setFontSize(parseFloat(e.target.value))}
                                    className="w-full h-2 accent-indigo-500 bg-neutral-100 rounded-lg appearance-none cursor-pointer mt-4"
                                  />
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Tracking</span>
                                    <span className="text-[8px] font-mono text-indigo-500">{letterSpacing}px</span>
                                  </div>
                                  <input 
                                    type="range" min="-1" max="5" step="0.5"
                                    value={letterSpacing}
                                    onChange={e => setLetterSpacing(parseFloat(e.target.value))}
                                    className="w-full h-2 accent-indigo-500 bg-neutral-100 rounded-lg appearance-none cursor-pointer mt-4"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Leading</span>
                                    <span className="text-[8px] font-mono text-indigo-500">{lineHeight}</span>
                                  </div>
                                  <input 
                                    type="range" min="0.8" max="1.8" step="0.1"
                                    value={lineHeight}
                                    onChange={e => setLineHeight(parseFloat(e.target.value))}
                                    className="w-full h-2 accent-indigo-500 bg-neutral-100 rounded-lg appearance-none cursor-pointer mt-4"
                                  />
                               </div>
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Visuals Section */}
                <div className="border-b border-neutral-50 pb-4">
                   <button 
                      onClick={() => setExpandedSection(expandedSection === 'visuals' ? null : 'visuals')}
                      className="w-full flex items-center justify-between group"
                   >
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">Visual Config</label>
                      <div className={`transition-transform md:hidden ${expandedSection === 'visuals' ? 'rotate-180' : ''}`}>
                         <Plus size={14} className="text-neutral-300" />
                      </div>
                   </button>
                   
                   <AnimatePresence initial={false}>
                      {(expandedSection === 'visuals' || window.innerWidth >= 768) && (
                         <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-6 pt-4 overflow-hidden"
                         >
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Palette size={12} className="text-neutral-400" />
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Main Color</span>
                                  </div>
                                  <input 
                                    type="color" 
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    className="w-full h-10 rounded-xl cursor-pointer bg-neutral-50 border-none"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Layout size={12} className="text-neutral-400" />
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Layout</span>
                                  </div>
                                  <select 
                                    value={layout}
                                    onChange={e => setLayout(e.target.value as any)}
                                    className="w-full h-10 rounded-xl bg-neutral-50 border-none text-[10px] font-bold uppercase"
                                  >
                                     {layouts.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                  </select>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <div className="flex items-center gap-2 mb-1">
                                 <Sparkles size={12} className="text-neutral-400" />
                                 <span className="text-[10px] font-bold uppercase text-neutral-400">Orientation</span>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                  <button 
                                     onClick={() => setOrientation('horizontal')}
                                     className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${orientation === 'horizontal' ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' : 'bg-white border-neutral-100 text-neutral-400'}`}
                                  >
                                     Horizontal
                                  </button>
                                  <button 
                                     onClick={() => setOrientation('vertical')}
                                     className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${orientation === 'vertical' ? 'bg-neutral-900 text-white border-neutral-900 shadow-md' : 'bg-white border-neutral-100 text-neutral-400'}`}
                                  >
                                     Vertical
                                  </button>
                               </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                               <div className="flex items-center gap-2">
                                 <Palette size={12} className="text-neutral-400" />
                                 <span className="text-[10px] font-bold uppercase text-neutral-400 italic">Sync palette with image</span>
                               </div>
                               <button 
                                  onClick={() => setExtractColor(!extractColor)}
                                  className={`w-10 h-5 rounded-full transition-colors relative ${extractColor ? 'bg-indigo-500' : 'bg-neutral-200'}`}
                               >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${extractColor ? 'left-5' : 'left-0.5'}`} />
                               </button>
                            </div>

                            {layout === 'overlay' && (
                               <div className="space-y-4 pt-4 border-t border-neutral-50">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Layout size={12} className="text-neutral-400" />
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">QR/Barcode Position</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                     {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
                                       <button 
                                          key={pos}
                                          onClick={() => setCodePosition(pos)}
                                          className={`h-10 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${codePosition === pos ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-400 border-neutral-100'}`}
                                       >
                                          {pos.replace('-', ' ')}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* Assets Section */}
                <div className="pb-4">
                   <button 
                      onClick={() => setExpandedSection(expandedSection === 'assets' ? null : 'assets')}
                      className="w-full flex items-center justify-between group"
                   >
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 group-hover:text-neutral-900 cursor-pointer">Brand Assets</label>
                      <div className={`transition-transform md:hidden ${expandedSection === 'assets' ? 'rotate-180' : ''}`}>
                         <Plus size={14} className="text-neutral-300" />
                      </div>
                   </button>
                   
                   <AnimatePresence initial={false}>
                      {(expandedSection === 'assets' || window.innerWidth >= 768) && (
                         <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-6 pt-4 overflow-hidden"
                         >
                            <div className="space-y-3">
                               <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-bold uppercase text-neutral-400">Featured Backdrop</span>
                                 {featuredImage && <button onClick={() => setFeaturedImage(null)} className="text-[8px] font-black uppercase text-rose-500">Remove</button>}
                               </div>
                               <button 
                                  onClick={() => featuredImageRef.current?.click()}
                                  className="w-full h-24 border-2 border-dashed border-neutral-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors overflow-hidden group"
                               >
                                  {featuredImage ? (
                                    <img src={featuredImage} alt="featured preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  ) : (
                                    <>
                                      <ImageIcon size={20} className="text-neutral-300" />
                                      <span className="text-[8px] font-bold uppercase text-neutral-400">Select Image</span>
                                    </>
                                  )}
                               </button>
                               <input type="file" ref={featuredImageRef} onChange={handleFeaturedImageUpload} className="hidden" accept="image/*" />
                            </div>

                            <div className="space-y-3">
                               <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-bold uppercase text-neutral-400">Organization Logo</span>
                                 {logo && <button onClick={() => setLogo(null)} className="text-[8px] font-black uppercase text-rose-500">Remove</button>}
                               </div>
                               <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full h-12 border-2 border-dashed border-neutral-100 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                               >
                                  {logo ? <img src={logo} alt="preview" className="h-6 w-6 object-contain" /> : <ImageIcon size={16} className="text-neutral-300" />}
                                  <span className="text-[10px] font-bold uppercase text-neutral-400 truncate max-w-[150px]">{logo ? 'Logo Uploaded' : 'Select Logo'}</span>
                               </button>
                               <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                            </div>

                            <div className="space-y-3">
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-3">Validator</span>
                               <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => setCodeType('qr')} className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${codeType === 'qr' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-neutral-100 text-neutral-400'}`}>QR Engine</button>
                                  <button onClick={() => setCodeType('barcode')} className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${codeType === 'barcode' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-neutral-100 text-neutral-400'}`}>Barcode</button>
                               </div>
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>

             <button 
                onClick={bulkMode ? handleBulkGenerate : handleSaveAndPrint}
                disabled={loading}
                className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl ${success ? 'bg-emerald-500 text-white' : 'bg-neutral-900 text-white hover:bg-black'}`}
             >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : success ? <Check size={20} /> : (bulkMode ? <ListChecks size={20} /> : <Save size={20} />)}
                {loading ? 'Processing...' : success ? 'Auth Successful' : (bulkMode ? 'Bulk Generate' : 'Generate & Deploy')}
             </button>
          </div>

          {/* Tips Card for Desktop */}
          <div className="hidden lg:block bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-600/20">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <h4 className="text-xl font-black uppercase italic mb-4">Pro Insight</h4>
             <p className="text-indigo-100 text-xs font-medium leading-relaxed opacity-80 mb-6">
                Use high-contrast colors for QR readability. The "Overlay" engine works best with pre-designed 5.5x2 inch templates.
             </p>
             <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                <Shield size={14} />
                <span>Encrypted Asset Delivery</span>
             </div>
          </div>
        </div>

        {/* Live Preview Block */}
        <div className={`md:col-span-7 lg:col-span-8 flex flex-col items-center ${activeMobileTab === 'edit' ? 'hidden md:flex' : 'flex'}`}>
           <div className="w-full flex items-center justify-between mb-6 bg-neutral-900 p-4 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full shrink-0">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Monitor</span>
                </div>
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Canvas: {orientation.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={handleExportImage}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 group"
                 >
                    <Download size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest font-mono">PNG</span>
                 </button>
                 <button 
                    onClick={() => handlePrint()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 group"
                 >
                    <Printer size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">Print</span>
                 </button>
              </div>
           </div>

           <div className={`w-full min-h-[450px] md:min-h-[600px] bg-neutral-50 rounded-[3rem] border border-neutral-100 shadow-inner flex items-center justify-center p-4 md:p-12 relative overflow-hidden group/workspace transition-all
             ${orientation === 'vertical' ? 'h-[800px] md:h-[900px]' : ''}`}>
               {/* Grid Pattern Background for Workspace */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
               
               <div className={`w-full perspective-1000 flex justify-center ${orientation === 'vertical' ? 'overflow-auto md:overflow-visible h-full items-start md:items-center pt-4 md:pt-0' : ''}`}>
               <motion.div 
                  ref={ticketRef}
                  className={`mx-auto rounded-[1.25rem] md:rounded-[1.5rem] overflow-hidden shadow-2xl flex transition-all duration-300 relative
                    ${orientation === 'horizontal' 
                       ? 'w-full max-w-[320px] md:max-w-3xl aspect-[5.5/2] flex-row scale-[0.9] md:scale-100' 
                       : 'w-[260px] h-[720px] md:w-[280px] md:h-[770px] flex-col scale-[0.7] md:scale-100 origin-top'
                    }
                    ${layout === 'vintage' ? 'bg-[#fdfbf7] border-4 border-[#8B4513]/20 font-serif' : 
                     layout === 'neon' ? 'bg-[#0a0a0a] border border-[#00f3ff]/30 text-[#00f3ff]' : 
                     layout === 'brutalist' ? 'bg-white border-4 border-black shadow-[12px_12px_0_0_#000] rounded-none' : 
                     layout === 'elegant' ? 'bg-[#ffffff] border border-neutral-100' : 
                     layout === 'overlay' ? 'bg-neutral-100' : 'bg-white border border-neutral-100'}`}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}em`,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight
                  }}
               >
                  {/* Overlay Mode Content */}
                  {layout === 'overlay' ? (
                    <div className="absolute inset-0 z-0">
                       {featuredImage ? (
                         <img src={featuredImage} alt="base design" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-2 border-4 border-dashed border-neutral-200">
                           <ImageIcon size={48} />
                           <span className="text-xs font-black uppercase tracking-widest">Upload base design image</span>
                         </div>
                       )}
                       
                        <div className={`absolute z-20 group transition-all duration-300
                         ${codePosition === 'bottom-right' ? 'bottom-4 right-4 md:bottom-8 md:right-8' : 
                           codePosition === 'bottom-left' ? 'bottom-4 left-4 md:bottom-8 md:left-8' : 
                           codePosition === 'top-right' ? 'top-4 right-4 md:top-8 md:right-8' : 'top-4 left-4 md:top-8 md:left-8'}`}>
                          <div className="p-2 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-2xl border border-white/50 group-hover:scale-110 transition-transform">
                             {codeType === 'qr' ? (
                               <QRCodeCanvas value="TKT-SAMPLE-PROTOTYPE" size={80} level="H" fgColor="#000000" className="w-12 h-12 md:w-24 md:h-24" />
                             ) : (
                               <div className="flex flex-col items-center">
                                 <Barcode value="TKT-SAMPLE-CODE" width={0.4} height={15} displayValue={false} font="Inter" />
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ) : (
                    <>
                      {/* Background Featured Image */}
                      {featuredImage && useBackgroundImage && (
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                           <img src={featuredImage} alt="bg" className="w-full h-full object-cover grayscale" />
                        </div>
                      )}

                      {/* Featured Image Section (Modern/Selected Styles) */}
                      {featuredImage && !useBackgroundImage && (layout === 'modern' || layout === 'neon' || layout === 'elegant') && (
                         <div className={`${orientation === 'horizontal' ? 'w-32' : 'h-48' } shrink-0 overflow-hidden relative z-10`}>
                            <img src={featuredImage} alt="featured" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                         </div>
                      )}

                      {/* Left/Top Stub / Header Stripe */}
                      <div className={`shrink-0 flex items-center justify-center transition-colors duration-500 z-10
                         ${orientation === 'horizontal' ? 'w-full md:w-[15%]' : 'w-full h-[15%]'}
                         ${layout === 'brutalist' ? (orientation === 'horizontal' ? 'border-r-4 border-black bg-white' : 'border-b-4 border-black bg-white') : ''}`} 
                         style={{ backgroundColor: layout === 'brutalist' ? undefined : (layout === 'neon' ? '#00f3ff22' : color) }}>
                         <div className={`${orientation === 'horizontal' ? 'md:-rotate-90 md:whitespace-nowrap' : ''} flex items-center gap-3`}>
                            <span className={`text-[10px] font-black uppercase tracking-[0.5em] 
                              ${layout === 'neon' ? 'text-[#00f3ff]' : layout === 'brutalist' ? 'text-black' : 'text-white'} opacity-80`}>
                              {ticketType}
                            </span>
                         </div>
                      </div>

                      {/* Main Content */}
                      <div className={`flex-1 p-3 md:p-5 flex flex-col justify-between z-10 ${layout === 'neon' ? 'text-[#00f3ff]' : ''} space-y-2 md:space-y-4`}>
                         <div className="flex flex-row items-start justify-between gap-4">
                            <div className="space-y-2 max-w-sm">
                               {logo && <img src={logo} alt="logo" className={`h-10 w-10 object-cover rounded-full mb-4 ${layout === 'neon' ? 'brightness-150 border border-[#00f3ff]' : 'filter grayscale border-2 border-neutral-100'}`} />}
                               <h2 className={`${orientation === 'vertical' ? 'text-lg md:text-xl' : 'text-sm md:text-3xl'} font-black tracking-tight leading-tight uppercase italic truncate max-w-[200px] md:max-w-none
                                 ${layout === 'vintage' ? 'font-serif normal-case italic text-[#2c1810]' : 
                                   layout === 'neon' ? 'text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] font-mono' : 
                                   layout === 'brutalist' ? 'font-black tracking-tighter text-black' : 
                                   layout === 'elegant' ? 'font-serif tracking-normal normal-case text-neutral-900' : 'text-neutral-900'}`}>
                                 {eventTitle}
                               </h2>
                               <div className="flex flex-col gap-1">
                                  <div className={`flex items-center gap-2 font-bold text-[8px] uppercase tracking-widest ${layout === 'neon' ? 'text-[#00f3ff]/60' : 'text-neutral-400'}`}>
                                     <MapPin size={10} className={layout === 'neon' ? 'text-[#00f3ff]' : 'text-rose-500'} />
                                     {venue}
                                  </div>
                                  <div className={`flex items-center gap-2 font-bold text-[8px] uppercase tracking-widest ${layout === 'neon' ? 'text-[#00f3ff]/60' : 'text-neutral-400'}`}>
                                     <Calendar size={10} className={layout === 'neon' ? 'text-[#00f3ff]' : 'text-indigo-500'} />
                                     {date} @ {time}
                                  </div>
                               </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 text-right">
                               <span className={`text-[8px] font-black uppercase tracking-widest ${layout === 'neon' ? 'text-[#00f3ff]/40' : 'text-neutral-300'}`}>Cost</span>
                               <span className={`${orientation === 'vertical' ? 'text-base md:text-lg' : 'text-xs md:text-2xl'} font-black tracking-tighter italic ${layout === 'neon' ? 'text-[#00f3ff]' : 'text-neutral-900'}`}>UGX {price}</span>
                            </div>
                         </div>

                         <div className={`pt-4 border-t flex flex-row items-end justify-between gap-4 
                           ${layout === 'neon' ? 'border-[#00f3ff]/20' : 'border-neutral-100'}
                           ${layout === 'brutalist' ? 'border-black border-t-4' : ''}`}>
                            <div className="space-y-2">
                               <div className="flex flex-col">
                                  <span className={`text-[7px] font-black uppercase tracking-[0.3em] mb-1 ${layout === 'neon' ? 'text-[#00f3ff]/40' : 'text-neutral-400'}`}>Holder</span>
                                <span className={`${orientation === 'vertical' ? 'text-lg' : 'text-base md:text-xl'} font-black tracking-tighter italic ${layout === 'neon' ? 'text-[#00f3ff]' : 'text-neutral-900'} truncate max-w-[120px] md:max-w-none`}>{customerName}</span>
                               </div>
                               <div className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded inline-flex items-center gap-1 md:gap-1.5 
                                  ${layout === 'neon' ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30' : 
                                    layout === 'brutalist' ? 'bg-black text-white rounded-none border-2 border-black' : 
                                    'bg-neutral-900 text-white'}`}>
                                  <Shield size={8} className={layout === 'neon' ? 'text-[#00f3ff]' : 'text-indigo-400'} />
                                  <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest">Verified</span>
                               </div>
                            </div>
                            
                            <div className={`p-1.5 md:p-2 bg-white rounded-xl shadow-xl border border-neutral-50 transition-transform duration-500 group hover:scale-[1.05] mb-1 mr-1 md:mb-2 md:mr-2
                              ${layout === 'neon' ? 'bg-black border border-[#00f3ff]/30 shadow-[0_0_20px_rgba(0,243,255,0.2)]' : 
                                layout === 'brutalist' ? 'bg-white border-4 border-black rounded-none shadow-none' : ''}`}>
                               {codeType === 'qr' ? (
                                 <QRCodeCanvas value="TKT-SAMPLE-PROTOTYPE" size={orientation === 'vertical' ? 60 : 70} level="H" fgColor={layout === 'neon' ? '#00f3ff' : '#000000'} bgColor={layout === 'neon' ? '#000000' : '#ffffff'} className="w-12 h-12 md:w-16 md:h-16" />
                               ) : (
                                 <div className="flex flex-col items-center">
                                   <Barcode value="TKT-SAMPLE-CODE" width={0.4} height={15} displayValue={false} font="Inter" lineColor={layout === 'neon' ? '#00f3ff' : color} background={layout === 'neon' ? 'transparent' : '#ffffff'} />
                                   <span className={`text-[4px] md:text-[6px] font-mono mt-0.5 opacity-40 ${layout === 'neon' ? 'text-[#00f3ff]' : ''}`}>AUTO-UID</span>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    </>
                  )}

                 {/* Perforation Effect */}
                 {orientation === 'horizontal' && (
                    <>
                      <div className="hidden md:block absolute left-[15%] top-0 bottom-0 w-px border-l-2 border-dashed border-neutral-200" />
                      <div className="hidden md:block absolute left-[15%] top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                      <div className="hidden md:block absolute left-[15%] top-0 -mt-2.5 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                      <div className="hidden md:block absolute left-[15%] bottom-0 -mb-2.5 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                    </>
                 )}
                 {orientation === 'vertical' && (
                   <>
                      <div className="absolute left-0 right-0 top-[15%] h-px border-t-2 border-dashed border-neutral-200" />
                      <div className="absolute left-1/2 -translate-x-1/2 top-[15%] -mt-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                      <div className="absolute left-0 top-[15%] -mt-2.5 -ml-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
                      <div className="absolute right-0 top-[15%] -mt-2.5 -mr-2.5 w-5 h-5 bg-neutral-50 rounded-full shadow-inner" />
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
                 <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-tight">Persistence Protocol Ready</span>
              </div>
              <div className="card p-4 flex flex-col items-center gap-2 text-center bg-white/50 backdrop-blur-sm">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <Shield size={16} />
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-tight">Fraud Detection Active</span>
              </div>
              <div className="card p-4 flex flex-col items-center gap-2 text-center bg-white/50 backdrop-blur-sm">
                 <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                    <X size={16} />
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-tight">One-Time Scannable</span>
              </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}
