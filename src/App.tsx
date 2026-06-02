import React, { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, LayoutGrid, Settings, HelpCircle, Menu, X, QrCode, Barcode, Camera, Sparkles, Repeat, Shield, Users, FileText, Mic, LogOut, FileImage, Globe, Tickets, Home as HomeIcon, Search as SearchIcon, Terminal, Brackets, Zap, Receipt, Store, Printer } from 'lucide-react';
import Home from './components/Home.tsx';
import QRBuilder from './components/tools/QRBuilder.tsx';
import BarcodeBuilder from './components/tools/BarcodeBuilder.tsx';
import Scanner from './components/tools/Scanner.tsx';
import UnitConverter from './components/tools/UnitConverter.tsx';
import PassGen from './components/tools/PassGen.tsx';
import PhoneSorter from './components/tools/PhoneSorter.tsx';
import TicketingTool from './components/tools/TicketingTool.tsx';
import OcrTool from './components/tools/OcrTool.tsx';
import LukuPredictor from './components/tools/LukuPredictor.tsx';
import ReceiptLab from './components/tools/ReceiptLab.tsx';
import MoMoIntelligence from './components/tools/MoMoIntelligence.tsx';
import DukaSyncView from './components/DukaSyncView.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import SettingsView from './components/SettingsView.tsx';
import EventRegistration from './components/tools/EventRegistration.tsx';

import { useAuth } from './contexts/AuthContext.tsx';
import LoginOverlay from './components/ui/LoginOverlay.tsx';
import VipGate from './components/ui/VipGate.tsx';
import BroadcastBanner from './components/ui/BroadcastBanner.tsx';
import PwaHandler from './components/PwaHandler.tsx';
import { User as UserIcon, Smartphone } from 'lucide-react';

const PREMIUM_VIEWS: string[] = ['luku-predictor', 'receipt-lab', 'momo-intelligence', 'duka-sync'];

type View = 'home' | 'qr-builder' | 'barcode-builder' | 'scanner' | 'converter' | 'vault' | 'phone-sorter' | 'ticketing' | 'ocr-tool' | 'luku-predictor' | 'receipt-lab' | 'momo-intelligence' | 'settings' | 'admin' | 'duka-sync' | 'event-register';

