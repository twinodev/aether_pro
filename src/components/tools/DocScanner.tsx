import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Download, Layers, Eraser, Maximize, RotateCcw, FileText, Image as ImageIcon, Crop, FileDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import OfflineAlert from '../ui/OfflineAlert.tsx';

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
];

export default function DocScanner() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ScanFilter>(FILTERS[0]);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 }); // Percentages
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please check permissions in your browser settings.");
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
    
    setCapturedImage(canvasRef.current.toDataURL('image/jpeg'));
    stopCamera();
  };

  const applyCrop = () => {
    if (!capturedImage || !canvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      const realX = (cropBox.x / 100) * img.width;
      const realY = (cropBox.y / 100) * img.height;
      const realW = (cropBox.w / 100) * img.width;
      const realH = (cropBox.h / 100) * img.height;

      canvas.width = realW;
      canvas.height = realH;
      ctx.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);
      
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      setIsCropping(false);
    };
    img.src = capturedImage;
  };

  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const downloadImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `scan-${Date.now()}.jpg`;
    link.href = capturedImage;
    link.click();
  };

  const downloadPDF = () => {
    if (!capturedImage) return;
    const pdf = new jsPDF();
    const img = new Image();
    img.onload = () => {
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

      pdf.addImage(capturedImage, 'JPEG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
      pdf.save(`scan-${Date.now()}.pdf`);
    };
    img.src = capturedImage;
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="Document Intelligence" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neutral-900 text-white rounded-lg">
            <FileText size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Doc Scanner</h1>
        </div>
        <p className="text-neutral-500">Capture and enhance document copies instantly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Viewport */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative aspect-[3/4] bg-neutral-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            {error && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-8 text-center gap-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <Camera size={32} />
                </div>
                <p className="text-sm font-medium text-red-600">{error}</p>
                <button onClick={startCamera} className="btn-secondary text-xs uppercase tracking-widest font-bold">Try Again</button>
              </div>
            )}
            {!capturedImage ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-8 top-16 bottom-16 border-2 border-white/50 border-dashed rounded-xl pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-t-2 border-l-2 border-white/80 absolute top-0 left-0" />
                    <div className="w-16 h-16 border-t-2 border-r-2 border-white/80 absolute top-0 right-0" />
                    <div className="w-16 h-16 border-b-2 border-l-2 border-white/80 absolute bottom-0 left-0" />
                    <div className="w-16 h-16 border-b-2 border-r-2 border-white/80 absolute bottom-0 right-0" />
                  </div>
                </div>
                <div className="absolute bottom-8 inset-x-0 flex justify-center">
                  <button 
                    onClick={captureFrame}
                    className="w-16 h-16 bg-white rounded-full border-4 border-white/30 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 border-2 border-neutral-900 rounded-full" />
                  </button>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden">
                <motion.img 
                  animate={{ rotate: rotation }}
                  src={capturedImage} 
                  className={`max-w-full max-h-full object-contain ${activeFilter.css} transition-all duration-300`}
                  alt="Scanned doc"
                />
                
                {isCropping && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div 
                      className="border-2 border-white ring-1 ring-black/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move transition-all"
                      style={{
                        position: 'absolute',
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.w}%`,
                        height: `${cropBox.h}%`
                      }}
                    >
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-white" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white" />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {capturedImage && (
            <div className="flex gap-2 shrink-0 overflow-x-auto pb-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeFilter.id === f.id 
                      ? 'bg-neutral-900 border-neutral-900 text-white' 
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-2 border-neutral-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Controls</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {capturedImage ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={downloadImage} className="btn-primary w-full shadow-lg shadow-neutral-900/10">
                      <Download size={18} /> JPG
                    </button>
                    <button onClick={downloadPDF} className="btn-primary w-full shadow-lg shadow-neutral-900/10 flex items-center justify-center gap-2">
                      <FileDown size={18} /> PDF
                    </button>
                  </div>
                  
                  {isCropping ? (
                    <button onClick={applyCrop} className="btn-secondary w-full bg-emerald-50 text-emerald-600 border-emerald-100">
                      <Check size={18} /> Apply Crop
                    </button>
                  ) : (
                    <button onClick={() => setIsCropping(true)} className="btn-secondary w-full">
                      <Crop size={18} /> Crop Tool
                    </button>
                  )}
                  
                  <button onClick={rotate} className="btn-secondary w-full">
                    <RotateCcw size={18} /> Rotate 90°
                  </button>
                  <button onClick={() => { setCapturedImage(null); startCamera(); setIsCropping(false); }} className="btn-secondary w-full text-red-500 border-red-50 transition-colors">
                    <Eraser size={18} /> Retake
                  </button>
                </>
              ) : (
                <button onClick={startCamera} className="btn-secondary w-full">
                  <Camera size={18} /> Wake Camera
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-blue-900">
              <Layers size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Scanner Tips</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-700/80">
              For best results, place your document on a high-contrast background. Use the "B&W High" filter for text documents and "Crop" to remove messy edges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
