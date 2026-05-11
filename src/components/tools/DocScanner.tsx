import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, RefreshCw, Download, RotateCcw, FileText, Image as ImageIcon, Crop, 
  Check, Plus, Trash2, Grid3X3, Archive, X, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import OfflineAlert from '../ui/OfflineAlert.tsx';

interface ScannedPage {
  id: string;
  image: string;
  originalImage: string;
  filterId: string;
  rotation: number;
  points: {
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    bl: { x: number; y: number };
    br: { x: number; y: number };
  };
}

interface ScanFilter {
  name: string;
  id: string;
  css: string;
}

const FILTERS: ScanFilter[] = [
  { name: 'Original', id: 'original', css: '' },
  { name: 'Grayscale', id: 'grayscale', css: 'grayscale brightness-110 contrast-125' },
  { name: 'B&W High', id: 'bw', css: 'contrast-[200%] brightness-[120%] grayscale' },
  { name: 'Contrast', id: 'contrast', css: 'contrast-150 brightness-110' },
  { name: 'Vibrant', id: 'vibrant', css: 'saturate-150 brightness-110 contrast-110' },
];

export default function DocScanner() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(-1);
  const [isCapturing, setIsCapturing] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const [isCropping, setIsCropping] = useState(false);
  const [points, setPoints] = useState({
    tl: { x: 10, y: 10 },
    tr: { x: 90, y: 10 },
    bl: { x: 10, y: 90 },
    br: { x: 90, y: 90 }
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      if (stream) stopCamera();
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.95);
    
    const newPage: ScannedPage = {
      id: Math.random().toString(36).substring(7),
      image: imageData,
      originalImage: imageData,
      filterId: 'original',
      rotation: 0,
      points: {
        tl: { x: 5, y: 5 },
        tr: { x: 95, y: 5 },
        bl: { x: 5, y: 95 },
        br: { x: 95, y: 95 }
      }
    };

    const newPages = [...pages, newPage];
    setPages(newPages);
    setActivePageIndex(newPages.length - 1);
    setIsCapturing(false);
    stopCamera();
  };

  const deletePage = (index: number) => {
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (newPages.length === 0) {
      setIsCapturing(true);
      startCamera();
    } else if (activePageIndex === index) {
      setActivePageIndex(Math.max(0, index - 1));
    }
  };

  const applyCrop = () => {
    if (activePageIndex === -1) return;
    
    const page = pages[activePageIndex];
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const minX = Math.min(points.tl.x, points.bl.x, points.tr.x, points.br.x);
      const maxX = Math.max(points.tl.x, points.bl.x, points.tr.x, points.br.x);
      const minY = Math.min(points.tl.y, points.bl.y, points.tr.y, points.br.y);
      const maxY = Math.max(points.tl.y, points.bl.y, points.tr.y, points.br.y);

      const realX = (minX / 100) * img.width;
      const realY = (minY / 100) * img.height;
      const realW = ((maxX - minX) / 100) * img.width;
      const realH = ((maxY - minY) / 100) * img.height;

      canvas.width = realW;
      canvas.height = realH;
      ctx.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);
      
      const newImage = canvas.toDataURL('image/jpeg', 0.9);
      const updatedPages = [...pages];
      updatedPages[activePageIndex] = {
        ...page,
        image: newImage,
        points: { ...points }
      };
      setPages(updatedPages);
      setIsCropping(false);
    };
    img.src = page.originalImage;
  };

  const rotate = () => {
    if (activePageIndex === -1) return;
    const updatedPages = [...pages];
    const page = updatedPages[activePageIndex];
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.height;
      canvas.height = img.width;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const newImage = canvas.toDataURL('image/jpeg', 0.9);
      updatedPages[activePageIndex] = {
        ...page,
        image: newImage,
        originalImage: newImage,
        rotation: (page.rotation + 90) % 360
      };
      setPages(updatedPages);
    };
    img.src = page.image;
  };

  const updateFilter = (filterId: string) => {
    if (activePageIndex === -1) return;
    const updatedPages = [...pages];
    updatedPages[activePageIndex].filterId = filterId;
    setPages(updatedPages);
  };

  const downloadAllAsPDF = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    
    try {
      const pdf = new jsPDF();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) pdf.addPage();
        
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = page.image;
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        
        let w = pageWidth;
        let h = pageHeight;
        if (imgRatio > pageRatio) {
          h = pageWidth / imgRatio;
        } else {
          w = pageHeight * imgRatio;
        }

        const filter = FILTERS.find(f => f.id === page.filterId);
        // JS PDF doesn't support CSS filters easily, but B&W/Grayscale can be done in canvas if needed.
        // For now we add the image as is.
        pdf.addImage(page.image, 'JPEG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
      }
      pdf.save(`aether-scan-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePointDrag = (point: 'tl' | 'tr' | 'bl' | 'br', e: any, info: any) => {
    const parent = cropRef.current?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    
    setPoints(prev => {
      const next = { ...prev };
      const dx = (info.delta.x / rect.width) * 100;
      const dy = (info.delta.y / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100, next[point].x + dx));
      const newY = Math.max(0, Math.min(100, next[point].y + dy));
      
      next[point] = { x: newX, y: newY };
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      const newPage: ScannedPage = {
        id: Math.random().toString(36).substring(7),
        image: imageData,
        originalImage: imageData,
        filterId: 'original',
        rotation: 0,
        points: {
          tl: { x: 5, y: 5 },
          tr: { x: 95, y: 5 },
          bl: { x: 5, y: 95 },
          br: { x: 95, y: 95 }
        }
      };

      const newPages = [...pages, newPage];
      setPages(newPages);
      setActivePageIndex(newPages.length - 1);
      setIsCapturing(false);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activePageIndex !== -1 && pages[activePageIndex] && !isCropping) {
      setPoints(pages[activePageIndex].points);
    }
  }, [activePageIndex, pages, isCropping]);

  useEffect(() => {
    if (isCapturing) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCapturing, facingMode]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-8 font-sans">
        <OfflineAlert toolName="Document Intelligence v2" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg">
                <FileText size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Intelligence Scanner</h1>
            </div>
            <p className="text-neutral-500 text-sm">Next-gen multi-page document capture and refinement.</p>
          </div>
          
          {pages.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Captured Pages</span>
                <span className="text-lg font-black">{pages.length}</span>
              </div>
              <button 
                onClick={downloadAllAsPDF}
                disabled={isProcessing}
                className="btn-primary px-6 h-12 flex items-center gap-2 shadow-xl shadow-rose-500/20"
              >
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Archive size={18} />}
                Export PDF
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Library Column */}
        <div className="lg:col-span-3 space-y-4 font-sans">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Library</h3>
            <button onClick={() => { setIsCapturing(true); setActivePageIndex(-1); }} className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1 hover:scale-105 transition-transform">
              <Plus size={12} /> Add Page
            </button>
          </div>
          
          <div className="space-y-3 lg:h-[600px] overflow-y-auto pr-2 scrollbar-hide flex lg:flex-col gap-3 lg:gap-0">
            {pages.map((page, idx) => (
              <motion.div 
                key={page.id}
                layoutId={page.id}
                onClick={() => { setActivePageIndex(idx); setIsCapturing(false); }}
                className={`relative aspect-[3/4] min-w-[120px] lg:min-w-0 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group shrink-0 ${
                  activePageIndex === idx ? 'border-neutral-900 dark:border-white shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={page.image} className="w-full h-full object-cover" alt={`Page ${idx + 1}`} />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Page {idx + 1}</span>
                </div>
              </motion.div>
            ))}
            {pages.length === 0 && (
              <div className="w-full h-full border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[2rem] flex flex-col items-center justify-center text-neutral-300 p-8 text-center min-h-[200px]">
                <Grid3X3 size={40} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No data captured yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 lg:border-8 border-white dark:border-neutral-800">
            <AnimatePresence mode="wait">
              {isCapturing ? (
                <motion.div 
                  key="shutter"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[85%] border-2 border-white/40 border-dashed rounded-2xl relative">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-rose-500 rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-rose-500 rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-rose-500 rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-rose-500 rounded-br-xl" />
                    </div>
                  </div>
                  <div className="absolute bottom-8 inset-x-0 flex justify-center items-center gap-6">
                     <label className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
                        <ImageIcon size={24} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                     </label>
                     <button 
                       onClick={captureFrame}
                       className="w-20 h-20 bg-white rounded-full border-4 border-rose-500/30 flex items-center justify-center shadow-2xl active:scale-90 transition-transform group"
                     >
                       <div className="w-16 h-16 border-2 border-neutral-900 rounded-full group-hover:scale-95 transition-transform" />
                     </button>
                     <button 
                       onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                       className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                     >
                        <RefreshCw size={24} />
                     </button>
                  </div>
                  {error && (
                    <div className="absolute inset-0 bg-white dark:bg-neutral-900 z-50 flex flex-col items-center justify-center p-12 text-center gap-4">
                      <AlertTriangle size={48} className="text-rose-500" />
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{error}</p>
                      <button onClick={startCamera} className="btn-primary px-8">Grant Camera Access</button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={activePageIndex === -1 ? 'empty' : pages[activePageIndex]?.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full flex items-center justify-center bg-neutral-900 group"
                >
                  {activePageIndex !== -1 && pages[activePageIndex] && (
                    <>
                      <img 
                        src={isCropping ? pages[activePageIndex].originalImage : pages[activePageIndex].image} 
                        className={`max-w-full max-h-full object-contain ${FILTERS.find(f => f.id === pages[activePageIndex].filterId)?.css || ''} transition-all duration-300`}
                        alt="Editing doc"
                      />
                      {isCropping && (
                        <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center overflow-hidden touch-none">
                          <div className="relative w-full h-full flex items-center justify-center" ref={cropRef}>
                             <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                               <path 
                                 d={`M ${points.tl.x}% ${points.tl.y}% L ${points.tr.x}% ${points.tr.y}% L ${points.br.x}% ${points.br.y}% L ${points.bl.x}% ${points.bl.y}% Z`}
                                 fill="rgba(244, 63, 94, 0.2)"
                                 stroke="#f43f5e"
                                 strokeWidth="3"
                                 strokeDasharray="5,5"
                               />
                               {/* Shadow overlay points */}
                               <mask id="crop-mask">
                                 <rect width="100%" height="100%" fill="white" />
                                 <path 
                                   d={`M ${points.tl.x}% ${points.tl.y}% L ${points.tr.x}% ${points.tr.y}% L ${points.br.x}% ${points.br.y}% L ${points.bl.x}% ${points.bl.y}% Z`}
                                   fill="black"
                                 />
                               </mask>
                             </svg>
                             
                             {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
                               <motion.div 
                                 key={pos}
                                 drag
                                 dragMomentum={false}
                                 onDrag={(e, info) => handlePointDrag(pos, e, info)}
                                 style={{
                                   position: 'absolute',
                                   left: `${points[pos].x}%`,
                                   top: `${points[pos].y}%`,
                                   x: '-50%',
                                   y: '-50%'
                                 }}
                                 className="w-12 h-12 flex items-center justify-center z-40 cursor-move"
                               >
                                 <div className="w-8 h-8 bg-white border-4 border-rose-500 rounded-full shadow-xl flex items-center justify-center">
                                   <div className="w-2 h-2 bg-rose-500 rounded-full" />
                                 </div>
                               </motion.div>
                             ))}
                          </div>
                        </div>
                      )}
                      {!isCropping && (
                        <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={rotate} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors">
                            <RotateCcw size={20} />
                          </button>
                          <button onClick={() => setIsCropping(true)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors">
                            <Crop size={20} />
                          </button>
                          <button onClick={() => deletePage(activePageIndex)} className="p-3 bg-rose-500/20 hover:bg-rose-500 text-white rounded-2xl backdrop-blur-md transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {!isCapturing && activePageIndex !== -1 && (
            <div className="flex gap-2 p-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-x-auto scrollbar-hide font-sans">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => updateFilter(f.id)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    pages[activePageIndex].filterId === f.id 
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-none' 
                      : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Actions */}
        <div className="lg:col-span-3 space-y-6 font-sans">
          <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Operations</h3>
            <div className="space-y-3">
              {isCropping ? (
                <button onClick={applyCrop} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Check size={16} /> Confirm Crop
                </button>
              ) : (
                <button onClick={() => setIsCapturing(true)} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20">
                  <Plus size={16} /> Add New Page
                </button>
              )}
              {!isCropping && activePageIndex !== -1 && (
                <button onClick={() => setIsCropping(true)} className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                  <Crop size={16} /> Refine Crop
                </button>
              )}
            </div>
          </section>

          <section className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[2.5rem] p-8 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={16} className="text-neutral-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Scanner Info</span>
             </div>
             <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">
               This edge-ready scanner allows for high resolution multi-page document capture with real-time perspective correction and enhancement filters.
             </p>
             <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[9px] font-bold text-neutral-400 uppercase">Pro Tip</p>
                <p className="text-[10px] text-neutral-500">Hold the camera steady for 1 second before capturing to ensure focus.</p>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