const ViewSEO: Record<View, { title: string; description: string; keywords: string; ogTitle: string; ogDescription: string }> = {
  home: {
    title: "Aether Pro | Elite Retail Utilities & Shop Management Protocol",
    description: "Distributed privacy-first platform featuring DukaSync inventory protocol, Receipt Lab POS, Events & Mobile pass registration, MoMo wallet calculations, Luku meter forecasters, OCR scanners, and more.",
    keywords: "Aether Pro, retail utilities, Duka sync, POS designer, digital bills, OCR scanner, ticketing, commerce suite",
    ogTitle: "Aether Pro | Premium Commerce & Retail Protocol",
    ogDescription: "Distributed suite of elegant, privacy-first retail tools for inventory, printing layouts, and secure token issuance."
  },
  'duka-sync': {
    title: "Duka Sync | Real-time Shop Stock & Multi-terminal Inventory Protocol",
    description: "Synchronize inventory seamlessly. Manage global ledger entries, local currencies, live supplier checklists, active checkouts, and store performance reports.",
    keywords: "DukaSync, stock tracking, shop sync, POS inventory database, merchant reports, store protocol",
    ogTitle: "Duka Sync | Distributed Stock & Shop Protocol",
    ogDescription: "Distributed inventory protocol for high-performance retail shops. Zero lag, zero clutter, real-time sync with advanced local analytics."
  },
  'ticketing': {
    title: "Verifiable Ticket Token Protocol | Aether Pro Events",
    description: "Create local events, issue cryptographic entry cards, distribute access keys, track registrations, and stream live participant checklists.",
    keywords: "qr pass, security checks, events tickets tool, gate control planner, ticket tokens, live checkin feed",
    ogTitle: "Aether Events | Verifiable Ticket Issuance Engine",
    ogDescription: "Generate secure QR passes, map attendee seat registers, and manage event admissions smoothly."
  },
  'receipt-lab': {
    title: "Receipt Lab POS Printer | Commercial Formatting & Digital Billing",
    description: "Point-of-sale receipt formatting panel. Customize paper layouts, specify VAT parameters, format print guides, and update catalog items.",
    keywords: "receipt lab, pos receipts, tax item overrides, billing list, product invoice formatting, printer tools",
    ogTitle: "Receipt Lab POS | Custom Print Formatting Assistant",
    ogDescription: "Fast professional receipt design and printer layout manager. Customize store details, line items, and print formats."
  },
  'momo-intelligence': {
    title: "MoMo Pay Fee Intelligence | Mobile Money Multi-Network charges Calculator",
    description: "Check transaction cost metrics for mobile wallets. Determine cellular network transfer rates, charges, and withdrawal fees for MTN & Airtel instantly.",
    keywords: "momo cost check, mobile transfer charges, cash out fees MTN, transaction rate check",
    ogTitle: "MoMo Fee Intelligence | Transaction Rate Calculator",
    ogDescription: "Calculate accurate sending and withdrawal fees across top mobile transaction networks."
  },
  'luku-predictor': {
    title: "Luku Energy Cost Estimator | Prepaid Power Foresight Panel",
    description: "Keep tracking prepaid power consumption, schedule next token replenishment sequences, and avoid unexpected blackout outages.",
    keywords: "luku tokens, electricity predictor, prepaid energy, cost estimator, budget utility planner",
    ogTitle: "Luku Energy Cost Predictor | Smart Utility Forecasts",
    ogDescription: "Avoid blackout surprises. Forecast utility depletion schedules based on current token loads."
  },
  'ocr-tool': {
    title: "Printed Document OCR Scanner | Local Image Text Extractor",
    description: "Fast local image text converter. Scan supplier papers, hand-written tables, printed bills, and catalogs directly into database-ready lists.",
    keywords: "smart ocr reader, raw image text, instant character scan, document digitizer, local privacy",
    ogTitle: "Smart OCR | Local Document Digitization Scanner",
    ogDescription: "High-speed local image text extractor. Convert receipts, stock notes, and tables into copyable texts."
  },
  'scanner': {
    title: "Universal Stock Scanner | In-Browser Barcode & QR Code Reader",
    description: "Scan packaging barcodes, item identifiers, and transaction QR keys directly using standard camera systems in your web browser.",
    keywords: "web camera scanner, scan qr code, barcode scanner inline, item tracker, camera scanner interface",
    ogTitle: "Universal Stock Scanner | Instant Code Scanner",
    ogDescription: "Turn any browser into a rapid industrial scanner. Instant detection for inventory barcode and payment key tracking."
  },
  'qr-builder': {
    title: "Brand QR Code Builder | Vector QR Code Customizer Portal",
    description: "Establish custom high-contrast QR codes with custom eye elements, patterns, brand-matching palettes, and secure logo embeds.",
    keywords: "custom stylized qr, branding qr generator, vector barcode builder, dynamic qr code designer",
    ogTitle: "Brand QR Protocol | Stylized Code Designer",
    ogDescription: "Craft high-trust vector QR codes with customized patterns, brand-matching palettes, and secure embeds."
  },
  'barcode-builder': {
    title: "Inventory Labels Builder | Standard Barcode Generator Assistant",
    description: "Assemble modern retail EAN-13, EAN-8, UPC, and Code 128 barcodes. Prepare print-ready labels for shop shelves and box tagging.",
    keywords: "barcode designer, product codes, labels prints format, shelf catalog tags, tag prints",
    ogTitle: "Barcode Labels Protocol | Professional Retail Barcodes",
    ogDescription: "Generate standard retail barcode shapes ready for catalog printing and industrial shelf tagging."
  },
  'converter': {
    title: "Trade Metrics Converter | Commercial Weights & Units Calculator",
    description: "Instant unit scaling for international commerce. Convert metric sizes, shipping weights, and standard packaging scales accurately.",
    keywords: "metrics weights converter, volumetric scale, trade checks, merchant scales, unit conversion charts",
    ogTitle: "Trade Metrics Converter | Fast Units Normalizer",
    ogDescription: "Accurate industrial metric and unit scale conversions for shop inventory and product lists."
  },
  'phone-sorter': {
    title: "Numbers Intelligence | Campaign Contact List Sorter",
    description: "Sort, split, de-duplicate, format, and validate customer mobile number lists to ensure flawless SMS notifications.",
    keywords: "marketing list cleaner, phone contact analyzer, customer database deduplicate, notification dispatch check",
    ogTitle: "Numbers Sorter Intelligence | Bulk List Optimizer",
    ogDescription: "Format and sort massive customer contact phone sheets for maximum marketing performance."
  },
  'vault': {
    title: "Security Secret Vault | Offline Strong Key Generator",
    description: "Hardened local key generator and credential vault. Standard encryption key metrics to shield enterprise access.",
    keywords: "local password locker, crypt key maker, credential armor, offline vault codes, master vault settings",
    ogTitle: "Security Vault | Offline High-Entropy Locker",
    ogDescription: "Privacy-first offline credential generator. Safeguard merchant passwords and system entry passwords secure."
  },
  'settings': {
    title: "Profile Preferences | Aether Pro Shop Panel Settings",
    description: "Control defaults currency parameters, configure printer layouts, trigger local backup exports, and switch dark theme modes.",
    keywords: "custom backup setting, aether defaults options, secure config backup, theme toggle",
    ogTitle: "Aether Pro Preferences | System Settings",
    ogDescription: "Control POS preferences, active print scales, database backups, and personalized themes."
  },
  'admin': {
    title: "Operations Admin Dashboard | System Management Center",
    description: "Audit action events, manage active network broadcasts, monitor datastore telemetry, and inspect administrator privileges.",
    keywords: "status checks, broadcast banners, event auditor, supervisor dashboard",
    ogTitle: "Operations Admin Control Center | Aether Pro Core Panel",
    ogDescription: "Privileged operational control, real-time activity audits, and dynamic announcement dispatch."
  },
  'event-register': {
    title: "Event Pass Registry | Custom Ticket Issuance Page",
    description: "Claim your pass token for check-in. Pre-register passenger slots, view seat charts, and save beautiful code images.",
    keywords: "attendee ticket checkin, pass ticket save, custom invitation details, register admission",
    ogTitle: "Event Pass Check-in Register | Elite Pass Issuance",
    ogDescription: "Claim event check-in credentials. Instant downloadable security passes for rapid door verification."
  }
};

