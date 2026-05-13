import React, { useState, useEffect } from 'react';
import { QrCode, ArrowRight, Barcode as BarcodeIcon, Camera, Repeat, Shield, Users, FileText, Clock, Sparkles, Check, Tickets, Zap, Receipt, Smartphone, Link as LinkIcon, Store, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToRecentActivities, Activity } from '../services/activityService';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: (id: string) => void;
  color?: string;
  key?: React.Key;
}

const ToolCard = ({ id, title, description, icon, onClick, color = 'bg-neutral-900' }: ToolCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(id);
        }
      }}
      className="cursor-pointer card group relative flex h-full min-h-[220px] w-full flex-col overflow-hidden border-2 border-neutral-100 dark:border-neutral-800 p-8 text-left transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
         <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-[80px] opacity-10 ${color}`} />
      </div>
      
      <div className="flex items-start justify-between z-10 w-full">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl shadow-lg shadow-black/5 ${color}`}>
          {icon}
        </div>
        <button 
          onClick={copyLink}
          className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          title="Copy direct link"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
        </button>
      </div>
      
      <div className="mt-8 space-y-3 z-10">
        <h3 className="font-black text-2xl group-hover:text-neutral-900 dark:group-hover:text-white transition-colors uppercase tracking-tighter leading-none">{title}</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed font-medium line-clamp-2">{description}</p>
      </div>

      <div className="mt-auto pt-8 flex items-center justify-between z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Launch Tool</span>
        <ArrowRight size={20} className="text-neutral-200 dark:text-neutral-800 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
};

