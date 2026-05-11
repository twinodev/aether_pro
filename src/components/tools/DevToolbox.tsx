import React, { useState, useEffect } from 'react';
import { 
  Code, Terminal, Box, Lock, Eye, Copy, Trash2, 
  RefreshCw, Check, Hash, FileJson, Binary, 
  Key, Globe, Braces, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert.tsx';

type Tab = 'json' | 'base64' | 'hash' | 'jwt' | 'regex' | 'uuid';

export default function DevToolbox() {
  const [activeTab, setActiveTab] = useState<Tab>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // JSON States
  const [jsonIndent, setJsonIndent] = useState(2);

  // JWT States
  const [jwtParts, setJwtParts] = useState<{ header: any, payload: any, signature: string } | null>(null);

  // Regex States
  const [regexPattern, setRegexPattern] = useState('');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexMatches, setRegexMatches] = useState<RegExpMatchArray[]>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError(null);
    setJwtParts(null);
  };

  // --- Tool Logic ---

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, jsonIndent));
      setError(null);
    } catch (err) {
      setError('Invalid JSON structure');
      setOutput('');
    }
  };

  const base64Action = (mode: 'encode' | 'decode') => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
      setError(null);
    } catch (err) {
      setError(`Failed to ${mode} Base64 data`);
      setOutput('');
    }
  };

  const generateHash = async (algo: 'SHA-256' | 'SHA-1') => {
    try {
      const msgUint8 = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setOutput(hashHex);
      setError(null);
    } catch (err) {
      setError('Hash generation failed');
      setOutput('');
    }
  };

  const debugJWT = () => {
    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format (must have 3 parts)');
      }
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const signature = parts[2];
      setJwtParts({ header, payload, signature });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JWT decoding failed');
      setJwtParts(null);
    }
  };

  const testRegex = () => {
    if (!regexPattern) {
      setRegexMatches([]);
      return;
    }
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches = Array.from(input.matchAll(re));
      setRegexMatches(matches);
      setError(null);
    } catch (err) {
      setError('Invalid Regex Pattern');
      setRegexMatches([]);
    }
  };

  const generateUUID = () => {
    const uuid = crypto.randomUUID();
    setOutput(uuid);
  };

  useEffect(() => {
    setError(null);
    if (!input) {
      setOutput('');
      setJwtParts(null);
      return;
    }

    if (activeTab === 'json') formatJSON();
    if (activeTab === 'jwt') debugJWT();
    if (activeTab === 'regex') testRegex();
  }, [input, jsonIndent, activeTab, regexPattern, regexFlags]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      <header className="mb-12">
        <OfflineAlert toolName="Developer Intelligence" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl flex items-center justify-center shadow-xl">
               <Terminal size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Developer Pack</h1>
                <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest mt-1">Core utilities for system engineers.</p>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={clearAll} className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-400 hover:text-rose-600 transition-colors" title="Clear Area">
                <Trash2 size={20} />
             </button>
             <button onClick={handleCopy} className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 px-6">
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'In Memory' : 'Clone Data'}</span>
             </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
           {[
             { id: 'json', label: 'JSON Engine', icon: FileJson },
             { id: 'base64', label: 'B64 Encoder', icon: Binary },
             { id: 'hash', label: 'Hash Gen', icon: Hash },
             { id: 'jwt', label: 'JWT Debug', icon: Key },
             { id: 'regex', label: 'Regex Test', icon: Braces },
             { id: 'uuid', label: 'UUID Gen', icon: Box }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as Tab)}
               className={`w-full flex items-center gap-4 px-6 h-14 rounded-2xl transition-all group ${
                 activeTab === tab.id
                   ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl'
                   : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
               }`}
             >
               <tab.icon size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
             </button>
           ))}
        </div>

        {/* Input/Output Area */}
        <div className="lg:col-span-9 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Input Buffer</h3>
                    {activeTab === 'json' && (
                       <select 
                         value={jsonIndent} 
                         onChange={(e) => setJsonIndent(Number(e.target.value))}
                         className="bg-transparent text-[10px] font-black uppercase text-neutral-400 focus:outline-none"
                       >
                         <option value={2}>2 Spaces</option>
                         <option value={4}>4 Spaces</option>
                         <option value={0}>Compact</option>
                       </select>
                    )}
                    {activeTab === 'regex' && (
                       <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Pattern..." 
                            value={regexPattern}
                            onChange={(e) => setRegexPattern(e.target.value)}
                            className="bg-neutral-50 dark:bg-neutral-800 border-none text-[10px] font-bold p-1 px-2 rounded focus:ring-1 ring-neutral-400 outline-none w-32"
                          />
                          <input 
                             type="text" 
                             placeholder="Flags" 
                             value={regexFlags}
                             onChange={(e) => setRegexFlags(e.target.value)}
                             className="bg-neutral-50 dark:bg-neutral-800 border-none text-[10px] font-bold p-1 px-2 rounded focus:ring-1 ring-neutral-400 outline-none w-12"
                          />
                       </div>
                    )}
                 </div>
                 <div className="relative group">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Enter raw ${activeTab.toUpperCase()} data here...`}
                      className="w-full h-[600px] bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-[2rem] p-8 text-sm font-mono focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-all shadow-sm"
                    />
                    {error && (
                      <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-1">
                         <div className="flex items-center gap-2 py-1.5 px-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg border border-rose-100 dark:border-rose-900/30">
                            <AlertCircle size={14} />
                            <span className="text-[9px] font-black uppercase">{error}</span>
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Output Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Intelligence Result</h3>
                    {activeTab === 'base64' && (
                      <div className="flex gap-2">
                        <button onClick={() => base64Action('encode')} className="text-[9px] font-black uppercase text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors tracking-widest">Encode</button>
                        <span className="text-neutral-200">|</span>
                        <button onClick={() => base64Action('decode')} className="text-[9px] font-black uppercase text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors tracking-widest">Decode</button>
                      </div>
                    )}
                    {activeTab === 'hash' && (
                      <div className="flex gap-2">
                        <button onClick={() => generateHash('SHA-256')} className="text-[9px] font-black uppercase text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors tracking-widest">SHA-256</button>
                        <span className="text-neutral-200">|</span>
                        <button onClick={() => generateHash('SHA-1')} className="text-[9px] font-black uppercase text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors tracking-widest">SHA-1</button>
                      </div>
                    )}
                    {activeTab === 'uuid' && (
                       <button onClick={generateUUID} className="text-[9px] font-black uppercase text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors tracking-widest flex items-center gap-1">
                          <RefreshCw size={10} /> Regen
                       </button>
                    )}
                 </div>
                 
                 <div className="h-[600px] w-full bg-neutral-50 dark:bg-neutral-800/50 border-2 border-neutral-100 dark:border-neutral-800 rounded-[2rem] p-8 overflow-auto font-mono text-xs relative group">
                    <AnimatePresence mode="wait">
                       {activeTab === 'jwt' && jwtParts ? (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0 }}
                           className="space-y-8"
                         >
                            <section>
                               <h4 className="text-[9px] font-black uppercase tracking-widest text-[#fb2e5d] mb-4">Header</h4>
                               <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                  <pre className="text-neutral-900 dark:text-neutral-200">{JSON.stringify(jwtParts.header, null, 2)}</pre>
                               </div>
                            </section>
                            <section>
                               <h4 className="text-[9px] font-black uppercase tracking-widest text-[#d63aff] mb-4">Payload</h4>
                               <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                  <pre className="text-neutral-900 dark:text-neutral-200">{JSON.stringify(jwtParts.payload, null, 2)}</pre>
                               </div>
                            </section>
                            <section>
                               <h4 className="text-[9px] font-black uppercase tracking-widest text-[#00d9ff] mb-4">Signature</h4>
                               <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                  <pre className="break-all text-neutral-400">{jwtParts.signature}</pre>
                               </div>
                            </section>
                         </motion.div>
                       ) : activeTab === 'regex' ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                          >
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">{regexMatches.length} Matches Found</span>
                             </div>
                             <div className="space-y-2">
                                {regexMatches.map((m, i) => (
                                   <div key={i} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 flex justify-between">
                                      <span className="text-rose-600 font-bold">[{i}]</span>
                                      <span className="text-neutral-900 dark:text-neutral-200 truncate ml-4">{m[0]}</span>
                                   </div>
                                ))}
                                {regexMatches.length === 0 && (
                                   <div className="py-20 text-center opacity-20">
                                      <p className="text-[10px] font-black uppercase tracking-widest">No Matches</p>
                                   </div>
                                )}
                             </div>
                          </motion.div>
                       ) : (
                         <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="whitespace-pre-wrap break-all text-neutral-900 dark:text-neutral-200"
                         >
                           {output || (
                             <div className="h-full flex flex-col items-center justify-center opacity-20 py-40 gap-4">
                               <Terminal size={48} />
                               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Buffer</p>
                             </div>
                           )}
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
