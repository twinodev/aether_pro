import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PwaHandler() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      <AnimatePresence>
        {(offlineReady || needRefresh) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100] bg-white border border-neutral-100 shadow-2xl rounded-3xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shrink-0">
                <RefreshCw size={24} className={needRefresh ? 'animate-spin' : ''} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-tight italic">
                  {offlineReady ? 'App Offline Ready' : 'Update Available'}
                </h4>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  {offlineReady 
                    ? 'Duka Sync is ready to work without internet connection.' 
                    : 'A new version of the protocol is available. Update now to stay synced.'}
                </p>
                <div className="flex gap-2 mt-4">
                  {needRefresh && (
                    <button
                      onClick={() => updateServiceWorker(true)}
                      className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Update
                    </button>
                  )}
                  <button
                    onClick={close}
                    className="px-4 py-2 border border-neutral-100 text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showInstallBtn && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Protocol Install</span>
              <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter mt-0.5">Add Duka Sync to Home Screen</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Install
            </button>
            <button onClick={() => setShowInstallBtn(false)} className="opacity-60 hover:opacity-100 transition-all">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
