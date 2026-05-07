import React, { useState, useRef } from 'react';
import { Phone, Users, Copy, Download, Trash2, Filter, Check, Share2, Globe, FileUp, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkGroup {
  name: string;
  numbers: string[];
  color: string;
}

const NETWORK_RULES: Record<string, { [prefix: string]: string }> = {
  'UG': { // Uganda +256
    '77': 'MTN', '78': 'MTN', '76': 'MTN',
    '75': 'Airtel', '70': 'Airtel', '74': 'Airtel',
    '72': 'Lyca', '71': 'UTL'
  },
  'KE': { // Kenya +254
    '70': 'Safaricom', '71': 'Safaricom', '72': 'Safaricom', '79': 'Safaricom', '110': 'Safaricom', '111': 'Safaricom',
    '73': 'Airtel', '75': 'Airtel', '78': 'Airtel', '100': 'Airtel',
    '77': 'Telkom'
  },
  'TZ': { // Tanzania +255
    '74': 'Vodacom', '75': 'Vodacom', '76': 'Vodacom',
    '68': 'Airtel', '69': 'Airtel', '78': 'Airtel',
    '65': 'Tigo', '67': 'Tigo', '71': 'Tigo',
    '73': 'TTCL', '77': 'Zantel'
  }
};

const COLORS: Record<string, string> = {
  'MTN': 'bg-yellow-400 text-neutral-900',
  'Airtel': 'bg-red-600 text-white',
  'Safaricom': 'bg-emerald-600 text-white',
  'Vodacom': 'bg-red-500 text-white',
  'Tigo': 'bg-blue-600 text-white',
  'Lyca': 'bg-purple-600 text-white',
  'Telkom': 'bg-cyan-500 text-white',
  'Unknown': 'bg-neutral-200 text-neutral-500'
};

export default function PhoneSorter() {
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('UG');
  const [groups, setGroups] = useState<NetworkGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInput(prev => prev + (prev ? '\n' : '') + text);
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processNumbers = () => {
    setIsProcessing(true);
    
    const rawNumbers: string[] = input.split(/[\s,;\n]+/).filter(n => n.trim().length >= 7);
    const uniqueNumbers: string[] = Array.from(new Set(rawNumbers));
    
    const results: Record<string, string[]> = { 'Unknown': [] };
    const rules = NETWORK_RULES[country];

    uniqueNumbers.forEach((num: string) => {
      // Clean number (remove non-digits, country codes for prefix matching)
      let clean = num.toString().replace(/\D/g, '');
      
      // Standardize to local format for prefix checking
      if (country === 'UG' && clean.startsWith('256')) clean = clean.substring(3);
      if (country === 'KE' && clean.startsWith('254')) clean = clean.substring(3);
      if (country === 'TZ' && clean.startsWith('255')) clean = clean.substring(3);
      
      // Remove leading zero if exists
      if (clean.startsWith('0')) clean = clean.substring(1);

      let found = false;
      // Check longer prefixes first (e.g., 110)
      const sortedPrefixes = Object.keys(rules).sort((a, b) => b.length - a.length);
      
      for (const prefix of sortedPrefixes) {
        if (clean.startsWith(prefix)) {
          const network = rules[prefix];
          if (!results[network]) results[network] = [];
          results[network].push(num);
          found = true;
          break;
        }
      }

      if (!found) results['Unknown'].push(num);
    });

    const finalGroups = Object.entries(results)
      .filter(([_, nums]) => nums.length > 0)
      .map(([name, nums]) => ({
        name,
        numbers: nums,
        color: COLORS[name] || COLORS['Unknown']
      }))
      .sort((a, b) => b.numbers.length - a.numbers.length);

    setGroups(finalGroups);
    setIsProcessing(false);
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
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <Users size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Phone Sorter</h1>
        </div>
        <p className="text-neutral-500">Group thousands of phone numbers by network instantly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Settings</label>
            <div className="flex gap-2">
              <select 
                value={country} 
                onChange={(e) => setCountry(e.target.value)}
                className="btn-secondary text-xs h-auto py-2 flex-1"
              >
                <option value="UG">🇺🇬 Uganda</option>
                <option value="KE">🇰🇪 Kenya</option>
                <option value="TZ">🇹🇿 Tanzania</option>
              </select>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-400 hover:text-emerald-600 transition-colors"
                title="Upload List"
              >
                <FileUp size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".txt,.csv"
              />
              <button 
                onClick={() => setInput('')}
                className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                title="Clear All"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste numbers here...&#10;0771234567&#10;+256 701 123 456&#10;075888222"
                className="input-field min-h-[300px] font-mono text-xs py-4 leading-loose resize-none"
              />
              <div className="absolute bottom-3 right-3 text-[10px] font-bold text-neutral-300">
                {input.split(/[\s,;\n]+/).filter(n => n.trim()).length} Detected
              </div>
            </div>

            <button 
              onClick={processNumbers}
              disabled={!input.trim() || isProcessing}
              className="btn-primary w-full shadow-lg shadow-emerald-500/10"
            >
              <Filter size={18} />
              {isProcessing ? 'Processing...' : 'Sort by Network'}
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
