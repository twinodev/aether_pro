import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, RefreshCw, Key, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PassGen() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: 'Too Short', color: 'bg-rose-500' });

  const generatePassword = () => {
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
    };

    let characters = '';
    if (options.uppercase) characters += charset.uppercase;
    if (options.lowercase) characters += charset.lowercase;
    if (options.numbers) characters += charset.numbers;
    if (options.symbols) characters += charset.symbols;

    if (!characters) {
      setPassword('');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(array[i] % characters.length);
    }
    setPassword(result);
  };

  useEffect(() => {
    generatePassword();
  }, [length, options]);

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: 'Too Short', color: 'bg-rose-500' });
      return;
    }

    let score = 0;
    const len = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

    if (len < 10) {
      setStrength({ score: 20, label: 'Too Short', color: 'bg-rose-500' });
    } else if (len < 12 || variety < 3) {
      setStrength({ score: 40, label: 'Weak', color: 'bg-orange-500' });
    } else if (len < 16 || variety < 4) {
      setStrength({ score: 60, label: 'Good', color: 'bg-amber-500' });
    } else if (len < 20) {
      setStrength({ score: 80, label: 'Strong', color: 'bg-emerald-500' });
    } else {
      setStrength({ score: 100, label: 'Very Strong', color: 'bg-indigo-500' });
    }
  }, [password]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-500 text-white rounded-lg">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Security Vault</h1>
        </div>
        <p className="text-neutral-500">Generate cryptographically secure passwords instantly.</p>
      </header>

      <div className="space-y-8">
        {/* Output */}
        <div className="relative group">
          <div className="w-full bg-neutral-900 border-2 border-neutral-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 p-4"><Lock size={120} /></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Generated Password</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${strength.color} text-white transition-all`}>
                  {strength.label}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="text-2xl md:text-3xl font-mono text-white break-all tracking-wider selection:bg-rose-500/30">
                  {password || '••••••••••••'}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="shrink-0 p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-90"
                  aria-label="Copy password"
                >
                  {copied ? <Check size={24} className="text-emerald-400" /> : <Copy size={24} />}
                </button>
              </div>

              {/* Strength Meter */}
              <div className="mt-6 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.score}%` }}
                  className={`h-full ${strength.color} transition-all duration-500`}
                />
              </div>

              {/* Strength Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-y-2 gap-x-4">
                {[
                   { label: 'Length ≥ 12', met: password.length >= 12 },
                   { label: 'Length ≥ 16', met: password.length >= 16 },
                   { label: 'Uppercase', met: /[A-Z]/.test(password) },
                   { label: 'Numbers', met: /[0-9]/.test(password) },
                   { label: 'Symbols', met: /[^A-Za-z0-9]/.test(password) },
                   { label: 'Complex Mix', met: [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length >= 4 },
                ].map((metric, i) => (
                  <div key={i} className={`flex items-center gap-2 transition-opacity duration-300 ${metric.met ? 'opacity-100' : 'opacity-20'}`}>
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${metric.met ? strength.color : 'bg-white/20'}`}>
                      {metric.met && <Check size={8} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-2 border-neutral-100 rounded-3xl p-8 space-y-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-900">Length: {length}</label>
              <button 
                onClick={generatePassword}
                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>
            <input 
              type="range" 
              min="8" 
              max="64" 
              value={length} 
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(options).map((key) => (
              <button
                key={key}
                onClick={() => setOptions(prev => ({ ...prev, [key]: !prev[key as keyof typeof options] }))}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  options[key as keyof typeof options] 
                    ? 'border-neutral-900 bg-neutral-50 shadow-sm' 
                    : 'border-neutral-100 text-neutral-400 opacity-60'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest capitalize">{key}</span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    options[key as keyof typeof options] ? 'bg-neutral-900 text-white' : 'border-2 border-neutral-200'
                }`}>
                  {options[key as keyof typeof options] && <Check size={12} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-4 p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800">
            <Info size={20} className="shrink-0 mt-0.5" />
            <div className="space-y-2">
                <p className="text-sm font-bold">Pro Security Tip</p>
                <p className="text-xs leading-relaxed opacity-80">
                    Use passwords with at least 16 characters and a mix of symbols. Never reuse passwords across different platforms.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
