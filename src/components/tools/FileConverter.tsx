import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Download, FileAudio, FileVideo, FileImage, FileCode, Upload, Trash2, Check, Loader2, AlertCircle, FileType } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CONVERSION_MAP: Record<string, string[]> = {
  'image/jpeg': ['png', 'webp', 'pdf'],
  'image/png': ['jpg', 'webp', 'pdf'],
  'image/webp': ['jpg', 'png', 'pdf'],
  'audio/mpeg': ['wav', 'aac', 'ogg'],
  'audio/wav': ['mp3', 'aac', 'ogg'],
  'video/mp4': ['mp3', 'avi', 'mov', 'webp'],
  'video/quicktime': ['mp4', 'mp3', 'webp'],
};

export default function FileConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [targetExt, setTargetExt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFfmpeg, setHasFfmpeg] = useState(false);
  
  const ffmpegRef = useRef(new FFmpeg());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFFmpeg = async () => {
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setHasFfmpeg(true);
    } catch (err) {
      console.error('FFmpeg failed to load:', err);
      setHasFfmpeg(false);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setTargetExt('');
      setResultUrl(null);
      setProgress(0);
      setError(null);
    }
  };

  const convertWithCanvas = async (file: File, target: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        // Handle PDF separately or via canvas? 
        // Canvas to PDF is tricky with just native. 
        // We can use jsPDF if needed, but for now let's handle image types.
        let type = `image/${target === 'jpg' ? 'jpeg' : target}`;
        const dataUrl = canvas.toDataURL(type);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const convert = async () => {
    if (!file || !targetExt) return;

    const isImageConversion = file.type.startsWith('image/') && ['jpg', 'png', 'webp'].includes(targetExt);
    
    // If it's a simple image conversion, we can bypass FFmpeg entirely for speed and reliability
    if (isImageConversion) {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      try {
        const result = await convertWithCanvas(file, targetExt);
        setResultUrl(result);
        setProgress(100);
        return;
      } catch (err) {
        console.error('Canvas conversion failed, falling back to FFmpeg if loaded', err);
      } finally {
        setIsProcessing(false);
      }
    }

    // Otherwise, use FFmpeg
    if (!hasFfmpeg) {
      setError('The high-performance FFmpeg Engine is not available. This is usually due to browser security restrictions (SharedArrayBuffer). Image conversions still work via the fallback engine, but audio/video processing is disabled.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const ffmpeg = ffmpegRef.current;
    const inputName = file.name;
    const outputName = `output.${targetExt}`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Simple conversion command
      await ffmpeg.exec(['-i', inputName, outputName]);
      
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: `image/${targetExt}` })); // Generic mime for blob
      
      setResultUrl(url);
    } catch (err) {
      console.error(err);
      setError('Conversion failed. Some file types may require specific codecs not available in this build.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTargetOptions = () => {
    if (!file) return [];
    
    // Check exact mime
    if (CONVERSION_MAP[file.type]) {
      return CONVERSION_MAP[file.type];
    }
    
    // Fallback based on category
    if (file.type.startsWith('image/')) return ['jpg', 'png', 'webp', 'pdf'];
    if (file.type.startsWith('audio/')) return ['mp3', 'wav', 'aac'];
    if (file.type.startsWith('video/')) return ['mp4', 'mp3', 'gif', 'avi'];
    
    return [];
  };

  const clear = () => {
    setFile(null);
    setTargetExt('');
    setResultUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <FileImage size={32} />;
    if (mime.startsWith('audio/')) return <FileAudio size={32} />;
    if (mime.startsWith('video/')) return <FileVideo size={32} />;
    return <FileCode size={32} />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-600/10">
            <RefreshCw size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Media Forge</h1>
            <p className="text-xs font-black tracking-[0.3em] text-neutral-400">Local Privacy Engine</p>
          </div>
        </div>
        <p className="text-neutral-500 max-w-lg leading-relaxed font-medium">
          Professional grade file conversion for assets. Your data remains in the safety of your local environment via Wasm-accelerated FFmpeg.
        </p>
      </header>

      {!isLoaded && !error && (
        <div className="card p-20 flex flex-col items-center justify-center gap-6 text-neutral-300">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-neutral-100 border-t-rose-600 rounded-full"
          />
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Calibrating Engine</p>
            <p className="text-xs font-medium text-neutral-400">Loading FFmpeg Core (0.12.6)...</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="card p-16 text-center space-y-8 bg-rose-50/30">
          <div className="mx-auto w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center font-black text-3xl">!</div>
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-rose-950">Engine Stall</h3>
            <p className="text-sm text-rose-800/60 max-w-sm mx-auto font-medium leading-relaxed">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="btn-secondary transition-all hover:bg-rose-100 border-rose-200 text-rose-600 mx-auto">
            Try Restart
          </button>
        </div>
      ) : isLoaded && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Config Area */}
          <div className="lg:col-span-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Upload Card */}
                <div className="card p-6 md:col-span-2 flex flex-col gap-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">01 Selection</h3>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all ${
                            file ? 'border-rose-600 bg-rose-50/20' : 'border-neutral-100 bg-neutral-50/30 hover:border-rose-300 hover:bg-white'
                        }`}
                    >
                        {file ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="p-4 bg-white text-rose-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                    {getFileIcon(file.type)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-neutral-900 truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(1)} MB • {file.type.split('/')[1] || 'FILE'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white text-neutral-300 rounded-2xl shadow-sm group-hover:text-rose-600 transition-colors">
                                    <Upload size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Deploy Media</p>
                                    <p className="text-[10px] font-medium text-neutral-300 mt-1">Tap to browse files</p>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                </div>

                {/* format card */}
                <div className="card p-6 flex flex-col gap-6 md:col-span-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">02 Target</h3>
                    {file ? (
                        <div className="flex flex-wrap gap-3">
                            {getTargetOptions().map(ext => (
                                <button
                                    key={ext}
                                    onClick={() => setTargetExt(ext)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                                        targetExt === ext 
                                            ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-600/20' 
                                            : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300 hover:text-neutral-900'
                                    }`}
                                >
                                    {ext}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-neutral-50 rounded-3xl">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-200">Waiting for file</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <button 
                  onClick={convert}
                  disabled={!file || !targetExt || isProcessing}
                  className="btn-primary w-full md:w-auto md:min-w-[240px] bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-600/10 h-16 rounded-3xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Processing {progress}%
                    </>
                  ) : (
                    <>
                      <RefreshCw size={24} />
                      Forge Result
                    </>
                  )}
                </button>
                <button 
                    onClick={clear}
                    disabled={isProcessing || !file}
                    className="btn-secondary h-16 px-6 aspect-square rounded-3xl text-neutral-400"
                >
                    <Trash2 size={24} />
                </button>
                
                <div className="flex-1 px-6 py-4 bg-neutral-100 rounded-3xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${hasFfmpeg ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                            {hasFfmpeg ? 'FFmpeg Core Active' : 'Native Browser Engine Fallback'}
                        </span>
                     </div>
                     <span className="text-[10px] font-medium text-neutral-400 underline decoration-dotted">Bypass Cloud</span>
                </div>
            </div>

            {/* Processing / Result Area */}
            <AnimatePresence mode="wait">
                {(isProcessing || resultUrl) && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="card p-1 md:p-12 min-h-[300px] flex items-center justify-center bg-neutral-900 border-neutral-800 shadow-2xl relative overflow-hidden"
                    >
                        {/* Grid Pattern Overlay */}
                        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        {isProcessing ? (
                            <div className="relative z-10 space-y-8 text-center">
                                <div className="relative w-40 h-40 mx-auto">
                                    <svg className="w-full h-full rotate-[-90deg]">
                                        <circle cx="80" cy="80" r="76" fill="none" stroke="#262626" strokeWidth="8" />
                                        <motion.circle 
                                            cx="80" cy="80" r="76" fill="none" stroke="#e11d48" strokeWidth="8"
                                            strokeDasharray="477"
                                            animate={{ strokeDashoffset: 477 - (477 * progress) / 100 }}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-white tracking-tighter">{progress}%</span>
                                        <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest mt-1">Status</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-neutral-400">Executing Kernels</p>
                                    <p className="text-[10px] font-medium text-neutral-600">Memory isolation active • Local execution</p>
                                </div>
                            </div>
                        ) : resultUrl ? (
                            <div className="relative z-10 space-y-10 text-center">
                                <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-600/20 rotate-3">
                                    <Check size={48} strokeWidth={3} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Forge Complete</h3>
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Asset prepared as <span className="text-rose-600 font-black">{targetExt}</span></p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a 
                                        href={resultUrl} 
                                        download={`forge-${Date.now()}.${targetExt}`}
                                        className="btn-primary flex h-16 bg-white text-neutral-900 border-none hover:bg-neutral-200 shadow-2xl shadow-white/5 min-w-[200px]"
                                    >
                                        <Download size={24} /> Download Final
                                    </a>
                                    <button onClick={clear} className="btn-secondary h-16 bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 shadow-none">
                                        New Task
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
