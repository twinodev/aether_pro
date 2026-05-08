import React, { useState, useEffect } from 'react';
import { QrCode, ArrowRight, Barcode as BarcodeIcon, Camera, Repeat, Shield, Users, FileText, Clock, Sparkles, FileImage, Check, Globe, Tickets, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToRecentActivities, Activity } from '../services/activityService';
import RewardedAd from './ui/RewardedAd';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: (id: string) => void;
  color?: string;
  key?: React.Key;
}

const ToolCard = ({ id, title, description, icon, onClick, color = 'bg-neutral-900' }: ToolCardProps) => (
  <motion.button
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    whileHover={{ y: -6, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => onClick(id)}
    className="card group relative flex h-full min-h-[220px] w-full flex-col overflow-hidden border-2 border-neutral-100 p-8 text-left transition-all duration-300 hover:border-neutral-300 hover:shadow-2xl hover:shadow-black/5"
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
       <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-[80px] opacity-10 ${color}`} />
    </div>
    
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl shadow-lg shadow-black/5 z-10 ${color}`}>
      {icon}
    </div>
    
    <div className="mt-8 space-y-3 z-10">
      <h3 className="font-black text-2xl group-hover:text-neutral-900 transition-colors uppercase tracking-tighter leading-none">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed font-medium line-clamp-2">{description}</p>
    </div>

    <div className="mt-auto pt-8 flex items-center justify-between z-10">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 group-hover:text-neutral-900 transition-colors">Launch Tool</span>
      <ArrowRight size={20} className="text-neutral-200 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
    </div>
  </motion.button>
);

