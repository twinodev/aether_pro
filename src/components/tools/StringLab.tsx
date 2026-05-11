import React, { useState } from 'react';
import { Database, Code, Brackets, Copy, Check, Trash2, Zap, ArrowRightLeft, FileCode, Lock, Unlock, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'json' | 'base64' | 'url';

export default function StringLab() {
  const [activeTab, setActiveTab] = useState<Tab>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleProcess = (mode: 'beautify' | 'minify' | 'encode' | 'decode') => {
    setError('');
    try {
      if (activeTab === 'json') {
        const obj = JSON.parse(input);
        setOutput(mode === 'beautify' ? JSON.stringify(obj, null, 2) : JSON.stringify(obj));
      } else if (activeTab === 'base64') {
        setOutput(mode === 'encode' ? btoa(input) : atob(input));
      } else if (activeTab === 'url') {
        setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input for format');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neutral-900 text-white rounded-lg">
            <Brackets size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight uppercase italic">String Laboratory</h1>
        </div>
        <p className="text-neutral-500 font-medium">Developer-grade string engineering. Parse, transform, and sanitize data packets.</p>
      </header>

      <nav className="flex bg-neutral-100 p-1 rounded-2xl mb-8 w-fit">
        {(['json', 'base64', 'url'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setInput('');
              setOutput('');
              setError('');
            }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab === 'json' ? 'JSON Refiner' : tab === 'base64' ? 'B64 Converter' : 'URL Handler'}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Carrier Source</span>
              <button 
                onClick={() => setInput('')}
                className="text-neutral-300 hover:text-rose-600 transition-colors"
                title="Clear input"
              >
                <Trash2 size={14} />
              </button>
           </div>
           <textarea 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder={`Paste raw ${activeTab.toUpperCase()} here...`}
             className="w-full h-80 bg-white border-neutral-100 rounded-3xl p-6 text-xs font-mono focus:ring-2 ring-neutral-900/5 outline-none resize-none shadow-sm"
           />
           <div className="flex flex-wrap gap-2">
             {activeTab === 'json' ? (
               <>
                 <button onClick={() => handleProcess('beautify')} className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                   <Code size={14} /> Beautify
                 </button>
                 <button onClick={() => handleProcess('minify')} className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-colors">
                   <Database size={14} /> Minify
                 </button>
               </>
             ) : (
               <>
                 <button onClick={() => handleProcess('encode')} className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                   {activeTab === 'base64' ? <Lock size={14} /> : <Link size={14} />} Encode
                 </button>
                 <button onClick={() => handleProcess('decode')} className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-colors">
                   {activeTab === 'base64' ? <Unlock size={14} /> : <ArrowRightLeft size={14} />} Decode
                 </button>
               </>
             )}
           </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Processed Output</span>
              {output && (
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-900 bg-neutral-100 px-3 py-1 rounded-lg"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
           </div>
           <div className={`w-full h-80 bg-neutral-900 rounded-3xl p-6 text-xs font-mono overflow-auto relative ${error ? 'border-2 border-rose-500/20' : ''}`}>
             <AnimatePresence>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="absolute inset-0 bg-rose-600/95 flex flex-col items-center justify-center text-center p-8 z-10"
                 >
                    <Trash2 size={32} className="text-white/40 mb-4" />
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-2 text-rose-200">Processing Error</h4>
                    <p className="text-white/80 text-[10px] font-medium leading-relaxed italic">{error}</p>
                    <button 
                      onClick={() => setError('')}
                      className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors"
                    >
                      Reset Buffer
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
             <pre className="text-neutral-400 whitespace-pre-wrap">{output || 'Awaiting transmission...'}</pre>
           </div>
           <div className="p-6 bg-neutral-50 rounded-2xl flex items-start gap-4">
              <Zap size={16} className="text-neutral-400 mt-1" />
              <div>
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-900 mb-1">Local Processing</h5>
                 <p className="text-[10px] font-medium text-neutral-400 leading-tight uppercase tracking-widest">
                   Data is processed locally in your browser logic. No packets are transmitted to external servers during conversion.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
