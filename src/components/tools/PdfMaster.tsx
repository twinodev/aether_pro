import React, { useState, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { FileText, Plus, Scissors, Info, Download, Trash2, ArrowUp, ArrowDown, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert';

interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

export default function PdfMaster() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    const newFiles = (Array.from(fileList) as File[]).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const mergePdfs = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfFile of files) {
        const bytes = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // Apply metadata
      if (metadata.title) mergedPdf.setTitle(metadata.title);
      if (metadata.author) mergedPdf.setAuthor(metadata.author);
      if (metadata.subject) mergedPdf.setSubject(metadata.subject);
      if (metadata.keywords) mergedPdf.setKeywords(metadata.keywords.split(',').map(k => k.trim()));

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-document-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Merge Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const splitPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      // For simplicity, we split the first file into individual pages
      const sourceFile = files[0];
      const bytes = await sourceFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pageCount = pdf.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);
        const pdfBytes = await newPdf.save();
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sourceFile.name.replace('.pdf', '')}-page-${i + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Split Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="PDF Master" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-600 text-white rounded-lg">
            <FileText size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">PDF Master Utility</h1>
        </div>
        <p className="text-neutral-500 font-medium lowercase">Ultimate in-browser manipulation: merge, split, and sanitize metadata.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Metadata & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-neutral-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Metadata Layer</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block ml-1 tracking-widest">Document Title</label>
                <input 
                  type="text" 
                  value={metadata.title}
                  onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                  className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/50"
                  placeholder="Final Report 2024"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block ml-1 tracking-widest">Author Identity</label>
                <input 
                  type="text" 
                  value={metadata.author}
                  onChange={(e) => setMetadata({...metadata, author: e.target.value})}
                  className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/50"
                  placeholder="Anonymous Agent"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase mb-1 block ml-1 tracking-widest">Subject Tag</label>
                <input 
                  type="text" 
                  value={metadata.subject}
                  onChange={(e) => setMetadata({...metadata, subject: e.target.value})}
                  className="w-full h-10 px-4 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/50"
                  placeholder="Internal Audit"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={mergePdfs}
              disabled={files.length < 2 || isProcessing}
              className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all ${
                files.length < 2 || isProcessing
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-red-600 text-white shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Merge Sequence
            </button>
            <button 
              onClick={splitPdf}
              disabled={files.length !== 1 || isProcessing}
              className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all ${
                files.length !== 1 || isProcessing
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 text-white shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Scissors size={18} />
              Split Atomic Pages
            </button>
            {files.length === 0 && (
               <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Add 2+ docs to merge or 1 to split</p>
               </div>
            )}
          </div>
        </div>

        {/* Right: File Queue */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px]">
          <div className="flex-1 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[3rem] p-8 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <FileText size={14} />
                Processing Pipeline / {files.length} units
              </span>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 h-10 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-neutral-900 transition-colors"
              >
                <Plus size={14} />
                Ingest Source
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="application/pdf" 
                multiple 
              />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white border border-neutral-100 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate uppercase tracking-tighter">{file.name}</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{file.size}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                        className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="p-2 hover:bg-neutral-50 rounded-lg text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {files.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-20">
                  <FileText size={64} strokeWidth={1} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.3em]">Awaiting PDF Substrate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
