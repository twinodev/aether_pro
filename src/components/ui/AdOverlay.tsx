import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { getActiveAds, Advertisement } from '../../services/adService';

interface AdOverlayProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function AdOverlay({ onComplete, onClose }: AdOverlayProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAd = async () => {
      const activeAds = await getActiveAds();
      if (activeAds.length > 0) {
        // Random ad
        setAd(activeAds[Math.floor(Math.random() * activeAds.length)]);
      }
      setLoading(false);
    };
    loadAd();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !loading) {
      // Auto-complete after 1 second of showing the 0s screen
      const timer = setTimeout(() => {
        console.log('Auto-completing ad');
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, loading, onComplete]);

  if (loading) return null;

  // Fallback ad if none found
  const displayAd = ad || {
    title: 'Unlock Pro Features',
    imageUrl: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800',
    targetUrl: '#',
    placement: 'bottom'
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden relative z-10 shadow-2xl"
      >
        <div className="relative aspect-video bg-neutral-100">
           <img src={displayAd.imageUrl} alt="" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           
           <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/30">
              <ShieldCheck size={14} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Sponsored Tool Access</span>
           </div>

           <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{displayAd.title}</h3>
              <a 
                href={displayAd.targetUrl} 
                target="_blank" 
                className="inline-flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest hover:text-rose-300 transition-colors"
                rel="noreferrer"
              >
                Learn More <ExternalLink size={12} />
              </a>
           </div>
        </div>

        <div className="p-10 flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-6">
              <Sparkles className="text-rose-600" size={32} />
           </div>
           <h4 className="text-lg font-black text-neutral-900 uppercase tracking-tighter mb-2">Unlocking Premium Customization</h4>
           <p className="text-neutral-500 text-sm font-medium mb-8">Watch this short presentation to gain temporary VIP access to logo embedding.</p>
           
           <div className="w-full flex gap-4">
              {timeLeft > 0 ? (
                <div className="w-full h-16 bg-neutral-100 rounded-2xl flex items-center justify-center gap-3 text-neutral-400">
                   <Clock size={16} />
                   <span className="text-xs font-black uppercase tracking-widest">Unlocking in {timeLeft}s</span>
                </div>
              ) : (
                <div className="w-full h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                   <Sparkles size={16} />
                   Access Granted
                </div>
              )}
              <button 
                onClick={onClose}
                className="px-8 h-16 bg-neutral-50 text-neutral-400 rounded-2xl flex items-center justify-center hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
