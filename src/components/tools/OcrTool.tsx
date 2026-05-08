import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Upload, Copy, Check, Download, Languages, Sparkles, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createWorker } from 'tesseract.js';
import OfflineAlert from '../ui/OfflineAlert';

export default function OcrTool() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('eng');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<any>(null);

  useEffect(() => {
    // Kill existing worker if it exists (e.g. language change)
    const cleanup = async () => {
      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }
    };

    const initWorker = async () => {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.floor(m.progress * 100));
          }
        }
      });
      workerRef.current = worker;
    };

    initWorker();
    return () => { cleanup(); };
  }, [language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setText('');
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image || !workerRef.current) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const { data: { text } } = await workerRef.current.recognize(image);
      setText(text);
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-ocr-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="OCR Intelligence" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 text-white rounded-lg">
            <FileText size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">OCR Intelligence</h1>
        </div>
        <p className="text-neutral-500 font-medium">Extract high-precision text from images using edge-based neural recognition.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[400px] ${
              image ? 'border-indigo-500 bg-indigo-50/10' : 'border-neutral-200 hover:border-indigo-400 hover:bg-neutral-50'
            }`}
          >
            {image ? (
              <>
                <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-4" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); setText(''); }}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-lg rounded-full text-neutral-500 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 mx-auto mb-4">
                  <Upload size={32} />
                </div>
                <p className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Drop source asset</p>
                <p className="text-xs text-neutral-400 mt-2 lowercase">JPG, PNG, WebP allowed</p>
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

          <div className="flex items-center gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 h-12 bg-white border border-neutral-200 rounded-xl text-xs font-bold uppercase tracking-widest text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="eng">English (Alpha)</option>
              <option value="fra">French (Beta)</option>
              <option value="deu">German (Beta)</option>
              <option value="spa">Spanish (Beta)</option>
            </select>
            
            <button
              onClick={processImage}
              disabled={!image || isProcessing}
              className={`flex-1 flex items-center justify-center gap-3 h-12 rounded-xl font-black uppercase tracking-widest transition-all ${
                !image || isProcessing 
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Scanning {progress}%</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Extract Intelligence</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col">
          <div className="flex-1 bg-white border border-neutral-100 rounded-3xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <FileText size={12} />
                Extracted Substrate
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyToClipboard}
                  disabled={!text}
                  className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-indigo-600 transition-colors disabled:opacity-30"
                  title="Copy to terminal"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={downloadText}
                  disabled={!text}
                  className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-indigo-600 transition-colors disabled:opacity-30"
                  title="Export raw data"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 relative">
              {isProcessing ? (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-48 h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Reconstructing data layers</span>
                   </div>
                </div>
              ) : null}

              {text ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-full min-h-[400px] resize-none border-none focus:ring-0 text-sm font-medium leading-relaxed text-neutral-700 custom-scrollbar"
                  placeholder="Extracted content will appear here..."
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                  <ImageIcon size={64} strokeWidth={1} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Awaiting source input</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