const navItems: { id: View; label: string; icon: any; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Home', icon: LayoutGrid },
  { id: 'duka-sync', label: 'DukaSync', icon: Store },
  { id: 'ticketing', label: 'Events', icon: Tickets },
  { id: 'receipt-lab', label: 'POS', icon: Receipt },
  { id: 'momo-intelligence', label: 'MoMo', icon: Smartphone },
  { id: 'luku-predictor', label: 'Energy', icon: Zap },
  { id: 'ocr-tool', label: 'OCR', icon: FileText },
  { id: 'scanner', label: 'Scanner', icon: Camera },
  { id: 'qr-builder', label: 'QR', icon: QrCode },
  { id: 'barcode-builder', label: 'Barcode', icon: Barcode },
  { id: 'converter', label: 'Units', icon: Repeat },
  { id: 'phone-sorter', label: 'Intel', icon: Users },
  { id: 'vault', label: 'Vault', icon: Shield },
  { id: 'admin', label: 'Admin', icon: Shield, adminOnly: true },
];

const getInitialView = (): View => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '');
  const baseView = hash.split('?')[0];
  if (baseView === 'event-register' || baseView === 'register') {
    return 'event-register';
  }
  if (hash && navItems.some(item => item.id === hash)) {
    return hash as View;
  }
  return 'home';
};

