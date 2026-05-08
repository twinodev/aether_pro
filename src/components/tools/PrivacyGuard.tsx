import React, { useState, useRef } from 'react';
import { ShieldAlert, Trash2, Image as ImageIcon, Download, Check, Loader2, Sparkles, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert';

export default function PrivacyGuard() {
  const [image, setImage] = useState<{src: string, file: File} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [stats, setStats] = useState<{sizeReduction: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage({
          src: reader.result as string,
          file: file
        });
        setResult(null);
        setStats(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const stripMetadata = async () => {
    if (!image) return;
    setIsProcessing(true);
    
    // Artificial delay to show processing state for UX
    await new Promise(r => setTimeout(r, 1200));

    const img = new Image();
    img.src = image.src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Drawing to canvas loses all EXIF/metadata header segments
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setResult(url);
          
          const sizeReduction = (((image.file.size - blob.size) / image.file.size) * 100).toFixed(1);
          setStats({ sizeReduction: sizeReduction + '%' });
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
    };
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `protected-${image?.file.name || 'image.jpg'}`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="Privacy Guard" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">Privacy Guard</h1>
        </div>
        <p className="text-neutral-500 font-medium lowercase">Anonymize visual assets / strip GPS, device ID, and temporal markers.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`aspect-square md:aspect-auto md:h-[400px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group ${
              image ? 'border-emerald-500 bg-emerald-50/10' : 'border-neutral-200 hover:border-emerald-400 hover:bg-neutral-50'
            }`}
          >
            {image ? (
              <div className="relative w-full h-full p-4">
                <img src={image.src} alt="Source" className="w-full h-full object-contain" />
                {!isProcessing && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); }}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-lg rounded-full text-neutral-500 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center p-8">
                 <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                   <ImageIcon size={32} />
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-neutral-900">Ingest Source Asset</p>
                 <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase">JPG, PNG, WebP supported</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <button 
            onClick={stripMetadata}
            disabled={!image || isProcessing}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all ${
              !image || isProcessing
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Scrubbing Headers...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Execute Sanitization
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="flex flex-col">
          <div className="flex-1 bg-white border border-neutral-100 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm relative">
             <div className="p-4 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/50">
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                 <ShieldAlert size={14} />
                 Sanitized Substrate
               </span>
               {result && (
                 <button 
                   onClick={downloadResult}
                   className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                   title="Export protected file"
                 >
                   <Download size={18} />
                 </button>
               )}
             </div>

             <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div 
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                       <div className="w-16 h-1 bg-emerald-100 rounded-full overflow-hidden mx-auto">
                         <motion.div 
                           className="h-full bg-emerald-600"
                           animate={{ x: [-100, 100] }}
                           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                         />
                       </div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Stripping EXIF headers / Clearing DOM nodes</p>
                    </motion.div>
                  ) : result ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full flex flex-col items-center justify-center gap-6"
                    >
                       <div className="relative group max-w-full">
                         <img src={result} alt="Result" className="max-h-[300px] rounded-xl shadow-lg border border-neutral-100" />
                         <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                           <Check size={16} />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                             <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Status</p>
                             <p className="text-[10px] font-bold text-emerald-600 uppercase">Sanitized</p>
                          </div>
                          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                             <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Decentralized</p>
                             <p className="text-[10px] font-bold text-neutral-900 uppercase">100% EXIF-FREE</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <Info size={14} className="text-emerald-500" />
                          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
                            GPS removed. Device info cleared. {stats?.sizeReduction && `Size optimized by ${stats.sizeReduction}`}
                          </p>
                       </div>
                    </motion.div>
                  ) : (
                    <div className="opacity-20 space-y-4">
                       <ShieldAlert size={64} strokeWidth={1} className="mx-auto" />
                       <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Analysis</p>
                    </div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
