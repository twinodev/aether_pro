import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { subscribeToBroadcasts, Broadcast } from '../../services/broadcastService';

export default function BroadcastBanner() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dismissedBroadcasts');
        if (saved) setDismissedIds(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load dismissed broadcasts from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    let lastBroadcastId: string | null = null;
    
    const unsub = subscribeToBroadcasts((data) => {
      const filtered = data.filter(b => !dismissedIds.includes(b.id));
      
      if (filtered.length > 0) {
        const latest = filtered[0];
        
        // Only notify if it's a new message we haven't seen in this session cycle
        if (latest.id !== lastBroadcastId) {
          // Play subtle notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.2;
          audio.play().catch(() => {}); // Browser might block autoplay

          // Native notification
          if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('AETHER SYSTEM', {
               body: latest.message,
               icon: '/favicon.ico'
             });
          }
          lastBroadcastId = latest.id;
        }
      }
      setBroadcasts(filtered);
      setCurrentIndex(0);
    });
    return () => unsub();
  }, [dismissedIds]);

  const handleDismiss = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    localStorage.setItem('dismissedBroadcasts', JSON.stringify(next));
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  };

  if (broadcasts.length === 0) return null;

  const current = broadcasts[currentIndex];

  const getIcon = (type: Broadcast['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={14} />;
      case 'critical': return <AlertCircle size={14} />;
      case 'success': return <CheckCircle size={14} />;
      default: return <Info size={14} />;
    }
  };

  const getColor = (type: Broadcast['type']) => {
    switch (type) {
      case 'warning': return 'bg-amber-500 text-white border-amber-600';
      case 'critical': return 'bg-rose-600 text-white border-rose-700';
      case 'success': return 'bg-emerald-600 text-white border-emerald-700';
      default: return 'bg-neutral-900 text-white border-neutral-800';
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 pointer-events-none">
       <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={`pointer-events-auto flex items-center gap-3 p-3 px-5 rounded-2xl shadow-2xl border ${getColor(current.type)}`}
          >
            <div className="shrink-0 flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
              {getIcon(current.type)}
            </div>
            
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
                    {current.pinned ? 'Pinned Directive' : 'System Broadcast'}
                  </span>
                  {broadcasts.length > 1 && (
                    <span className="text-[8px] font-black opacity-40">({currentIndex + 1}/{broadcasts.length})</span>
                  )}
               </div>
               {current.title && (
                 <h4 className="text-[10px] font-black uppercase tracking-tight mb-0.5 leading-none">{current.title}</h4>
               )}
               <p className="text-xs font-bold leading-tight truncate">{current.message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
               {broadcasts.length > 1 && (
                 <button 
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % broadcasts.length)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                 >
                   <Megaphone size={12} className="opacity-60" />
                 </button>
               )}
               <button 
                onClick={() => handleDismiss(current.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
               >
                 <X size={14} />
               </button>
            </div>
          </motion.div>
       </AnimatePresence>
    </div>
  );
}
