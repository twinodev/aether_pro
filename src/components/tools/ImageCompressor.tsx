import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { motion } from 'motion/react';
import { Upload, Download, ImageIcon, Sliders, CheckCircle2, AlertCircle, FileImage } from 'lucide-react';

export default function ImageCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      setCompressedFile(null);
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setCompressing(true);
    try {
      const options = {
        maxSizeMB: (selectedFile.size / 1024 / 1024) * quality,
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        initialQuality: quality,
      };

      const compressed = await imageCompression(selectedFile, options);
      setCompressedFile(compressed);
      setCompressedSize(compressed.size);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setCompressing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadCompressed = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_${selectedFile?.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
          <FileImage size={32} />
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter text-neutral-900">Shrink Engine</h2>
        <p className="text-neutral-500 font-medium max-w-md">Optimize images for the web. Reduce file size without sacrificing significant quality.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!selectedFile ? (
            <label className="block w-full aspect-video border-2 border-dashed border-neutral-200 rounded-[2.5rem] hover:border-neutral-900 hover:bg-neutral-50 transition-all cursor-pointer group">
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-neutral-400 group-hover:text-neutral-900" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-neutral-900">Drop Source Image</p>
                  <p className="text-xs text-neutral-400 mt-1">Supports JPG, PNG, WEBP</p>
                </div>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
            </label>
          ) : (
            <div className="bg-white border border-neutral-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center">
                      <ImageIcon size={20} className="text-neutral-900" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-neutral-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </h4>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        Original: {formatSize(originalSize)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="text-[10px] font-black uppercase tracking-widest text-rose-600"
                  >
                    Reset
                  </button>
                </div>

                <div className="relative aspect-video bg-neutral-50 rounded-2xl overflow-hidden flex items-center justify-center">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Original" 
                    className="max-h-full object-contain"
                  />
                  {compressedFile && (
                    <div className="absolute inset-0 bg-neutral-900/10 backdrop-blur-[2px] flex items-center justify-center">
                       <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                          <CheckCircle2 className="text-teal-500" size={24} />
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Compressed Signal</p>
                             <p className="text-lg font-black text-neutral-900">{formatSize(compressedSize)}</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {compressedFile && (
            <button 
              onClick={downloadCompressed}
              className="w-full h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20"
            >
              <Download size={18} /> Download Optimized Asset
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Sliders size={18} className="text-neutral-900" />
              <h3 className="text-lg font-black uppercase tracking-tight italic">Calibration</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Quality Buffer</label>
                  <span className="text-xs font-bold text-neutral-900">{Math.round(quality * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Resolution Cap</label>
                  <span className="text-xs font-bold text-neutral-900">{maxWidth}px</span>
                </div>
                <select 
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full h-12 bg-neutral-50 rounded-xl px-4 text-xs font-bold font-mono outline-none focus:ring-2 ring-neutral-900 transition-all appearance-none"
                >
                  <option value={1080}>1080p (Standard)</option>
                  <option value={1920}>1920p (HD+)</option>
                  <option value={3840}>4K (Ultra)</option>
                  <option value={800}>Small (800px)</option>
                </select>
              </div>

              <button 
                disabled={!selectedFile || compressing}
                onClick={handleCompress}
                className="w-full h-14 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all"
              >
                {compressing ? 'Crunching...' : 'Deploy Compression'}
              </button>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-3xl p-6 flex gap-4">
            <AlertCircle size={20} className="text-neutral-400 shrink-0" />
            <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
              Platform uses zero-server persistence. Your assets are processed locally and never leave your hardware.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
