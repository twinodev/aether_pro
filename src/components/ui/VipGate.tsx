import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RewardedAd from './RewardedAd';

interface VipGateProps {
  toolName: string;
  onUnlocked: () => void;
  onClose: () => void;
}

export default function VipGate({ toolName, onUnlocked, onClose }: VipGateProps) {
  const [isWatching, setIsWatching] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors z-10">
          <X size={20} className="text-neutral-400" />
        </button>

        <div className="p-10 pt-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-rose-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-600/20 mb-8">
            <Sparkles size={40} />
          </div>
          
          <h2 className="text-3xl font-black tracking-tight text-neutral-900 mb-4 uppercase">VIP ACCESS</h2>
          <p className="text-neutral-500 font-medium leading-relaxed mb-10">
            <span className="text-rose-600 font-bold">{toolName}</span> is a premium module. Watch a high-priority sponsor message to unlock access for this session.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="p-4 bg-neutral-50 rounded-2xl flex flex-col gap-2 text-left">
              <ShieldCheck size={16} className="text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Pro Features</span>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl flex flex-col gap-2 text-left">
              <Zap size={16} className="text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Zero Latency</span>
            </div>
          </div>

          <button 
            onClick={() => setIsWatching(true)}
            className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-xl shadow-rose-600/20 flex items-center justify-center gap-4 group transition-all"
          >
            <PlayCircle size={24} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black uppercase tracking-widest">Watch & Unlock Tool</span>
          </button>
        </div>

        <AnimatePresence>
          {isWatching && (
            <RewardedAd 
              adUnitId="ca-app-pub-5861878697571557/6735085889"
              type="rewarded"
              onReward={() => {
                setIsWatching(false);
                onUnlocked();
              }}
              onClose={() => setIsWatching(false)}
            />
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
