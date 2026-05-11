import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, LayoutGrid, Settings, HelpCircle, Menu, X, QrCode, Barcode, Camera, Sparkles, Repeat, Shield, Users, FileText, Mic, LogOut, FileImage, Globe, Tickets, Home as HomeIcon, Search as SearchIcon, Terminal } from 'lucide-react';
import Home from './components/Home.tsx';
import QRBuilder from './components/tools/QRBuilder.tsx';
import BarcodeBuilder from './components/tools/BarcodeBuilder.tsx';
import Scanner from './components/tools/Scanner.tsx';
import UnitConverter from './components/tools/UnitConverter.tsx';
import PassGen from './components/tools/PassGen.tsx';
import PhoneSorter from './components/tools/PhoneSorter.tsx';
import DocScanner from './components/tools/DocScanner.tsx';
import FileConverter from './components/tools/FileConverter.tsx';
import ImageCompressor from './components/tools/ImageCompressor.tsx';
import IpIntelligence from './components/tools/IpIntelligence.tsx';
import TicketingTool from './components/tools/TicketingTool.tsx';
import OcrTool from './components/tools/OcrTool.tsx';
import PdfMaster from './components/tools/PdfMaster.tsx';
import PrivacyGuard from './components/tools/PrivacyGuard.tsx';
import DevToolbox from './components/tools/DevToolbox.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import SettingsView from './components/SettingsView.tsx';

import { useAuth } from './contexts/AuthContext.tsx';
import LoginOverlay from './components/ui/LoginOverlay.tsx';
import VipGate from './components/ui/VipGate.tsx';
import BroadcastBanner from './components/ui/BroadcastBanner.tsx';
import AdMobAd from './components/ui/AdMobAd.tsx';
import { User as UserIcon } from 'lucide-react';

const PREMIUM_VIEWS: string[] = ['phone-sorter', 'file-converter', 'image-compressor', 'ip-intelligence', 'ticketing', 'pdf-master'];

type View = 'home' | 'qr-builder' | 'barcode-builder' | 'scanner' | 'converter' | 'vault' | 'phone-sorter' | 'doc-scanner' | 'file-converter' | 'image-compressor' | 'ip-intelligence' | 'ticketing' | 'ocr-tool' | 'pdf-master' | 'privacy-guard' | 'dev-toolbox' | 'settings' | 'admin';

const navItems: { id: View; label: string; icon: any; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Home', icon: LayoutGrid },
  { id: 'admin', label: 'Admin', icon: Shield, adminOnly: true },
  { id: 'ocr-tool', label: 'OCR', icon: FileText },
  { id: 'pdf-master', label: 'PDFs', icon: FileText },
  { id: 'privacy-guard', label: 'Guard', icon: Shield },
  { id: 'ticketing', label: 'Tickets', icon: Tickets },
  { id: 'ip-intelligence', label: 'IP Intel', icon: Globe },
  { id: 'qr-builder', label: 'QR', icon: QrCode },
  { id: 'barcode-builder', label: 'Barcode', icon: Barcode },
  { id: 'scanner', label: 'Scanner', icon: Camera },
  { id: 'doc-scanner', label: 'Scan', icon: FileText },
  { id: 'file-converter', label: 'Convert', icon: Repeat },
  { id: 'image-compressor', label: 'Shrink', icon: FileImage },
  { id: 'converter', label: 'Units', icon: Repeat },
  { id: 'vault', label: 'Vault', icon: Shield },
  { id: 'phone-sorter', label: 'Sort', icon: Users },
  { id: 'dev-toolbox', label: 'Dev', icon: Terminal },
];

const getInitialView = (): View => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash && navItems.some(item => item.id === hash)) {
    return hash as View;
  }
  return 'home';
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>(getInitialView());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showVipGate, setShowVipGate] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [unlockedTools, setUnlockedTools] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const { user, login, logout, loading, isVip, isAdmin } = useAuth();

  // Notification and Hash Sync setup
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash && navItems.some(item => item.id === hash)) {
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
    if (view !== currentView) {
      setUnlockedTools(new Set());
    }

    if (view !== 'home' && user) {
      const toolName = navItems.find(i => i.id === view)?.label || view;
      import('./services/activityService').then(m => m.logActivity(user.uid, view, toolName));
    }

    if (PREMIUM_VIEWS.includes(view) && !isVip && !unlockedTools.has(view)) {
      setPendingView(view as View);
      setShowVipGate(true);
      return;
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
    // If user is not logged in and is not on home or explicitly showing login, show login overlay
    if (!user && (currentView !== 'home' || showLogin)) {
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
                  setUnlockedTools(prev => new Set(prev).add(pendingView));
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
              return <Home onSelectTool={navigateTo} onUnlockAll={() => {
                setUnlockedTools(new Set(PREMIUM_VIEWS));
              }} />;
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
            case 'doc-scanner':
              return <DocScanner />;
            case 'file-converter':
              return <FileConverter />;
            case 'image-compressor':
              return <ImageCompressor />;
            case 'ip-intelligence':
              return <IpIntelligence />;
            case 'ticketing':
              return <TicketingTool />;
            case 'ocr-tool':
              return <OcrTool />;
            case 'pdf-master':
              return <PdfMaster />;
            case 'privacy-guard':
              return <PrivacyGuard />;
            case 'dev-toolbox':
              return <DevToolbox />;
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa] dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0 z-50">
        <div className="p-8 flex items-center justify-center lg:justify-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center shrink-0 transform hover:scale-105 transition-transform cursor-pointer" onClick={() => navigateTo('home')}>
             <img src="/logo.svg" alt="Logo" className="w-full h-full" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-black tracking-tighter text-2xl uppercase leading-none dark:text-white">AETHER</span>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mt-1">Experimental</span>
          </div>
        </div>

        {/* Desktop Search */}
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

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center gap-4 px-4 h-12 rounded-xl transition-all relative group shrink-0 ${
                currentView === item.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl shadow-neutral-900/10 dark:shadow-white/5'
                  : 'text-neutral-500 hover:bg-neutral-100/50 hover:text-neutral-900 dark:hover:bg-neutral-800/50 dark:hover:text-white'
              }`}
            >
              <item.icon size={18} className={`shrink-0 transition-transform ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="hidden lg:block text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-indicator" 
                  className="absolute right-2 w-1 h-1 bg-white rounded-full lg:block hidden" 
                />
              )}
            </button>
          ))}
          {filteredNavItems.length === 0 && (
            <div className="py-8 text-center px-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">No tools found</p>
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          {user && (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 h-12 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold"
            >
              <LogOut size={20} />
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Logout Session</span>
            </button>
          )}
          <button 
            onClick={() => navigateTo('settings')}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 px-4 h-12 rounded-2xl transition-all ${
              currentView === 'settings' 
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
              : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
          >
            <Settings size={20} />
            <span className="hidden lg:block text-xs font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
        <div className="mt-auto px-4 pb-6 hidden lg:block overflow-hidden max-h-[25vh] shrink-0 border-t border-neutral-50 dark:border-neutral-800 pt-4">
           <AdMobAd adSlot="sidebar-bottom" format="vertical" className="h-40" />
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
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Sponsored Intelligence</span>
                        <div className="w-1 h-1 bg-neutral-400 rounded-full" />
                      </div>
                      <AdMobAd adSlot="content-bottom" format="horizontal" className="w-full max-w-4xl h-24 md:h-32" />
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
    </div>
  );
}

