import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Sparkles, ShieldCheck, Zap, Mail, Lock, User, ArrowRight, Chrome, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginOverlay({ onClose }: { onClose?: () => void }) {
  const { login, loginWithEmail, registerWithEmail, sendPasswordReset } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name) throw new Error('Name is required');
        await registerWithEmail(email, password, name);
      }
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] md:min-h-[70vh] p-4 md:p-8 text-center max-w-xl mx-auto py-12 md:py-20 relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <X size={24} />
        </button>
      )}
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-16 h-16 md:w-20 md:h-20 bg-neutral-900 text-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-black/10 mb-6 md:mb-8"
      >
        <ShieldCheck size={32} className="md:w-10 md:h-10" />
      </motion.div>
      
      <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-neutral-900 mb-3 md:mb-4 uppercase">
        {authMode === 'login' ? 'Identity Required' : 'Join Aether Pro'}
      </h2>
      <p className="text-neutral-400 md:text-neutral-500 font-medium leading-relaxed mb-8 md:mb-10 text-sm md:text-lg">
        {authMode === 'login' 
          ? 'Authenticate to access your professional toolset and synchronized intelligence.'
          : 'Create your agent profile to unlock persistent workspace features.'}
      </p>

      <div className="w-full max-w-md space-y-6">
        <AnimatePresence mode="wait">
          {!showEmailForm ? (
            <motion.div 
              key="social"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 mb-4">
                   <AlertCircle size={16} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                </div>
              )}
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-16 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center gap-4 hover:border-neutral-900 transition-all group shadow-sm disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center">
                  <Chrome size={18} className="text-neutral-900" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{loading ? 'Connecting...' : 'Connect with Google'}</span>
              </button>

              <button 
                onClick={() => setShowEmailForm(true)}
                className="w-full h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center gap-4 hover:bg-neutral-800 transition-all group shadow-xl"
              >
                <Mail size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Use Email Address</span>
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {authMode === 'login' ? 'Login Credentials' : 'Profile Registration'}
                </h4>
                <button 
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-rose-600"
                >
                  Back
                </button>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 mb-4">
                   <AlertCircle size={16} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full h-14 pl-12 pr-6 bg-neutral-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-neutral-900 transition-all"
                      placeholder="Agent Name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-2">Email Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-14 pl-12 pr-6 bg-neutral-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-neutral-900 transition-all"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between pl-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Passphrase</label>
                  {authMode === 'login' && (
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          setError('Enter your email first to reset password');
                          return;
                        }
                        try {
                          setLoading(true);
                          await sendPasswordReset(email);
                          setError('Password reset email sent!');
                          setLoading(false);
                        } catch (err: any) {
                          setError(err.message);
                          setLoading(false);
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                  <input 
                    type="password" 
                    required={authMode !== 'forgot'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-6 bg-neutral-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-neutral-900 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-neutral-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all mt-6 disabled:opacity-50"
              >
                <span className="text-xs font-black uppercase tracking-widest">
                  {loading ? 'Processing...' : (authMode === 'login' ? 'Authenticate' : 'Establish Profile')}
                </span>
                {!loading && <ArrowRight size={16} />}
              </button>

              <button 
                type="button"
                onClick={toggleMode}
                className="w-full text-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-4 hover:text-neutral-900 transition-colors"
              >
                {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-sm mt-8 md:mt-12 text-left">
        {[
          { icon: Sparkles, text: 'AI Genies' },
          { icon: Zap, text: 'Zero Latency' }
        ].map((item, i) => (
          <div key={i} className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3 p-3 md:p-4 bg-white border border-neutral-100 rounded-xl md:rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400">
              <item.icon size={14} className="md:w-4" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-900">{item.text}</span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
        Encrypted authentication via Aether Core
      </p>
    </div>
  );
}
