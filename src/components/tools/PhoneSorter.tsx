import React, { useState, useRef } from 'react';
import { Phone, Users, Copy, Download, Trash2, Filter, Check, Share2, Globe, FileUp, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert.tsx';

interface NetworkGroup {
  name: string;
  numbers: string[];
  color: string;
}

const NETWORK_RULES: Record<string, { [prefix: string]: string }> = {
  'UG': { // Uganda +256
    '77': 'MTN', '78': 'MTN', '76': 'MTN', '31': 'MTN', '39': 'MTN', '32': 'MTN',
    '75': 'Airtel', '70': 'Airtel', '74': 'Airtel', '20': 'Airtel',
    '72': 'Lyca', 
    '71': 'UTL', '41': 'UTL',
    '73': 'Smile'
  },
  'KE': { // Kenya +254
    '70': 'Safaricom', '71': 'Safaricom', '72': 'Safaricom', '79': 'Safaricom', '110': 'Safaricom', '111': 'Safaricom', '112': 'Safaricom', '113': 'Safaricom', '114': 'Safaricom', '115': 'Safaricom',
    '73': 'Airtel', '75': 'Airtel', '78': 'Airtel', '100': 'Airtel', '101': 'Airtel', '102': 'Airtel',
    '77': 'Telkom', '76': 'Equitel'
  },
  'TZ': { // Tanzania +255
    '74': 'Vodacom', '75': 'Vodacom', '76': 'Vodacom',
    '68': 'Airtel', '69': 'Airtel', '78': 'Airtel',
    '65': 'Tigo', '67': 'Tigo', '71': 'Tigo',
    '73': 'TTCL', '77': 'Zantel', '61': 'Halotel', '62': 'Halotel'
  }
};

const COLORS: Record<string, string> = {
  'MTN': 'bg-yellow-400 text-neutral-900 border-yellow-500/20',
  'Airtel': 'bg-rose-600 text-white border-rose-700/20',
  'Safaricom': 'bg-emerald-600 text-white border-emerald-700/20',
  'Vodacom': 'bg-red-500 text-white border-red-600/20',
  'Tigo': 'bg-blue-600 text-white border-blue-700/20',
  'Lyca': 'bg-purple-600 text-white border-purple-700/20',
  'Telkom': 'bg-cyan-500 text-white border-cyan-600/20',
  'Equitel': 'bg-amber-600 text-white border-amber-700/20',
  'Smile': 'bg-indigo-500 text-white border-indigo-600/20',
  'UTL': 'bg-sky-600 text-white border-sky-700/20',
  'Halotel': 'bg-orange-500 text-white border-orange-600/20',
  'Unknown': 'bg-neutral-200 text-neutral-500 border-neutral-300/20'
};

type Mode = 'phone' | 'nin';

export default function PhoneSorter() {
  const [mode, setMode] = useState<Mode>('phone');
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('UG');
  const [groups, setGroups] = useState<NetworkGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatMode, setFormatMode] = useState<'original' | 'local' | 'international'>('original');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeNumber = (num: string, targetFormat: 'original' | 'local' | 'international', countryCode: string) => {
    let clean = num.replace(/\D/g, '');
    const prefixMap: Record<string, string> = { 'UG': '256', 'KE': '254', 'TZ': '255' };
    const prefix = prefixMap[countryCode];
    if (clean.startsWith(prefix)) clean = clean.substring(prefix.length);
    if (clean.startsWith('0')) clean = clean.substring(1);

    if (targetFormat === 'local') return `0${clean}`;
    if (targetFormat === 'international') return `+${prefix}${clean}`;
    return num;
  };

  const processNINs = () => {
    setIsProcessing(true);
    // Regex for Ugandan NIN: 14 chars, starts with CM or CF
    const ninRegex = /\bC[MF][A-Z0-9]{12}\b/gi;
    const matches: string[] = input.match(ninRegex) || [];
    const uniqueNins = Array.from(new Set(matches.map(n => n.toUpperCase())));
    
    const groups: NetworkGroup[] = [
      {
        name: 'Validated NINs',
        numbers: uniqueNins,
        color: 'bg-indigo-600 text-white border-indigo-700/20'
      }
    ];
    
    setGroups(groups);
    setTimeout(() => setIsProcessing(false), 300);
  };

  const processNumbers = () => {
    if (mode === 'nin') return processNINs();
    setIsProcessing(true);
    
    const rawNumbers: string[] = input.split(/[\s,;\n\t]+/).filter(n => n.trim().length >= 7);
    const uniqueRaw: string[] = Array.from(new Set(rawNumbers));
    
    const results: Record<string, string[]> = { 'Unknown': [] };
    const rules = NETWORK_RULES[country];

    uniqueRaw.forEach((num) => {
      let clean = num.toString().replace(/\D/g, '');
      const prefixMap: Record<string, string> = { 'UG': '256', 'KE': '254', 'TZ': '255' };
      const countryPrefix = prefixMap[country];
      
      if (clean.startsWith(countryPrefix)) clean = clean.substring(countryPrefix.length);
      if (clean.startsWith('0')) clean = clean.substring(1);

      let found = false;
      const sortedPrefixes = Object.keys(rules).sort((a, b) => b.length - a.length);
      
      for (const prefix of sortedPrefixes) {
        if (clean.startsWith(prefix)) {
          const network = rules[prefix];
          if (!results[network]) results[network] = [];
          
          const formatted = normalizeNumber(num, formatMode, country);
          results[network].push(formatted);
          found = true;
          break;
        }
      }

      if (!found) {
        results['Unknown'].push(normalizeNumber(num, formatMode, country));
      }
    });

    const finalGroups = Object.entries(results)
      .filter(([_, nums]) => nums.length > 0)
      .map(([name, nums]) => ({
        name,
        numbers: Array.from(new Set(nums)),
        color: COLORS[name] || COLORS['Unknown']
      }))
      .sort((a, b) => b.numbers.length - a.numbers.length);

    setGroups(finalGroups);
    setTimeout(() => setIsProcessing(false), 300);
  };

  const copyGroup = (nums: string[], id: string) => {
    navigator.clipboard.writeText(nums.join('\n'));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadAll = () => {
    const content = groups.map(g => `--- ${g.name} (${g.numbers.length}) ---\n${g.numbers.join('\n')}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-numbers-${country}-${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="Data Intelligence" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-900 text-white rounded-2xl shadow-xl shadow-neutral-900/10">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">Data Intelligence</h1>
              <p className="text-neutral-500 font-medium text-xs uppercase tracking-widest italic opacity-60">High-Precision Regional Sequence Processor</p>
            </div>
          </div>

          <div className="flex bg-neutral-100 p-1 rounded-2xl w-fit">
             {(['phone', 'nin'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setGroups([]);
                  }}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === m ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {m === 'phone' ? 'Phone Sorter' : 'NIN Validator'}
                </button>
             ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            {mode === 'phone' && (
              <>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Regional Sequence</label>
                <div className="flex gap-2">
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="btn-secondary text-[10px] font-black uppercase tracking-widest h-auto py-3 flex-1 appearance-none bg-neutral-50"
                  >
                    <option value="UG">🇺🇬 UGANDA (+256)</option>
                    <option value="KE">🇰🇪 KENYA (+254)</option>
                    <option value="TZ">🇹🇿 TANZANIA (+255)</option>
                  </select>
                </div>

                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Normalization Protocol</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['original', 'local', 'international'] as const).map((mode) => (
                    <button 
                      key={mode}
                      onClick={() => setFormatMode(mode)}
                      className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                        formatMode === mode 
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg' 
                        : 'bg-white text-neutral-400 border-neutral-100 hover:border-neutral-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Carrier Source</label>
              <button 
                onClick={() => setInput('')}
                className="text-neutral-300 hover:text-red-500 transition-colors"
                title="Clear All"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="relative group">
               <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <Globe size={14} className="text-neutral-300 group-focus-within:text-emerald-500 transition-colors" />
               </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="PRO TIP: Drag and drop a .txt or .csv file here or paste raw number sequences...&#10;&#10;Examples:&#10;0771234567&#10;+256 701 123 456&#10;075888222"
                className="input-field min-h-[350px] font-mono text-[10px] pl-10 pt-10 leading-loose resize-none bg-neutral-50/50"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="p-2 bg-white border border-neutral-100 rounded-lg text-neutral-400 hover:text-emerald-600 transition-colors shadow-sm"
                   title="Upload List"
                 >
                   <Upload size={14} />
                 </button>
                 <div className="text-[9px] font-black uppercase tracking-widest text-neutral-300 bg-white px-2 py-1 rounded-md border border-neutral-100">
                   {input.split(/[\s,;\n\t]+/).filter(n => n.trim()).length} detected
                 </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    setInput(prev => prev + (prev ? '\n' : '') + text);
                  };
                  reader.readAsText(file);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }} 
                className="hidden" 
                accept=".txt,.csv"
              />
            </div>

            <button 
              onClick={processNumbers}
              disabled={!input.trim() || isProcessing}
              className="w-full h-14 bg-neutral-900 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl disabled:opacity-20"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Filter size={16} />
                  Execute Sorter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Sorted Groups ({groups.length})
            </h3>
            {groups.length > 0 && (
              <button onClick={downloadAll} className="text-[10px] font-bold uppercase text-emerald-600 hover:scale-105 transition-transform flex items-center gap-1">
                <Download size={12} />
                Download All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {groups.length === 0 ? (
                <div className="col-span-full h-[400px] border-2 border-dashed border-neutral-100 rounded-3xl flex flex-col items-center justify-center text-neutral-300 gap-4">
                  <Phone size={48} className="opacity-20" />
                  <p className="text-sm font-medium uppercase tracking-widest opacity-50">Results will appear here</p>
                </div>
              ) : (
                groups.map((group) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={group.name}
                    className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${group.color}`}>
                          {group.name}
                        </span>
                        <span className="text-xs font-bold text-neutral-300">
                          {group.numbers.length} units
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyGroup(group.numbers, group.name)}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900 shadow-sm transition-all"
                        >
                          {copiedId === group.name ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 rounded-xl p-3 max-h-32 overflow-y-auto scrollbar-none border border-neutral-100">
                      <code className="text-[10px] text-neutral-500 leading-relaxed block">
                        {group.numbers.join(', ')}
                      </code>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
