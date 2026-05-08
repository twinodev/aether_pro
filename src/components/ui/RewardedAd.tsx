import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, ShieldCheck, PlayCircle } from 'lucide-react';

interface RewardedAdProps {
  adUnitId: string;
  type: 'rewarded' | 'rewarded_interstitial';
  onReward: () => void;
  onClose: () => void;
}

/**
 * RewardedAd Component
 * 
 * This component manages the display of a rewarded ad.
 * For true AdMob web integration, it would use the 'googletag' or 'adsbygoogle' API.
 * Currently, it provides a high-fidelity simulation that respects the provided Ad Unit IDs.
 */
export default function RewardedAd({ 
  adUnitId, 
  type, 
  onReward, 
  onClose 
}: RewardedAdProps) {
  const [status, setStatus] = useState<'loading' | 'playing' | 'completed'>('loading');
  const [timeLeft, setTimeLeft] = useState(type === 'rewarded' ? 15 : 5);
  
  useEffect(() => {
    // Simulate loading time
    const loadTimer = setTimeout(() => {
      setStatus('playing');
    }, 1500);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (status === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'playing' && timeLeft === 0) {
      setStatus('completed');
    }
  }, [status, timeLeft]);

  const handleGrantReward = () => {
    onReward();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-900 backdrop-blur-xl"
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full h-full md:max-w-4xl md:h-auto md:aspect-video bg-black md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center"
      >
        {/* Ad Content Placeholder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-6 text-center px-8">
               <div className="w-24 h-24 bg-rose-600/20 rounded-[2rem] flex items-center justify-center animate-pulse">
                  {status === 'loading' ? (
                     <PlayCircle className="text-rose-600" size={48} />
                  ) : (
                     <Sparkles className="text-rose-600" size={48} />
                  )}
               </div>
               
               <div className="space-y-2">
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                    {type === 'rewarded_interstitial' ? 'Sponsored Highlight' : 'Watch & Earn Access'}
                 </h2>
                 <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.4em]">
                    Unit Engine: {adUnitId.split('/').pop()}
                 </p>
               </div>

               {status === 'playing' && (
                  <div className="flex flex-col items-center gap-4 mt-8">
                     <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: '0%' }}
                           animate={{ width: `${((type === 'rewarded' ? 15 : 5) - timeLeft) / (type === 'rewarded' ? 15 : 5) * 100}%` }}
                           className="h-full bg-rose-600"
                        />
                     </div>
                     <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                        Ad Playing • {timeLeft}s remaining
                     </span>
                  </div>
               )}

               {status === 'completed' && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-12 flex flex-col items-center gap-6"
                  >
                     <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-emerald-500/20">
                        <ShieldCheck size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Reward unlocked</span>
                     </div>
                     <button 
                       onClick={handleGrantReward}
                       className="text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-white/5 px-6 py-3 rounded-xl transition-colors"
                     >
                        Claim Access Now
                     </button>
                  </motion.div>
               )}
            </div>
        </div>

        {/* HUD Overlay */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
           <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
              <Clock size={12} className="text-rose-500" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">AD</span>
           </div>
        </div>

        {status === 'completed' && (
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
        )}
      </motion.div>
    </div>
  );
}
