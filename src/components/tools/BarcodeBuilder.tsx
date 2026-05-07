import React, { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import { Download, Copy, Check, Barcode as BarcodeIcon, Type, Settings2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'ITF14' | 'pharmacode';

export default function BarcodeBuilder() {
  const [data, setData] = useState('12345678');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [lineColor, setLineColor] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const barcodeRef = useRef<HTMLDivElement>(null);

  const downloadBarcode = () => {
    const svg = barcodeRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBBox();
    const margin = 20;
    canvas.width = svgSize.width + margin * 2;
    canvas.height = svgSize.height + margin * 2;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, margin, margin);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `barcode-${data}-${Date.now()}.png`;
      link.href = url;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formats = [
    { id: 'CODE128', label: 'Code 128' },
    { id: 'CODE39', label: 'Code 39' },
    { id: 'EAN13', label: 'EAN-13' },
    { id: 'UPC', label: 'UPC-A' },
    { id: 'ITF14', label: 'ITF-14' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8 font-sans">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neutral-900 text-white rounded-lg">
            <BarcodeIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Barcode Builder</h1>
        </div>
        <p className="text-neutral-500">Generate professional barcodes for inventory and retail.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <section className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as BarcodeFormat)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    format === f.id 
                      ? 'bg-neutral-900 border-neutral-900 text-white' 
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Data / Value</label>
            <input
              type="text"
              className="input-field font-mono"
              placeholder="e.g. 12345678"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Lines</label>
                <div className="flex items-center gap-3 p-2 bg-white border border-neutral-200 rounded-xl">
                    <input
                    type="color"
                    className="w-8 h-8 rounded-md cursor-pointer border-none p-0 bg-transparent"
                    value={lineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    />
                    <span className="text-xs font-mono uppercase">{lineColor}</span>
                </div>
            </div>
            <div className="space-y-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400">BG</label>
                <div className="flex items-center gap-3 p-2 bg-white border border-neutral-200 rounded-xl">
                    <input
                    type="color"
                    className="w-8 h-8 rounded-md cursor-pointer border-none p-0 bg-transparent"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    />
                    <span className="text-xs font-mono uppercase">{background}</span>
                </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
                 <div className="flex justify-between mb-1">
                   <label className="text-[10px] font-bold uppercase text-neutral-400">Width multiplier</label>
                   <span className="text-[10px] font-mono text-neutral-400">{width}</span>
                 </div>
                 <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="0.5"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value))}
                    className="w-full accent-neutral-900"
                 />
            </div>
            <div>
                 <div className="flex justify-between mb-1">
                   <label className="text-[10px] font-bold uppercase text-neutral-400">Height</label>
                   <span className="text-[10px] font-mono text-neutral-400">{height}px</span>
                 </div>
                 <input 
                    type="range" 
                    min="50" 
                    max="150" 
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    className="w-full accent-neutral-900"
                 />
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="show-text"
                checked={displayValue}
                onChange={(e) => setDisplayValue(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 rounded"
              />
              <label htmlFor="show-text" className="text-sm font-medium text-neutral-600">Display value text</label>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="flex flex-col items-center justify-center">
          <div className="card p-8 bg-neutral-100/50 border-dashed border-2 border-neutral-200 flex flex-col items-center gap-8 w-full min-h-[300px] justify-center relative group overflow-hidden">
            <div ref={barcodeRef} className="bg-white p-6 rounded-2xl shadow-xl transition-transform group-hover:scale-105 duration-300 max-w-full overflow-x-auto border border-neutral-100 flex items-center justify-center">
               {data ? (
                 <Barcode 
                    value={data} 
                    format={format}
                    lineColor={lineColor}
                    background={background}
                    width={width}
                    height={height}
                    displayValue={displayValue}
                    margin={0}
                    fontSize={14}
                    font="Inter"
                 />
               ) : (
                  <div className="w-[300px] h-[100px] flex items-center justify-center text-neutral-300">
                    <BarcodeIcon size={48} />
                  </div>
               )}
            </div>

            <div className="flex gap-3 w-full max-w-sm">
              <button 
                onClick={downloadBarcode} 
                disabled={!data}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Download
              </button>
            </div>
            
            {!data && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-50/80 backdrop-blur-sm rounded-2xl opacity-100 transition-opacity pointer-events-none">
                <p className="text-sm font-medium text-neutral-500">Enter data to generate barcode</p>
              </div>
            )}
          </div>
          
          <p className="mt-4 text-xs text-neutral-400 font-mono uppercase tracking-widest text-center">
             FORMAT: {format}
          </p>
        </section>
      </div>
    </div>
  );
}
