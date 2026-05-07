import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, StopCircle, FlipHorizontal, Upload, X, CheckCircle2, History, Copy, ExternalLink, QrCode, Tickets, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validateTicket } from '../../services/ticketService';

interface ScanHistory {
  data: string;
  timestamp: number;
  type: string;
  isTicket?: boolean;
  isValid?: boolean;
}

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isTicketMode, setIsTicketMode] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string; ticket?: any; scannedAt?: any } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setValidationResult(null);
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;
      
      setIsScanning(true);
      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // ignore failures as they are constant during scanning
        }
      );
    } catch (err) {
      setError('Could not start camera. Please ensure permissions are granted.');
      setIsScanning(false);
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleSuccess = async (decodedText: string) => {
    setScanResult(decodedText);
    
    if (isTicketMode && decodedText.startsWith('TKT-')) {
      setIsChecking(true);
      const result = await validateTicket(decodedText);
      setValidationResult(result);
      setIsChecking(false);
      
      const newEntry: ScanHistory = {
        data: decodedText,
        timestamp: Date.now(),
        type: 'Ticket',
        isTicket: true,
        isValid: result.success
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    } else {
      const newEntry: ScanHistory = {
        data: decodedText,
        timestamp: Date.now(),
        type: decodedText.startsWith('http') ? 'URL' : 'Text'
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('scanner-container');
      const decodedText = await scanner.scanFile(file, true);
      handleSuccess(decodedText);
    } catch (err) {
      setError('No QR code or Barcode found in image.');
    }
  };

  const copyResult = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult);
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isScanning) {
      stopScanning().then(() => startScanning());
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8 font-sans">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 text-white rounded-lg">
                <Camera size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">QR & Barcode Scanner</h1>
           </div>
           
           <button 
             onClick={() => {
               setIsTicketMode(!isTicketMode);
               setScanResult(null);
               setValidationResult(null);
             }}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isTicketMode ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
           >
              <Tickets size={14} />
              Event Ticket Mode: {isTicketMode ? 'ACTIVE' : 'OFF'}
           </button>
        </div>
        <p className="text-neutral-500">Scan any code or validate event tickets in real-time.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Component */}
        <section className="space-y-4">
          <div className="card bg-neutral-900 overflow-hidden relative aspect-square max-w-sm mx-auto group">
             <div id="scanner-container" className="w-full h-full" />
             
             {isTicketMode && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                   <div className="px-3 py-1 bg-indigo-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-pulse">
                      <Zap size={10} />
                      Live Validator
                   </div>
                </div>
             )}
             
             <AnimatePresence>
                {!isScanning && !scanResult && !isChecking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white p-8 text-center gap-6"
                  >
                    <div className="w-16 h-16 border-2 border-neutral-700 rounded-2xl flex items-center justify-center text-neutral-500">
                        {isTicketMode ? <Tickets size={32} /> : <Camera size={32} />}
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-widest text-xs mb-2">Ready to Scan</p>
                        <p className="text-sm text-neutral-400">
                           {isTicketMode ? 'Position ticket code for instant validation' : 'Position the code within the frame or upload a file.'}
                        </p>
                    </div>
                    <button onClick={startScanning} className={`btn-primary w-full ${isTicketMode ? 'bg-indigo-500 text-white hover:bg-indigo-600 border-none' : 'bg-white text-neutral-900 hover:bg-neutral-100'}`}>
                      {isTicketMode ? 'Open Gate Access' : 'Start Camera'}
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold uppercase tracking-tighter hover:text-white transition-colors flex items-center gap-2">
                      <Upload size={14} />
                      Upload image instead
                    </button>
                  </motion.div>
                )}

                {isChecking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm text-white p-8 text-center gap-6 z-20"
                  >
                    <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Registry...</p>
                  </motion.div>
                )}
             </AnimatePresence>

             {isScanning && (
               <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                  <button onClick={stopScanning} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                    <StopCircle size={24} />
                  </button>
                  <button onClick={switchCamera} className="p-3 bg-white text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors shadow-lg">
                    <FlipHorizontal size={24} />
                  </button>
               </div>
             )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100"
            >
              <div className="flex items-center gap-2">
                <X size={14} />
                {error}
              </div>
            </motion.div>
          )}

          {scanResult && (
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className={`card p-6 border-neutral-900 bg-neutral-900 text-white shadow-xl ${validationResult ? (validationResult.success ? 'ring-4 ring-emerald-500/20' : 'ring-4 ring-red-500/20') : ''}`}
            >
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {validationResult ? (
                      validationResult.success ? <ShieldCheck size={18} className="text-emerald-400" /> : <ShieldAlert size={18} className="text-red-400" />
                    ) : (
                      <CheckCircle2 size={18} className="text-indigo-400" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                       {validationResult ? (validationResult.success ? 'Verified Valid' : 'Validation Failed') : 'Data Payload Captured'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setScanResult(null);
                      setValidationResult(null);
                    }} 
                    className="p-1 hover:bg-neutral-800 rounded-md transition-colors"
                  >
                     <X size={18} />
                  </button>
               </div>
               
               {validationResult ? (
                 <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black italic tracking-tighter uppercase">{validationResult.ticket?.eventTitle || 'Legacy System Ticket'}</h4>
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${validationResult.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                             {validationResult.success ? 'Authorized' : 'Rejected'}
                          </span>
                       </div>
                       
                       <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                          {validationResult.message}
                          {validationResult.scannedAt && ` • Original scan: ${validationResult.scannedAt.toLocaleTimeString()}`}
                       </p>

                       {validationResult.success && (
                         <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-neutral-500">Holder:</span>
                               <span className="text-white">{validationResult.ticket.customerName}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-neutral-500">Pass:</span>
                               <span className="text-indigo-400">{validationResult.ticket.ticketType}</span>
                            </div>
                         </div>
                       )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        setScanResult(null);
                        setValidationResult(null);
                        startScanning();
                      }}
                      className="w-full py-4 bg-white text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all font-sans"
                    >
                       Clear & Next Session
                    </button>
                 </div>
               ) : (
                 <>
                   <p className="text-lg font-mono break-all mb-6 bg-neutral-800 p-4 rounded-xl border border-neutral-700">{scanResult}</p>
                   
                   <div className="flex gap-3">
                      <button onClick={copyResult} className="btn-secondary flex-1 bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
                        <Copy size={16} />
                        Copy
                      </button>
                      {scanResult.startsWith('http') && (
                        <a 
                          href={scanResult} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-primary flex-1 bg-white text-neutral-900 hover:bg-neutral-100"
                        >
                          <ExternalLink size={16} />
                          Open
                        </a>
                      )}
                   </div>
                 </>
               )}
            </motion.div>
          )}
        </section>

        {/* History */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                 <History size={16} />
                 Recent Scans
              </h3>
              {history.length > 0 && (
                <button onClick={() => setHistory([])} className="text-[10px] font-bold uppercase text-neutral-300 hover:text-neutral-900 transition-colors">
                    Clear History
                </button>
              )}
           </div>

           <div className="space-y-3">
              {history.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-neutral-100 rounded-2xl flex flex-col items-center justify-center text-neutral-300">
                   <QrCode size={40} className="mb-4 opacity-50" />
                   <p className="text-xs font-bold uppercase tracking-widest">No history yet</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.timestamp}
                    className="p-4 bg-white border border-neutral-100 rounded-xl flex items-center justify-between group hover:border-neutral-300 transition-all hover:shadow-sm"
                  >
                     <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.type} • {new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="text-sm font-medium text-neutral-900 truncate pr-4">{item.data}</span>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => navigator.clipboard.writeText(item.data)}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900"
                          >
                            <Copy size={14} />
                         </button>
                         {item.data.startsWith('http') && (
                            <a 
                                href={item.data} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900"
                            >
                                <ExternalLink size={14} />
                            </a>
                         )}
                     </div>
                  </motion.div>
                ))
              )}
           </div>
        </section>
      </div>
    </div>
  );
}
