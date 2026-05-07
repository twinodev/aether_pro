import React, { useState, useEffect } from 'react';
import { Globe, Search, MapPin, Shield, Zap, Server, Wifi, Languages, Clock, Copy, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IPData {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utc_offset?: string;
  country_calling_code?: string;
  currency?: string;
  languages?: string;
  asn?: string;
  org?: string;
}

export default function IpIntelligence() {
  const [ipInput, setIpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IPData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchIPData = async (queryIp: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = queryIp ? `https://ipapi.co/${queryIp}/json/` : 'https://ipapi.co/json/';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.reason || 'Failed to fetch IP data');
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const DataField = ({ label, value, icon: Icon, delay = 0 }: { label: string, value?: string | number, icon: any, delay?: number }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative flex flex-col gap-2 p-4 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-neutral-900/5 text-neutral-400 group-hover:text-neutral-900 transition-colors rounded-lg">
             <Icon size={12} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
        </div>
        {value && (
          <button 
            onClick={() => copyToClipboard(String(value), label)}
            className="p-1.5 text-neutral-300 hover:text-neutral-900 transition-colors"
          >
            {copied === label ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
        )}
      </div>
      <p className="text-sm font-bold text-neutral-900 truncate">
        {value || <span className="opacity-20 italic">Unavailable</span>}
      </p>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neutral-900 text-white rounded-lg">
            <Globe size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight uppercase italic">IP Intelligence</h1>
        </div>
        <p className="text-neutral-500 font-medium">Extract regional signals and network intelligence from any IP address.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Search Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <div className="card p-6 bg-neutral-900 text-white flex flex-col gap-6 rounded-[2rem]">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Target Selector</label>
                 <div className="relative">
                    <input 
                       type="text"
                       placeholder="Enter IP (e.g. 8.8.8.8)"
                       value={ipInput}
                       onChange={(e) => setIpInput(e.target.value)}
                       className="w-full bg-white/10 border-none rounded-xl h-14 pl-12 pr-4 text-xs font-bold focus:ring-2 ring-white/20 transition-all placeholder:text-white/20"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                    onClick={() => fetchIPData(ipInput)}
                    disabled={loading}
                    className="h-14 bg-white text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-xl disabled:opacity-50"
                 >
                    {loading ? 'Analyzing Signal...' : 'Initiate Scan'}
                 </button>
                 <button 
                    onClick={() => {
                       setIpInput('');
                       fetchIPData('');
                    }}
                    disabled={loading}
                    className="h-12 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                    My Network Node
                 </button>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                   <div className="shrink-0 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center">
                      <Zap size={12} />
                   </div>
                   <p className="text-[10px] font-bold text-rose-500 leading-tight uppercase tracking-widest">{error}</p>
                </div>
              )}
           </div>

           <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Security Check</h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest transition-all">
                    <span className="text-neutral-400">Privacy Status</span>
                    <span className="text-emerald-500">Secured</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest transition-all">
                    <span className="text-neutral-400">SSL Signal</span>
                    <span className="text-emerald-500">Encrypted</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest transition-all">
                    <span className="text-neutral-400">Audit Rank</span>
                    <span className="text-neutral-900">Elite</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                   key="loading"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="h-full min-h-[400px] bg-neutral-50 rounded-[2.5rem] border border-neutral-100 border-dashed flex flex-col items-center justify-center gap-6"
                >
                   <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-2 border-neutral-200 border-t-neutral-900 rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Globe size={20} className="text-neutral-400" />
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Interrogating Node</p>
                      <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-1">Tracing packet routes...</p>
                   </div>
                </motion.div>
              ) : data ? (
                <motion.div 
                   key="results"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-8"
                >
                   {/* Main IP Badge */}
                   <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110">
                        <Globe size={160} />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                               <Shield size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Primary Identity</span>
                         </div>
                         <h2 className="text-5xl font-black tracking-tighter mb-4 italic transition-all">{data.ip}</h2>
                         <div className="flex flex-wrap gap-4">
                            <div className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <MapPin size={12} className="text-indigo-400" />
                               {data.city}, {data.country_name}
                            </div>
                            <div className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <Server size={12} className="text-emerald-400" />
                               {data.asn}
                            </div>
                         </div>
                      </div>
                   </div>


                   {/* Grid of details */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <DataField label="Network Org" value={data.org} icon={Wifi} delay={0.1} />
                      <DataField label="Region / State" value={data.region} icon={MapPin} delay={0.2} />
                      <DataField label="Zip Code" value={data.postal} icon={MapPin} delay={0.3} />
                      <DataField label="Coordinate X" value={data.latitude} icon={MapPin} delay={0.4} />
                      <DataField label="Coordinate Y" value={data.longitude} icon={MapPin} delay={0.5} />
                      <DataField label="Time Zone" value={data.timezone} icon={Clock} delay={0.6} />
                      <DataField label="UTC Offset" value={data.utc_offset} icon={Clock} delay={0.7} />
                      <DataField label="Dialing Prefix" value={data.country_calling_code} icon={Info} delay={0.8} />
                      <DataField label="Currency Unit" value={data.currency} icon={Info} delay={0.9} />
                      <DataField label="Locale Codes" value={data.languages} icon={Languages} delay={1.0} />
                   </div>

                   <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300 py-8">
                      Transmission complete // {new Date().toLocaleTimeString()}
                   </p>
                </motion.div>
              ) : null}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

