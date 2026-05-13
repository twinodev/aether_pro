import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, StopCircle, FlipHorizontal, Upload, X, CheckCircle2, History, Copy, ExternalLink, QrCode, Tickets, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Smartphone, Store, Printer, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validateTicket } from '../../services/ticketService';
import { validateScan, findProductByBarcode } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';
import OfflineAlert from '../ui/OfflineAlert.tsx';

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
  const { user: authUser } = useAuth();
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string; ticket?: any; scannedAt?: any; isDuplicate?: boolean } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [activeMode, setActiveMode] = useState<'universal' | 'ticket' | 'entry'>('universal');
  
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
    
    if (activeMode === 'ticket' && decodedText.startsWith('TKT-')) {
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
    } else if (activeMode === 'entry') {
      setIsChecking(true);
      // Use general entry validation
      // If we don't have a location, we use a global 'public-entry' or user-specific one
      const targetId = authUser?.uid || 'anonymous';
      const result = await validateScan('global-scanner', targetId, decodedText);
      
      const validation = {
        success: result.success,
        isDuplicate: result.alreadyScanned,
        message: result.alreadyScanned ? 'ALERT: Code already verified!' : result.success ? 'Access Granted' : 'Validation Failed'
      };
      
      setValidationResult(validation);
      setIsChecking(false);

      const newEntry: ScanHistory = {
        data: decodedText,
        timestamp: Date.now(),
        type: 'Entry',
        isValid: result.success
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    } else {
      const newEntry: ScanHistory = {
        data: decodedText,
        timestamp: Date.now(),
        type: decodedText.startsWith('http') ? 'URL' : 'Text'
      };
      
      // Local duplicate check for intelligence
      const localDup = history.find(h => h.data === decodedText);
      if (localDup) {
        setValidationResult({
          success: false,
          isDuplicate: true,
          message: 'LOCAL DUPLICATE: This code was scanned earlier in this session.'
        });
      }

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
        <OfflineAlert toolName={activeMode !== 'universal' ? "Gatekeeper Entry" : "Omni Scanner"} />
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 text-white rounded-lg">
                <Camera size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Omni Scanner</h1>
           </div>
           
           <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-neutral-100 shadow-sm">
             <button 
               onClick={() => {
                 setActiveMode('universal');
                 setScanResult(null);
                 setValidationResult(null);
               }}
               className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeMode === 'universal' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-50'}`}
             >
               Universal
             </button>
             <button 
               onClick={() => {
                 setActiveMode('ticket');
                 setScanResult(null);
                 setValidationResult(null);
               }}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeMode === 'ticket' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-neutral-400 hover:bg-neutral-50'}`}
             >
               <Tickets size={12} />
               Ticketing
             </button>
             <button 
               onClick={() => {
                 setActiveMode('entry');
                 setScanResult(null);
                 setValidationResult(null);
               }}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeMode === 'entry' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-neutral-400 hover:bg-neutral-50'}`}
             >
               <Store size={12} />
               Duka Entry
             </button>
           </div>
        </div>
        <p className="text-neutral-500">
          {activeMode === 'ticket' ? 'Validate event tickets with fraud detection.' : 
           activeMode === 'entry' ? 'Track one-time use access codes and entries.' : 
           'Scan any standard QR or Barcode format.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Component */}
        <section className="space-y-4">
          <div className="card bg-neutral-900 overflow-hidden relative aspect-square max-w-sm mx-auto group">
             <div id="scanner-container" className="w-full h-full" />
             
             {activeMode !== 'universal' && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                   <div className={`px-3 py-1 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-pulse ${activeMode === 'ticket' ? 'bg-rose-500' : 'bg-emerald-600'}`}>
                      <Zap size={10} />
                      {activeMode === 'ticket' ? 'Live Ticket Validator' : 'Duka Access Terminal'}
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
                        {activeMode === 'ticket' ? <Tickets size={32} /> : activeMode === 'entry' ? <Store size={32} /> : <Camera size={32} />}
                    </div>
                    <div>
                        <p className="font-bold uppercase tracking-widest text-xs mb-2">Ready to Scan</p>
                        <p className="text-sm text-neutral-400">
                           {activeMode === 'ticket' ? 'Position ticket code for instant validation' : 
                            activeMode === 'entry' ? 'Verify entry permits and digital passes' :
                            'Position the code within the frame or upload a file.'}
                        </p>
                    </div>
                    <button onClick={startScanning} className={`btn-primary w-full ${activeMode === 'ticket' ? 'bg-rose-500 text-white hover:bg-rose-600 border-none' : activeMode === 'entry' ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-none' : 'bg-white text-neutral-900 hover:bg-neutral-100'}`}>
                      {activeMode !== 'universal' ? 'Activate Sensor' : 'Start Camera'}
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
               animate={{ 
                 scale: validationResult?.isDuplicate ? [0.9, 1.05, 1] : 1,
                 opacity: 1,
                 rotate: validationResult?.isDuplicate ? [-1, 1, -1, 1, 0] : 0
               }}
               transition={{ duration: validationResult?.isDuplicate ? 0.3 : 0.2 }}
               className={`card p-6 border-neutral-900 bg-neutral-900 text-white shadow-xl ${
                 validationResult ? (
                   validationResult.isDuplicate ? 'ring-8 ring-rose-600/40 relative' :
                   validationResult.success ? 'ring-4 ring-emerald-500/20' : 'ring-4 ring-rose-500/20'
                 ) : ''
               }`}
            >
               {validationResult?.isDuplicate && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: [0.1, 0.4, 0.1] }}
                   transition={{ repeat: Infinity, duration: 1 }}
                   className="absolute inset-0 bg-rose-600 pointer-events-none rounded-[2rem]"
                 />
               )}

               <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    {validationResult ? (
                      validationResult.isDuplicate ? <AlertTriangle size={18} className="text-rose-400 animate-bounce" /> :
                      validationResult.success ? <ShieldCheck size={18} className="text-emerald-400" /> : <ShieldAlert size={18} className="text-rose-400" />
                    ) : (
                      <CheckCircle2 size={18} className="text-cyan-400" />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${validationResult?.isDuplicate ? 'text-rose-400' : ''}`}>
                       {validationResult ? (
                         validationResult.isDuplicate ? 'SEC_ALERT: DUPLICATE_ENTRY' :
                         validationResult.success ? 'Verified Valid' : 'Validation Failed'
                       ) : 'Data Payload Captured'}
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
                          <h4 className={`text-xl font-black italic tracking-tighter uppercase ${validationResult.isDuplicate ? 'text-rose-500' : ''}`}>
                             {validationResult.isDuplicate ? 'CRITICAL_REPEAT' : (validationResult.ticket?.eventTitle || 'Legacy System Ticket')}
                          </h4>
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${validationResult.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                             {validationResult.success && !validationResult.isDuplicate ? 'Authorized' : 'Hold Entry'}
                          </span>
                       </div>
                       
                       <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${validationResult.isDuplicate ? 'text-rose-400' : 'text-neutral-400'}`}>
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
