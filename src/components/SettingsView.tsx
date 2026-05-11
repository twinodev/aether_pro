import React, { useState } from 'react';
import { Moon, Sun, Monitor, Bell, Shield, User, CreditCard, ChevronRight, Check, Trash2, Smartphone, Globe, Info, LogOut, ArrowUpRight, Send, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { emailService } from '../services/emailService';
import { motion, AnimatePresence } from 'motion/react';

type SettingsTab = 'interface' | 'identity' | 'signals' | 'security';

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { user, isVip, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab ] = useState<SettingsTab>('interface');

  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const sendTestEmail = async () => {
    if (!user?.email) return;
    
    setEmailStatus('loading');
    setErrorMessage('');
    
    try {
      await emailService.sendWelcomeEmail(user.email, user.displayName || 'Operative');
      setEmailStatus('success');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setEmailStatus('error');
      setErrorMessage(err.message || 'Transmission failed');
    }
  };

  const themeOptions = [
    { id: 'light', label: 'Light Mode', icon: Sun },
    { id: 'dark', label: 'Dark Mode', icon: Moon },
  ];

  const [toggles, setToggles] = useState({
    pushSignals: true,
    emailAlerts: false,
    systemUpdates: true,
    biometricLock: false,
    analytics: true
  });

  const toggleState = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const Switch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${active ? 'bg-rose-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}
    >
      <motion.div 
        animate={{ x: active ? 22 : 2 }}
        initial={false}
        className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  const tabs = [
    { id: 'interface', label: 'Interface', icon: Monitor },
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'signals', label: 'Signals', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white uppercase mb-2">System Controls</h1>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-medium">Calibrate your Aether environment parameters.</p>
        </div>
        <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 self-start md:self-auto">
           <div className="flex items-center gap-2 px-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sync Active</span>
           </div>
           <button className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-all text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
             <Info size={16} />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide snap-x">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex-none md:flex-initial flex items-center justify-center md:justify-between p-3 md:p-4 rounded-xl md:rounded-2xl font-bold transition-all group whitespace-nowrap snap-start ${
                activeTab === tab.id 
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg shadow-black/10' 
                : 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-500'
              }`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <tab.icon size={16} className={`${activeTab === tab.id ? '' : 'text-neutral-400'} md:w-[18px] md:h-[18px]`} />
                <span className="text-[9px] md:text-[10px] uppercase tracking-widest">{tab.label}</span>
              </div>
              <ChevronRight size={14} className={`opacity-50 hidden md:block transition-transform ${activeTab === tab.id ? 'translate-x-1' : ''}`} />
            </button>
          ))}
          
          <div className="hidden md:block pt-4">
             <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-6 text-center rounded-3xl">
                <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-[0.3em] mb-2">Transmission</span>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-neutral-400 dark:text-neutral-500">Support Aether</p>
                  <p className="text-[8px] font-medium text-neutral-300 uppercase tracking-widest">ID: CORE-PRO</p>
                </div>
              </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {activeTab === 'interface' && (
                <div className="space-y-6">
                  {/* Theme Section */}
                  <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 md:mb-8">
                      <Monitor size={16} className="text-neutral-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Visual DNA</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {themeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setTheme(option.id as any)}
                          className={`relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex flex-col items-center gap-3 md:gap-4 group ${
                            theme === option.id 
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800' 
                            : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                          }`}
                        >
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors ${
                            theme === option.id ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                          }`}>
                            <option.icon size={20} className="md:w-6 md:h-6" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            theme === option.id ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'
                          }`}>
                            {option.label}
                          </span>
                          {theme === option.id && (
                            <motion.div 
                              layoutId="theme-check"
                              className="absolute top-4 right-4 text-neutral-900 dark:text-white"
                            >
                              <Check size={16} />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 md:mb-8">
                      <Smartphone size={16} className="text-neutral-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Regional & Display</span>
                    </div>
                    
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Density Matrix</span>
                        </div>
                        <div className="flex bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                          <button className="px-2 md:px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[8px] font-black uppercase tracking-widest">Std</button>
                          <button className="px-2 md:px-3 py-1 text-neutral-400 text-[8px] font-black uppercase tracking-widest">Cpt</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Node</span>
                        </div>
                        <div className="flex items-center gap-2 text-rose-500">
                          <Globe size={12} className="md:w-3.5 md:h-3.5" />
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">W-01</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'identity' && (
                <div className="space-y-6">
                  {/* Identity Card */}
                  <section className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-black/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10">
                      <User size={80} className="md:w-[120px] md:h-[120px]" strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6 md:mb-8">
                         <User size={16} className="text-neutral-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Identity Token</span>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-800 dark:bg-neutral-100 rounded-2xl md:rounded-3xl border-2 border-neutral-700 dark:border-neutral-200 overflow-hidden flex items-center justify-center relative group">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <User size={24} className="text-neutral-500 md:w-8 md:h-8" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter truncate max-w-[180px] md:max-w-none">{user?.displayName || 'Guest'}</h3>
                          <p className="text-neutral-500 font-bold text-[10px] md:text-xs uppercase tracking-widest truncate max-w-[180px] md:max-w-none">{user?.email || 'Standalone'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                         <div className={`px-3 md:px-4 py-2 rounded-full border flex items-center gap-2 ${
                           isVip ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-neutral-400'
                         }`}>
                           <CreditCard size={10} className="md:w-3 md:h-3" />
                           <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                             {isVip ? 'Elite' : 'Standard'}
                           </span>
                         </div>
                         {isAdmin && (
                            <div className="px-3 md:px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-500 flex items-center gap-2">
                              <Shield size={10} className="md:w-3 md:h-3" />
                              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Overseer</span>
                            </div>
                         )}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'signals' && (
                <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 md:mb-8">
                    <Bell size={16} className="text-neutral-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Signal Relays</span>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                      <div className="flex flex-col pr-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Push Signals</span>
                        <span className="text-[8px] md:text-[9px] font-medium text-neutral-500 uppercase tracking-tighter">Real-time alerts</span>
                      </div>
                      <Switch active={toggles.pushSignals} onClick={() => toggleState('pushSignals')} />
                    </div>

                    <div className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                      <div className="flex flex-col pr-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Email Manifests</span>
                        <span className="text-[8px] md:text-[9px] font-medium text-neutral-500 uppercase tracking-tighter">Weekly summary</span>
                      </div>
                      <Switch active={toggles.emailAlerts} onClick={() => toggleState('emailAlerts')} />
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-6 md:p-8 rounded-[2rem] relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                            <Send size={14} className="text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Deployment Test</span>
                          </div>
                          <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Test Signal Relay</h4>
                          <p className="text-[10px] opacity-60 uppercase tracking-widest leading-relaxed mb-4 max-w-[240px]">
                            Dispatch a verification handshake to your registered identity point to verify relay integrity.
                          </p>
                          <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Configuration Required</p>
                            <p className="text-[9px] font-medium text-neutral-400 leading-tight">
                              Ensure <span className="text-rose-400 text-[10px] font-bold">RESEND_API_KEY</span> is set in project environment variables.
                            </p>
                          </div>
                          
                          <button 
                            onClick={sendTestEmail}
                            disabled={emailStatus === 'loading' || !user?.email}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                              emailStatus === 'loading' 
                                ? 'bg-neutral-800 dark:bg-neutral-200 cursor-wait' 
                                : emailStatus === 'success'
                                ? 'bg-emerald-500 text-white'
                                : emailStatus === 'error'
                                ? 'bg-rose-500 text-white'
                                : 'bg-rose-600 dark:bg-neutral-900 text-white hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                          >
                            {emailStatus === 'loading' && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {emailStatus === 'success' && <Check size={14} />}
                            {emailStatus === 'error' && <AlertTriangle size={14} />}
                            {emailStatus === 'loading' ? 'Transmitting...' : 
                             emailStatus === 'success' ? 'Relay Confirmed' : 
                             emailStatus === 'error' ? 'Relay Failed' : 
                             'Dispatch Test Signal'}
                          </button>
                          
                          {emailStatus === 'error' && (
                            <p className="mt-3 text-[9px] text-rose-400 font-bold uppercase tracking-widest text-center">
                              {errorMessage}
                            </p>
                          )}
                        </div>
                        
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                          <Send size={120} strokeWidth={1} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 md:mb-8">
                      <Shield size={16} className="text-neutral-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Protocols</span>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col pr-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Vault Lock</span>
                          <span className="text-[8px] md:text-[9px] font-medium text-neutral-500 uppercase tracking-tighter">Requires auth</span>
                        </div>
                        <Switch active={toggles.biometricLock} onClick={() => toggleState('biometricLock')} />
                      </div>
                    </div>
                  </section>

                  <section className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 md:mb-8">
                      <Trash2 size={16} className="text-rose-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Extreme</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                       <button className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-neutral-900 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-600 hover:text-white transition-all text-left">
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Wipe Node</span>
                          <Trash2 size={18} className="md:w-5 md:h-5" />
                       </button>

                       <button 
                         onClick={logout}
                         className="flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white dark:bg-neutral-900 border border-rose-100 dark:border-rose-900/30 hover:bg-neutral-900 dark:hover:bg-white dark:hover:text-black hover:text-white transition-all text-left"
                       >
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Purge Session</span>
                          <LogOut size={18} className="md:w-5 md:h-5" />
                       </button>
                    </div>
                  </section>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* System Manifest Footer */}
      <footer className="mt-12 pt-12 border-t border-neutral-200 dark:border-neutral-800">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-neutral-400">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-50">Protocol</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">v3.8.4-RELEASE</span>
               </div>
               <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-50">License</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Elite Operational</span>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-[9px] font-medium uppercase tracking-widest">Aether Pro Intelligence Platform</span>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
         </div>
      </footer>
    </div>
  );
}