export default function Home({ onSelectTool }: { onSelectTool: (id: string) => void }) {
  const { user, isVip } = useAuth();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToRecentActivities(user.uid, (activities) => {
        setRecentActivities(activities);
      });
      return () => unsubscribe();
    } else {
      setRecentActivities([]);
    }
  }, [user]);

  const categories = [
    { id: 'all', name: 'All Suites', icon: <Sparkles size={14} /> },
    { id: 'finance', name: 'Financial', icon: <Smartphone size={14} /> },
    { id: 'data', name: 'Customer Intelligence', icon: <Users size={14} /> },
    { id: 'ops', name: 'Operations', icon: <Zap size={14} /> },
  ];

  const tools = [
    {
      id: 'duka-sync',
      title: 'Duka Sync',
      description: 'Distributed inventory & shop management. Essential for Aether Pro users.',
      icon: <Store size={24} />,
      color: 'bg-rose-600',
      featured: true,
      category: 'ops',
      vip: true
    },
    {
      id: 'momo-intelligence',
      title: 'MoMo Intelligence',
      description: 'Multi-network (MOBILE MONEY/MTN/Airtel) fee protocol.',
      icon: <Smartphone size={24} />,
      color: 'bg-emerald-500',
      featured: true,
      category: 'finance',
      vip: true
    },
    {
      id: 'phone-sorter',
      title: 'Numbers Intelligence',
      description: 'Clean & sort contact lists for marketing.',
      icon: <Users size={24} />,
      color: 'bg-emerald-600',
      category: 'data',
      vip: true
    },
    {
      id: 'luku-predictor',
      title: 'Luku Energy Predictor',
      description: 'Forecast prepaid power consumption.',
      icon: <Zap size={24} />,
      color: 'bg-yellow-400',
      featured: true,
      category: 'ops',
      vip: true
    },
    {
      id: 'ocr-tool',
      title: 'Smart OCR',
      description: 'Digitize stock lists and receipts.',
      icon: <FileText size={24} />,
      color: 'bg-amber-600',
      category: 'ops'
    },
    {
      id: 'ticketing',
      title: 'Pass Terminal',
      description: 'Deploy secure digital tokens.',
      icon: <Tickets size={24} />,
      color: 'bg-rose-500',
      category: 'ops',
      vip: true
    },
    {
      id: 'qr-builder',
      title: 'Brand QR Protocol',
      description: 'Custom codes for payments/menus.',
      icon: <QrCode size={24} />,
      color: 'bg-indigo-500',
      category: 'ops'
    },
    {
      id: 'barcode-builder',
      title: 'Inventory Labels',
      description: 'Generate standard retail barcodes.',
      icon: <BarcodeIcon size={24} />,
      color: 'bg-neutral-900',
      category: 'ops'
    },
    {
      id: 'scanner',
      title: 'Universal Scanner',
      description: 'Read stock levels and payment codes.',
      icon: <Camera size={24} />,
      color: 'bg-cyan-600',
      category: 'ops'
    },
    {
      id: 'converter',
      title: 'Trade Converter',
      description: 'Standard weights & metrics protocol.',
      icon: <Repeat size={24} />,
      color: 'bg-orange-500',
      category: 'ops'
    },
    {
      id: 'vault',
      title: 'Security Vault',
      description: 'Secure enterprise key generation.',
      icon: <Shield size={24} />,
      color: 'bg-neutral-800',
      category: 'ops'
    }
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900/5 dark:bg-white/5 rounded-full mb-6 text-neutral-500 dark:text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 dark:bg-neutral-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500 dark:bg-neutral-400"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} RELEASE</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 text-neutral-900 dark:text-white leading-[0.85]">
            AETHER <br />
            <span className="text-[#e2e2e2] dark:text-neutral-800">PRO.</span>
          </h1>
          
           <div className="mt-8 relative max-w-xl group">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors">
                <Users size={20} />
             </div>
             <input 
               type="text"
               placeholder="Search tools..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full h-16 bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-3xl pl-16 pr-6 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900 dark:focus:border-white focus:ring-8 focus:ring-neutral-900/5 dark:focus:ring-white/5 transition-all shadow-xl shadow-black/5 dark:shadow-white/5 text-neutral-900 dark:text-white"
             />
          </div>

          {/* Category Navigation */}
          <div className="mt-12 flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${activeCategory === cat.id 
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xl shadow-black/10 dark:shadow-white/10 scale-105' 
                    : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }
                `}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>

          <p className="mt-8 max-w-xl text-neutral-400 dark:text-neutral-500 text-lg md:text-xl font-medium leading-relaxed">
            Speed. Privacy. Precision. Essential toolkit for professionals.
          </p>
        </div>

        <div className="space-y-6">
          {user && recentActivities.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900 dark:text-white">Recent Intelligence</h4>
                 </div>
                 <span className="text-[8px] font-bold text-neutral-300 dark:text-neutral-600 uppercase tracking-widest">Live Feed</span>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <button 
                    key={activity.id}
                    onClick={() => onSelectTool(activity.toolId)}
                    className="w-full flex items-center justify-between group hover:translate-x-1 transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 group-hover:bg-rose-600 transition-colors" />
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white uppercase tracking-widest">{activity.toolName}</span>
                    </div>
                    <span className="text-[10px] text-neutral-300 dark:text-neutral-600 font-medium">
                      {activity.timestamp?.toDate() ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(activity.timestamp.toDate()) : 'Recent'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Support Section */}
          {!isVip && (
            <div className="bg-rose-600 rounded-[2rem] p-6 shadow-xl shadow-rose-600/20 flex items-center justify-between group overflow-hidden relative">
               <div className="relative z-10">
                  <span className="text-[8px] font-black text-rose-200 uppercase tracking-[0.4em] block mb-2">UPGRADE</span>
                  <h5 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Support Aether Pro</h5>
                  <button 
                    onClick={() => onSelectTool('settings')}
                    className="mt-3 text-[10px] font-black uppercase tracking-widest bg-white text-rose-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Sparkles size={14} /> Get VIP Access
                  </button>
               </div>
               <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-white/20 rotate-6 group-hover:rotate-12 transition-transform">
                  <Shield size={32} />
               </div>
            </div>
          )}
        </div>
      </header>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-flow-row-dense gap-6 lg:gap-8"
      >
        {filteredTools.map((tool) => (
          <div key={tool.id} className={`
             ${activeCategory === 'all' && (tool.id === 'duka-sync' || tool.id === 'momo-intelligence') ? 'lg:col-span-2 lg:row-span-1' : ''}
             ${activeCategory === 'all' && tool.id === 'phone-sorter' ? 'lg:col-span-2 lg:row-span-2' : ''}
             relative
          `}>
            <ToolCard 
              id={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              onClick={onSelectTool}
              color={tool.color}
            />
            {tool.vip && (
              <div className="absolute top-4 right-4 z-10 pointer-events-none">
                 <div className={`${isVip ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-rose-600 shadow-rose-600/20'} text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg flex items-center gap-1 transition-colors`}>
                    {isVip ? <Check size={8} /> : <Sparkles size={8} />}
                    {isVip ? 'Unlocked' : 'VIP'}
                 </div>
              </div>
            )}
          </div>
        ))}
        {filteredTools.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
             <Users size={64} className="mx-auto mb-4" />
             <p className="text-xl font-black uppercase tracking-[0.4em]">No matching tools found</p>
          </div>
        )}
      </motion.div>
      
      <footer className="mt-32 pt-16 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 lg:grid-cols-4 gap-12 text-neutral-400 dark:text-neutral-500 mb-12">
        <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Privacy</h4>
            <p className="text-xs leading-relaxed font-medium">Local processing. No cloud.</p>
        </div>
        <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Security</h4>
            <p className="text-xs leading-relaxed font-medium">Secure-by-design standards.</p>
        </div>
        <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Build</h4>
            <p className="text-xs leading-relaxed font-medium">v1.8.0.26</p>
        </div>
        <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Status</h4>
            <p className="text-xs leading-relaxed font-medium">All systems operational.</p>
        </div>
      </footer>

      <AnimatePresence>
      </AnimatePresence>
    </div>
  );
}