export default function Home({ onSelectTool, onUnlockAll }: { onSelectTool: (id: string) => void, onUnlockAll?: () => void }) {
  const { user, isVip } = useAuth();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showInterstitial, setShowInterstitial] = useState(false);

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

  const handleUnlockAll = () => {
    setShowInterstitial(true);
  };

  const tools = [
    {
      id: 'qr-builder',
      title: 'QR Builder',
      description: 'Custom codes for URLs, text, and wifi.',
      icon: <QrCode size={24} />,
      color: 'bg-indigo-600'
    },
    {
      id: 'doc-scanner',
      title: 'Doc Scanner',
      description: 'Capture & enhance documents in seconds.',
      icon: <FileText size={24} />,
      color: 'bg-emerald-600'
    },
    {
      id: 'file-converter',
      title: 'File Converter',
      description: 'Local media conversion for images & video.',
      icon: <Repeat size={24} />,
      color: 'bg-rose-600',
      vip: true
    },
    {
      id: 'image-compressor',
      title: 'Shrink Engine',
      description: 'Optimize and compress image assets locally.',
      icon: <FileImage size={24} />,
      color: 'bg-neutral-800',
      vip: true
    },
    {
      id: 'scanner',
      title: 'Scan Engine',
      description: 'Instant decoding for any code format.',
      icon: <Camera size={24} />,
      color: 'bg-amber-600'
    },
    {
      id: 'barcode-builder',
      title: 'Barcode Maker',
      description: 'Professional tracking code generation.',
      icon: <BarcodeIcon size={24} />,
      color: 'bg-sky-600'
    },
    {
      id: 'converter',
      title: 'Smart Units',
      description: 'Swift conversions for any global unit.',
      icon: <Repeat size={24} />,
      color: 'bg-violet-600'
    },
    {
      id: 'vault',
      title: 'Password Vault',
      description: 'Generate high-entropy secure keys.',
      icon: <Shield size={24} />,
      color: 'bg-neutral-800'
    },
    {
      id: 'phone-sorter',
      title: 'Data Sorter',
      description: 'Bulk process phone numbers by network.',
      icon: <Users size={24} />,
      color: 'bg-teal-600',
      vip: true
    },
    {
      id: 'ip-intelligence',
      title: 'IP Intelligence',
      description: 'Extract regional signals and network data.',
      icon: <Globe size={24} />,
      color: 'bg-indigo-600',
      vip: true,
      featured: true
    },
    {
      id: 'ticketing',
      title: 'Ticket Engine',
      description: 'Design and deploy secure event tokens.',
      icon: <Tickets size={24} />,
      color: 'bg-indigo-600',
      vip: true,
      featured: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900/5 rounded-full mb-6 text-neutral-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} RELEASE</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 text-neutral-900 leading-[0.85]">
            AETHER <br />
            <span className="text-[#e2e2e2] dark:text-neutral-200">PRO.</span>
          </h1>
          <p className="max-w-xl text-neutral-400 text-lg md:text-xl font-medium leading-relaxed">
            A zero-compromise selection of essential digital tools. 
            Built for professionals who value speed, privacy, and flawless design.
          </p>
        </div>

        <div className="space-y-6">
          {user && recentActivities.length > 0 && (
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Recent Intelligence</h4>
                 </div>
                 <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">Live Feed</span>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <button 
                    key={activity.id}
                    onClick={() => onSelectTool(activity.toolId)}
                    className="w-full flex items-center justify-between group hover:translate-x-1 transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 group-hover:bg-rose-600 transition-colors" />
                      <span className="text-xs font-bold text-neutral-500 group-hover:text-neutral-900 uppercase tracking-widest">{activity.toolName}</span>
                    </div>
                    <span className="text-[10px] text-neutral-300 font-medium">
                      {activity.timestamp?.toDate() ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(activity.timestamp.toDate()) : 'Recent'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ad Slot - Support & Unlock All */}
          {!isVip && (
            <div className="bg-rose-600 rounded-[2rem] p-6 shadow-xl shadow-rose-600/20 flex items-center justify-between group overflow-hidden relative">
               <div className="relative z-10">
                  <span className="text-[8px] font-black text-rose-200 uppercase tracking-[0.4em] block mb-2">PROMOTION</span>
                  <h5 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Unlock All Tools for 1 Hour</h5>
                  <button 
                    onClick={handleUnlockAll}
                    className="mt-3 text-[10px] font-black uppercase tracking-widest bg-white text-rose-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <PlayCircle size={14} /> Watch Sponsor Ad
                  </button>
               </div>
               <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-white/20 rotate-6 group-hover:rotate-12 transition-transform">
                  <Sparkles size={32} />
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
        {tools.map((tool) => (
          <div key={tool.id} className={`
             ${tool.id === 'qr-builder' || tool.id === 'doc-scanner' ? 'lg:col-span-2 lg:row-span-1' : ''}
             ${tool.id === 'ip-intelligence' ? 'lg:col-span-2 lg:row-span-2' : ''}
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
      </motion.div>
      
      <footer className="mt-32 pt-16 border-t border-neutral-100 grid grid-cols-2 lg:grid-cols-4 gap-12 text-neutral-400 mb-12">
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Privacy</h4>
            <div className="w-12 h-1 px-1 flex bg-neutral-100 rounded-full">
              <div className="w-full h-full bg-neutral-900 rounded-full" />
            </div>
            <p className="text-xs leading-relaxed font-medium">All processing happens directly on your device. Zero cloud dependency.</p>
        </div>
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Security</h4>
            <div className="w-12 h-1 px-1 flex bg-neutral-100 rounded-full">
              <div className="w-1/2 h-full bg-neutral-900 rounded-full" />
            </div>
            <p className="text-xs leading-relaxed font-medium">Built with secure-by-design principles and modern web standards.</p>
        </div>
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Build</h4>
            <p className="text-xs leading-relaxed font-medium">v1.8.0 Premium Toolset<br />Compiled May 2026</p>
        </div>
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Credits</h4>
            <p className="text-xs leading-relaxed font-medium">Designed with precision for the modern web.</p>
        </div>
      </footer>

      <AnimatePresence>
        {showInterstitial && (
          <RewardedAd 
            adUnitId="ca-app-pub-5861878697571557/9660632124"
            type="rewarded_interstitial"
            onReward={() => {
              setShowInterstitial(false);
              onUnlockAll?.();
            }}
            onClose={() => setShowInterstitial(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

