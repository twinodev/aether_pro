import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Sparkles, ShieldCheck, Zap, Gift, Mail, Calendar, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { activateTrial } from '../../services/userService';

interface VipGateProps {
  toolName: string;
  onUnlocked: () => void;
  onClose: () => void;
}

export default function VipGate({ toolName, onUnlocked, onClose }: VipGateProps) {
  const [loading, setLoading] = useState(false);
  const { user, trialAvailable } = useAuth();

  const handleActivateTrial = async () => {
    if (!user || !trialAvailable) return;
    setLoading(true);
    try {
      await activateTrial(user.uid);
      onUnlocked();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="p-6 md:p-10 pt-12 md:pt-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-600/20 mb-6 md:mb-8">
            <Sparkles size={32} className="md:w-10 md:h-10" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 mb-3 md:mb-4 uppercase italic">Elite Access</h2>
          <p className="text-neutral-500 font-medium leading-relaxed mb-8 md:mb-10 text-sm md:text-base">
            <span className="text-rose-600 font-bold">{toolName}</span> requires a VIP clearance level. Activate your complimentary trial or contact administration.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-10">
            <div className="p-4 bg-neutral-50 rounded-2xl flex flex-col gap-2 text-left">
              <ShieldCheck size={16} className="text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Pro Features</span>
            </div>
            <div className="p-4 bg-neutral-50 rounded-2xl flex flex-col gap-2 text-left">
              <Calendar size={16} className="text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">7 Day trial</span>
            </div>
          </div>

          <div className="space-y-4 w-full">
            {trialAvailable ? (
              <button 
                onClick={handleActivateTrial}
                disabled={loading}
                className="w-full h-16 bg-neutral-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center gap-4 group transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Gift size={20} className="group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {loading ? 'Activating Trial...' : 'Activate 7-Day FREE Trial'}
                </span>
              </button>
            ) : (
              <div className="w-full p-6 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col items-center gap-2">
                <ShieldCheck size={24} className="text-neutral-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Trial Period Consumed</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 w-full">
              <button 
                onClick={() => window.location.href = 'mailto:tjuniemma@gmail.com?subject=Aether VIP Access Inquiry'}
                className="h-16 border border-neutral-100 hover:border-neutral-200 text-neutral-900 rounded-2xl flex items-center justify-center gap-3 group transition-all"
              >
                <Mail size={18} className="group-hover:scale-110 transition-transform text-neutral-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Email</span>
              </button>
              <button 
                onClick={() => window.open('https://wa.me/256766796585', '_blank')}
                className="h-16 border border-emerald-100 hover:border-emerald-200 bg-emerald-50/50 text-emerald-700 rounded-2xl flex items-center justify-center gap-3 group transition-all"
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">WhatsApp</span>
              </button>
            </div>
          </div>
          
          <p className="mt-8 text-[8px] font-black uppercase tracking-[0.3em] text-neutral-300">Terms of access apply to all experimental modules.</p>
        </div>
      </motion.div>
    </div>
  );
}
