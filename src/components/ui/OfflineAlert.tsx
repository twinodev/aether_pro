import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface OfflineAlertProps {
  toolName: string;
}

export default function OfflineAlert({ toolName }: OfflineAlertProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {isOnline ? (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="mb-8 p-4 md:p-6 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative group"
        >
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900">Security Recommendation</h4>
            <p className="text-xs font-medium text-amber-800/70 leading-relaxed">
              <span className="font-bold">{toolName}</span> handles sensitive diagnostic data. For maximum privacy, we recommend using this tool with <span className="font-bold underline">Offline Mode</span> enabled. All processing is strictly client-side.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 border border-amber-200 rounded-full">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">Online Active</span>
             </div>
             <button 
                onClick={() => setDismissed(true)}
                className="p-2 hover:bg-amber-100 rounded-full text-amber-400 hover:text-amber-600 transition-colors"
                aria-label="Dismiss security notice"
             >
                <X size={16} />
             </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8 p-4 md:p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6"
        >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900">Stealth Protocol Active</h4>
                <p className="text-xs font-medium text-emerald-800/70 leading-relaxed">
                    Zero-Lease environment confirmed. Your connection is terminated. This session is running in isolated memory with no external data transmission.
                </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full">
                <WifiOff size={12} className="text-emerald-600" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Isolated Mode</span>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