export default function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [currentView, setCurrentView] = useState<View>(getInitialView());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVipGate, setShowVipGate] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const { user, login, logout, loading, isVip, isAdmin } = useAuth();

  // Notification on-demand and Hash Sync setup
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const baseView = hash.split('?')[0];
      if (baseView === 'event-register' || baseView === 'register') {
        setCurrentView('event-register');
      } else if (hash && navItems.some(item => item.id === hash)) {
        setCurrentView(hash as View);
      } else if (!hash || hash === '') {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: string) => {
    if (view !== 'home' && user) {
      const toolName = navItems.find(i => i.id === view)?.label || view;
      import('./services/activityService').then(m => m.logActivity(user.uid, view, toolName));
    }

    if (PREMIUM_VIEWS.includes(view)) {
      if (!user) {
        setShowLogin(true);
        return;
      }
      if (!isVip) {
        setPendingView(view as View);
        setShowVipGate(true);
        return;
      }
    }

    // Update Hash instead of just state
    window.location.hash = view === 'home' ? '' : `/${view}`;
    setCurrentView(view as View);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1] 
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mb-8"
        >
          <img src="/logo.svg" alt="Aether Pro Logo" className="w-full h-full drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900">Aether</h2>
          <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    // If user is not logged in and is not on home, event-register, ticketing, or explicitly showing login, show login overlay
    if (!user && (currentView !== 'home' && currentView !== 'event-register' && currentView !== 'ticketing' || showLogin)) {
      return <LoginOverlay onClose={() => setShowLogin(false)} />;
    }

    return (
      <>
        <AnimatePresence>
          {showVipGate && (
            <VipGate 
              toolName={navItems.find(i => i.id === (pendingView || currentView))?.label || 'Premium Tool'} 
              onUnlocked={() => {
                if (pendingView) {
                  setCurrentView(pendingView);
                  setPendingView(null);
                }
                setShowVipGate(false);
              }}
              onClose={() => {
                setShowVipGate(false);
                setPendingView(null);
              }}
            />
          )}
        </AnimatePresence>
        {(() => {
          switch (currentView) {
            case 'home':
              return <Home onSelectTool={navigateTo} />;
            case 'qr-builder':
              return <QRBuilder />;
            case 'barcode-builder':
              return <BarcodeBuilder />;
            case 'scanner':
              return <Scanner />;
            case 'converter':
              return <UnitConverter />;
            case 'vault':
              return <PassGen />;
            case 'phone-sorter':
              return <PhoneSorter />;
            case 'luku-predictor':
              return <LukuPredictor />;
            case 'momo-intelligence':
              return <MoMoIntelligence />;
            case 'duka-sync':
              return <DukaSyncView />;
            case 'receipt-lab':
              return <ReceiptLab />;
            case 'ticketing':
              return <TicketingTool />;
            case 'event-register':
              return <EventRegistration />;
            case 'ocr-tool':
              return <OcrTool />;
            case 'settings':
              return <SettingsView />;
            case 'admin':
              return <AdminDashboard />;
            default:
              return <Home onSelectTool={navigateTo} />;
          }
        })()}
      </>
    );
  };

  const filteredNavItems = navItems.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAdmin = !item.adminOnly || isAdmin;
    return matchesSearch && matchesAdmin;
  });

  const currentSEO = ViewSEO[currentView] || ViewSEO.home;

  return (
    <>
      <Head>
        <title key="title">{currentSEO.title}</title>
        <meta name="description" content={currentSEO.description} key="description" />
        <meta name="keywords" content={currentSEO.keywords} key="keywords" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={currentSEO.ogTitle} key="og:title" />
        <meta property="og:description" content={currentSEO.ogDescription} key="og:description" />
        <meta property="og:url" content={`https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/#/${currentView === 'home' ? '' : currentView}`} key="og:url" />
        <meta property="og:image" content="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/logo.svg" key="og:image" />
        
        {/* Twitter */}
        <meta name="twitter:title" content={currentSEO.title} key="twitter:title" />
        <meta name="twitter:description" content={currentSEO.description} key="twitter:description" />
        <meta name="twitter:image" content="https://ais-pre-puqew7udmfr5wk5fq7wy2v-436861249101.europe-west1.run.app/logo.svg" key="twitter:image" />
      </Head>
      <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa] dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${isSidebarExpanded ? 'w-72' : 'w-24'} bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out`}>
        <div className={`p-8 flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} gap-4`}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="w-12 h-12 flex items-center justify-center shrink-0 transform hover:scale-105 transition-transform">
               <img src="/logo.svg" alt="Logo" className="w-full h-full" />
            </div>
            {isSidebarExpanded && (
              <div className="flex flex-col">
                <span className="font-black tracking-tighter text-2xl uppercase leading-none dark:text-white">AETHER</span>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mt-1">Experimental</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all text-neutral-400 ${!isSidebarExpanded ? 'hidden' : ''}`}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {!isSidebarExpanded && (
          <div className="flex justify-center mb-6">
            <button 
              onClick={() => setIsSidebarExpanded(true)}
              className="p-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl shadow-lg"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        {/* Desktop Search */}
        {isSidebarExpanded && (
          <div className="px-6 mb-4 hidden lg:block">
             <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                   <SearchIcon size={14} />
                </div>
                <input 
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-200 dark:focus:border-neutral-700 transition-all text-neutral-900 dark:text-white"
                />
             </div>
          </div>
        )}

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start gap-4 px-4' : 'justify-center'} h-13 rounded-xl transition-all relative group shrink-0 ${
                currentView === item.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl shadow-neutral-900/10 dark:shadow-white/5'
                  : 'text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-900 dark:hover:bg-neutral-800/50 dark:hover:text-white'
              }`}
              title={!isSidebarExpanded ? item.label : ''}
            >
              <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} className={`shrink-0 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {isSidebarExpanded && (
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              )}
              
              {currentView === item.id && isSidebarExpanded && (
                <motion.div 
                  layoutId="active-indicator" 
                  className="absolute right-2 w-1.5 h-1.5 bg-white dark:bg-neutral-900 rounded-full" 
                />
              )}
            </button>
          ))}
          {filteredNavItems.length === 0 && isSidebarExpanded && (
            <div className="py-8 text-center px-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No tools found</p>
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          {user && (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start gap-4 px-4' : 'justify-center'} h-12 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold`}
              title={!isSidebarExpanded ? 'Logout' : ''}
            >
              <LogOut size={20} strokeWidth={2.5} />
              {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest">Logout</span>}
            </button>
          )}
          <button 
            onClick={() => navigateTo('settings')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start gap-4 px-4' : 'justify-center'} h-12 rounded-2xl transition-all ${
              currentView === 'settings' 
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
              : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
            title={!isSidebarExpanded ? 'Settings' : ''}
          >
            <Settings size={20} />
            {isSidebarExpanded && <span className="text-xs font-bold uppercase tracking-widest">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <BroadcastBanner />
        {/* Mobile Nav / Top Header */}
        <header className="sticky top-0 z-40 glass border-b border-neutral-200/50 px-4 md:px-8 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateTo('home')}
              className={`p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors group md:hidden ${currentView === 'home' ? 'hidden' : ''}`}
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform dark:text-white" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xs md:text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white truncate max-w-[120px] md:max-w-none">
                {navItems.find(i => i.id === currentView)?.label || 'Aether Pro'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Search Header */}
            <div className="hidden lg:flex items-center mr-2">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Universal Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 h-9 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-lg pl-8 pr-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:w-56 transition-all text-neutral-900 dark:text-white"
                />
                <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>

              {user ? (
                 <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end hidden lg:flex">
                      <div className="flex items-center gap-1">
                        {isVip && <Sparkles size={10} className="text-rose-600" />}
                        <span className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest leading-none">{user.displayName?.split(' ')[0]}</span>
                      </div>
                      <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter">{isVip ? 'Pro Elite Member' : 'Standard Tier'}</span>
                    </div>
                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-10 h-10 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-center justify-center overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={18} className="text-neutral-400" />
                    )}
                  </button>
               </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="btn-primary h-10 px-4 flex items-center gap-2 rounded-xl"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
              </button>
            )}
            <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
              <HelpCircle size={18} />
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors dark:text-white"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-8 md:px-16 md:py-20 pb-32 md:pb-20 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-7xl"
            >
              {renderView()}
              
              {!isAdmin && currentView !== 'home' && (
                <div className="mt-12 md:mt-20 border-t border-neutral-100 dark:border-neutral-800 pt-8 md:pt-12">
                   <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 opacity-30">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Intelligence Node</span>
                        <div className="w-1 h-1 bg-neutral-400 rounded-full" />
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile App Bottom Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-t border-neutral-200 dark:border-neutral-900 flex items-center justify-around px-8 z-50 pb-safe">
           <button 
             onClick={() => navigateTo('home')}
             className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'home' ? 'text-rose-600' : 'text-neutral-400'}`}
           >
             <HomeIcon size={20} strokeWidth={currentView === 'home' ? 3 : 2} />
             <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
           </button>
           
           <button 
             onClick={() => setIsMenuOpen(true)}
             className={`flex flex-col items-center gap-1.5 transition-all ${isMenuOpen ? 'text-rose-600' : 'text-neutral-400'}`}
           >
             <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center -mt-10 shadow-2xl shadow-black/20 text-white dark:text-neutral-900 transition-transform active:scale-90">
                <LayoutGrid size={24} />
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest mt-1">Tools</span>
           </button>
 
           <button 
             onClick={() => navigateTo('settings')}
             className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'settings' ? 'text-rose-600' : 'text-neutral-400'}`}
           >
             <Settings size={20} strokeWidth={currentView === 'settings' ? 3 : 2} />
             <span className="text-[8px] font-black uppercase tracking-widest">Settings</span>
           </button>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsMenuOpen(false)}
               className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={{ type: 'spring', damping: 30, stiffness: 300 }}
               className="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-neutral-900 shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src="/logo.svg" alt="Logo" className="w-full h-full" />
                  </div>
                  <span className="font-black tracking-tighter text-xl uppercase dark:text-white">AETHER</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full dark:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search - In Sidebar */}
              <div className="mb-6 relative">
                 <input 
                   type="text"
                   placeholder="Search tools..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full h-12 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-2xl pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5 transition-all text-neutral-900 dark:text-white"
                 />
                 <LayoutGrid size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>

              <div className="space-y-1 overflow-y-auto flex-1">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-4 px-4 h-14 rounded-2xl transition-all ${
                      currentView === item.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl shadow-neutral-900/10'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-800/10 dark:hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
                {filteredNavItems.length === 0 && (
                  <div className="py-12 text-center opacity-40">
                    <LayoutGrid size={40} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Tools Found</p>
                  </div>
                )}
              </div>

              {user && (
                <div className="mt-auto pt-6 border-t border-neutral-100">
                  <button 
                    onClick={() => {
                        setIsMenuOpen(false);
                        setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-4 px-4 h-14 rounded-2xl text-rose-600 font-bold transition-all"
                  >
                    <LogOut size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Logout Session</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-auto md:bottom-8 md:right-8 pointer-events-none z-40">
          <div className="flex items-center gap-2 p-3 bg-white border border-neutral-200 shadow-sm rounded-full px-4 w-fit mx-auto md:ml-auto">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Live Services</span>
          </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800"
            >
              <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-8 mx-auto">
                <LogOut className="text-rose-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-center uppercase tracking-tighter mb-4 text-neutral-900 dark:text-white">Logout?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-center font-medium text-sm mb-10 leading-relaxed">
                Are you sure you want to log out of your session?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    await logout();
                    setShowLogoutConfirm(false);
                  }}
                  className="w-full h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
                >
                  Logout
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full h-14 bg-neutral-100 text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors"
                >
                  Stay Connected
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <PwaHandler />
    </div>
    </>
  );
}

