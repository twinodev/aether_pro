import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Receipt, Download, Share2, User, Printer, Tag, Calculator, Settings, Building2, MapPin, Phone, Shield, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  tin?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

export default function ReceiptLab() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [currency, setCurrency] = useState('UGX');
  const [vatMode, setVatMode] = useState<'included' | 'excluded'>('excluded');
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({ name: '', address: '', phone: '', tin: '' });

  const [receiptCounter, setReceiptCounter] = useState<number>(1000);

  const [currentReceiptNumber, setCurrentReceiptNumber] = useState<string>('');

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedBusiness = localStorage.getItem('receipt_lab_business');
        if (savedBusiness) setBusinessInfo(JSON.parse(savedBusiness));
        const savedCounter = localStorage.getItem('receipt_lab_counter');
        if (savedCounter) setReceiptCounter(parseInt(savedCounter));
        const savedCatalog = localStorage.getItem('receipt_lab_catalog');
        if (savedCatalog) setCatalog(JSON.parse(savedCatalog));
      } catch (e) {
        console.warn('Failed to load ReceiptLab settings from localStorage:', e);
      }
    }
  }, []);

  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const handleDownloadPDF = () => {
    if (!receiptRef.current) return;
    
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 200] // 80mm roll width
    });

    const content = receiptRef.current;
    
    // Simple PDF generation for the receipt
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text(businessInfo.name || 'RECEIPT LAB', 40, 15, { align: 'center' });
    
    doc.setFontSize(8);
    let y = 22;
    if (businessInfo.address) { doc.text(businessInfo.address, 40, y, { align: 'center' }); y += 4; }
    if (businessInfo.phone) { doc.text(`TEL: ${businessInfo.phone}`, 40, y, { align: 'center' }); y += 4; }
    if (businessInfo.tin) { doc.text(`TIN: ${businessInfo.tin}`, 40, y, { align: 'center' }); y += 4; }
    
    y += 5;
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 5, y);
    doc.text(`NO: ${currentReceiptNumber}`, 75, y, { align: 'right' });
    
    y += 5;
    doc.text("------------------------------------------", 40, y, { align: 'center' });
    
    if (customerName) {
      y += 5;
      doc.text(`CUSTOMER: ${customerName.toUpperCase()}`, 5, y);
    }
    
    y += 8;
    items.forEach(item => {
      doc.text(`${item.name}`, 5, y);
      y += 4;
      doc.text(`${item.quantity} x ${item.price.toLocaleString()}`, 10, y);
      doc.text(`${(item.price * item.quantity).toLocaleString()}`, 75, y, { align: 'right' });
      y += 6;
    });
    
    y += 2;
    doc.text("------------------------------------------", 40, y, { align: 'center' });
    
    y += 6;
    doc.text(`SUBTOTAL:`, 5, y);
    doc.text(`${subtotal.toLocaleString()}`, 75, y, { align: 'right' });
    
    y += 5;
    doc.text(`VAT (18%):`, 5, y);
    doc.text(`${tax.toLocaleString()}`, 75, y, { align: 'right' });
    
    y += 8;
    doc.setFontSize(12);
    doc.text(`TOTAL ${currency}:`, 5, y);
    doc.text(`${total.toLocaleString()}`, 75, y, { align: 'right' });
    
    y += 15;
    doc.setFontSize(8);
    doc.text("*** THANK YOU *** ", 40, y, { align: 'center' });

    doc.save(`receipt-${currentReceiptNumber}.pdf`);
  };

  const handleExportImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, {
        backgroundColor: '#ffffff',
        style: {
          padding: '20px',
        }
      });
      const link = document.createElement('a');
      link.download = `receipt-${currentReceiptNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
    }
  };

  const handleShare = async () => {
    // If possible, share as image
    if (navigator.share && navigator.canShare && receiptRef.current) {
      try {
        const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#ffffff' });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `receipt-${currentReceiptNumber}.png`, { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Receipt ${currentReceiptNumber}`,
          });
          return;
        }
      } catch (err) {
        console.error('Error sharing image, falling back to text:', err);
      }
    }

    const text = `
RECEIPT: ${currentReceiptNumber}
DATE: ${new Date().toLocaleDateString()}
BUSINESS: ${businessInfo.name || 'Receipt Lab'}
--------------------------------
${items.map(i => `${i.name} x${i.quantity}: ${(i.price * i.quantity).toLocaleString()} ${currency}`).join('\n')}
--------------------------------
TOTAL: ${total.toLocaleString()} ${currency}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${currentReceiptNumber}`,
          text: text,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Receipt protocol copied to clipboard');
      } catch (err) {
        console.error('Error copying:', err);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('receipt_lab_business', JSON.stringify(businessInfo));
  }, [businessInfo]);

  useEffect(() => {
    localStorage.setItem('receipt_lab_catalog', JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem('receipt_lab_counter', receiptCounter.toString());
  }, [receiptCounter]);

  const handleProcessReceipt = () => {
    const nextNumber = receiptCounter + 1;
    setReceiptCounter(nextNumber);
    setCurrentReceiptNumber(`RL-${nextNumber.toString().padStart(4, '0')}`);
    setShowReceipt(true);
  };

  const addItemToCart = (name: string, price: number, qty: number) => {
    const existingItem = items.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (existingItem) {
      setItems(items.map(i => i.id === existingItem.id ? { ...i, quantity: i.quantity + qty } : i));
    } else {
      setItems([...items, {
        id: Math.random().toString(36).substr(2, 9),
        name,
        price,
        quantity: qty
      }]);
    }
  };

  const handleManualAdd = () => {
    if (!itemName || !itemPrice) return;
    const price = parseFloat(itemPrice);
    const qty = parseInt(itemQuantity) || 1;
    if (isNaN(price)) return;

    addItemToCart(itemName, price, qty);
    
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
  };

  const saveToCatalog = () => {
    if (!itemName || !itemPrice) return;
    const price = parseFloat(itemPrice);
    if (isNaN(price)) return;

    const exists = catalog.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (!exists) {
      setCatalog([...catalog, {
        id: Math.random().toString(36).substr(2, 9),
        name: itemName,
        price
      }]);
    }
  };

  const removeFromCatalog = (id: string) => {
    setCatalog(catalog.filter(i => i.id !== id));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const rawSum = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let subtotal = 0;
  let tax = 0;
  let total = 0;

  if (vatMode === 'excluded') {
    subtotal = rawSum;
    tax = subtotal * 0.18;
    total = subtotal + tax;
  } else {
    // VAT Included
    total = rawSum;
    subtotal = total / 1.18;
    tax = total - subtotal;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-receipt {
            width: 80mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
      <header className="mb-12 no-print">
        <OfflineAlert toolName="Receipt Lab" />
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/10">
            <Calculator size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">Receipt Lab</h1>
            <p className="text-neutral-500 font-medium text-xs uppercase tracking-widest italic opacity-60">Minimalist POS & Transaction Architect</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        {/* Inventory System */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border-2 border-neutral-100 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                <Tag size={12} /> Transaction Input
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowCatalog(!showCatalog)}
                  className={`p-2 rounded-xl transition-all ${showCatalog ? 'bg-indigo-600 text-white' : 'bg-neutral-50 text-neutral-400 hover:text-indigo-600'}`}
                  title="Stored Items Catalogue"
                >
                  <ShoppingCart size={16} />
                </button>
                <button 
                  onClick={() => setShowBusinessSetup(!showBusinessSetup)}
                  className={`p-2 rounded-xl transition-all ${showBusinessSetup ? 'bg-indigo-600 text-white' : 'bg-neutral-50 text-neutral-400 hover:text-indigo-600'}`}
                  title="Business Identity Protocol"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showCatalog && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-4">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3">Item Repository</h3>
                    {catalog.length === 0 ? (
                      <p className="text-[10px] italic text-neutral-400">No items stored in protocol.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {catalog.map(item => (
                          <div 
                            key={item.id}
                            className="group flex items-center gap-2 pl-3 pr-1 py-1 bg-white border border-neutral-100 rounded-lg shadow-sm hover:border-indigo-400 transition-all"
                          >
                            <button 
                              onClick={() => {
                                setItemName(item.name);
                                setItemPrice(item.price.toString());
                              }}
                              className="text-[10px] font-black uppercase tracking-tight text-neutral-900"
                            >
                              {item.name} - {item.price.toLocaleString()}
                            </button>
                            <button 
                              onClick={() => removeFromCatalog(item.id)}
                              className="p-1 text-neutral-200 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showBusinessSetup && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="space-y-4">
                      <div className="relative group">
                        <Building2 className="absolute top-4 left-4 text-neutral-300 pointer-events-none" size={14} />
                        <input 
                          placeholder="Business Name"
                          value={businessInfo.name}
                          onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                          className="input-field pl-10 h-12 text-[10px] font-black uppercase tracking-widest"
                        />
                      </div>
                      <div className="relative group">
                        <MapPin className="absolute top-4 left-4 text-neutral-300 pointer-events-none" size={14} />
                        <input 
                          placeholder="Address"
                          value={businessInfo.address}
                          onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                          className="input-field pl-10 h-12 text-[10px] font-black uppercase tracking-widest"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="relative group">
                        <Phone className="absolute top-4 left-4 text-neutral-300 pointer-events-none" size={14} />
                        <input 
                          placeholder="Phone Number"
                          value={businessInfo.phone}
                          onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                          className="input-field pl-10 h-12 text-[10px] font-black uppercase tracking-widest"
                        />
                      </div>
                      <div className="relative group">
                        <Shield className="absolute top-4 left-4 text-neutral-300 pointer-events-none" size={14} />
                        <input 
                          placeholder="TIN Number"
                          value={businessInfo.tin}
                          onChange={(e) => setBusinessInfo({...businessInfo, tin: e.target.value})}
                          className="input-field pl-10 h-12 text-[10px] font-black uppercase tracking-widest"
                        />
                      </div>
                      <div className="relative group">
                        <Calculator className="absolute top-4 left-4 text-neutral-300 pointer-events-none" size={14} />
                        <div className="flex items-center">
                          <span className="absolute left-10 text-[8px] font-black opacity-30 pointer-events-none">NEXT #</span>
                          <input 
                            type="number"
                            placeholder="Next Receipt #"
                            value={receiptCounter + 1}
                            onChange={(e) => setReceiptCounter(parseInt(e.target.value) - 1 || 999)}
                            className="input-field pl-20 h-12 text-[10px] font-black uppercase tracking-widest"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="absolute top-4 left-4 text-neutral-300 group-focus-within:text-indigo-500 transition-colors">
                    <User size={16} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Customer Identity (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field pl-12 h-14 text-xs font-bold uppercase tracking-widest bg-neutral-50/50"
                  />
                </div>
                
                <div className="flex bg-neutral-50/50 p-1 rounded-2xl border-2 border-neutral-100 h-14">
                  {(['included', 'excluded'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setVatMode(mode)}
                      className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        vatMode === mode ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'
                      }`}
                    >
                      VAT {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <input 
                  type="text"
                  placeholder="Item Name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="col-span-2 md:col-span-2 input-field h-14 text-xs font-bold bg-neutral-50/50"
                />
                <input 
                  type="number"
                  placeholder="Price"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="md:col-span-2 input-field h-14 text-xs font-bold bg-neutral-50/50"
                />
                <input 
                  type="number"
                  placeholder="Qty"
                  value={itemQuantity}
                  min="1"
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="input-field h-14 text-xs font-bold bg-neutral-50/50"
                />
                <div className="flex gap-1 md:col-span-2">
                  <button 
                    onClick={handleManualAdd}
                    className="flex-1 h-14 bg-neutral-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all"
                    title="Add to Current Transaction"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={saveToCatalog}
                    className="w-14 h-14 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-all"
                    title="Store in Permanent Repository"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-neutral-100 rounded-[2.5rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900">Active Register</h3>
              <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                {items.length} Items Local
              </div>
            </div>

            <div className="min-h-[300px]">
              <AnimatePresence mode="popLayout">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-neutral-300">
                    <ShoppingCart size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">Register Empty</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                        <th className="px-8 py-4">Descriptor</th>
                        <th className="px-8 py-4">Identity Value</th>
                        <th className="px-8 py-4">Quantity</th>
                        <th className="px-8 py-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold divide-y divide-neutral-50">
                      {items.map((item) => (
                        <motion.tr 
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="group hover:bg-neutral-50 transition-colors"
                        >
                          <td className="px-8 py-4 text-neutral-900 font-black uppercase tracking-tight">{item.name}</td>
                          <td className="px-8 py-4 text-neutral-500">{item.price.toLocaleString()}</td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 text-neutral-300 hover:text-indigo-600 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 text-neutral-300 hover:text-indigo-600 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-neutral-200 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Terminal Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center justify-between mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Terminal Totals</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest focus:outline-none"
              >
                <option value="UGX" className="text-black">UGX (Uganda)</option>
                <option value="KES" className="text-black">KES (Kenya)</option>
                <option value="TZS" className="text-black">TZS (Tanzania)</option>
                <option value="RWF" className="text-black">RWF (Rwanda)</option>
                <option value="BIF" className="text-black">BIF (Burundi)</option>
                <option value="SSP" className="text-black">SSP (S. Sudan)</option>
                <option value="CDF" className="text-black">CDF (DRC)</option>
                <option value="SOS" className="text-black">SOS (Somalia)</option>
                <option value="USD" className="text-black">USD (Global)</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center opacity-60">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Subtotal {vatMode === 'included' && '(Tax Incl.)'}
                </span>
                <span className="text-sm font-black">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center opacity-60">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">Protocol VAT (18%)</span>
                <span className="text-sm font-black">{tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Grand Aggregate</span>
                <div className="text-right">
                  <div className="text-xs opacity-40 font-black">{currency}</div>
                  <div className="text-4xl font-black leading-none">{total.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleProcessReceipt}
              disabled={items.length === 0}
              className="w-full h-16 bg-white text-neutral-900 rounded-2xl mt-8 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-100 transition-all shadow-xl disabled:opacity-20"
            >
              <Receipt size={18} />
              Process Receipt
            </motion.button>
          </div>

          {/* Receipt Modal */}
          <AnimatePresence>
            {showReceipt && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowReceipt(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl font-mono text-[11px] leading-relaxed relative overflow-hidden"
                >
                  {/* Receipt Content */}
                  <div ref={receiptRef} className="p-2 print-receipt">
                    <div className="text-center mb-6 space-y-1">
                      <div className="text-lg font-black uppercase tracking-tighter">
                        {businessInfo.name || 'RECEIPT LAB'}
                      </div>
                      {businessInfo.address && <div className="opacity-50 text-[8px] uppercase tracking-widest">{businessInfo.address}</div>}
                      {businessInfo.phone && <div className="opacity-50 text-[8px] uppercase tracking-widest">TEL: {businessInfo.phone}</div>}
                      {businessInfo.tin && <div className="opacity-50 text-[8px] uppercase tracking-widest">TIN: {businessInfo.tin}</div>}
                      
                      <div className="h-4" />
                      <div className="opacity-50 text-[9px] uppercase tracking-widest italic">Digital Transaction Protocol</div>
                      <div className="flex justify-between w-full opacity-50 text-[9px] uppercase tracking-widest">
                        <span>Date: {new Date().toLocaleDateString()}</span>
                        <span className="font-bold">NO: {currentReceiptNumber}</span>
                      </div>
                    </div>

                    <div className="border-b border-dashed border-neutral-200 mb-4" />

                    {customerName && (
                      <div className="mb-4">
                        <span className="opacity-40 uppercase">CUSTOMER:</span> {customerName.toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1 mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="uppercase font-bold">{item.name}</div>
                            <div className="opacity-40">{item.quantity} x {item.price.toLocaleString()}</div>
                          </div>
                          <div className="font-bold">{(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    <div className="border-b border-dashed border-neutral-200 mb-4" />

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="opacity-40 uppercase">SUBTOTAL:</span>
                        <span>{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-40 uppercase">VAT (18%):</span>
                        <span>{tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-base font-black pt-2">
                        <span className="uppercase">TOTAL {currency}:</span>
                        <span>{total.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-8 text-center space-y-4 opacity-50 text-[9px] uppercase tracking-widest">
                      <div>*** THANK YOU FOR YOUR PROTOCOL ***</div>
                      <div className="flex justify-center">
                        <div className="w-32 h-1 bg-neutral-900/10" />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
                    <button 
                      onClick={() => handlePrint()}
                      className="flex items-center justify-center gap-2 py-3 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      <Printer size={14} /> Print
                    </button>
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all font-mono"
                    >
                      <FileText size={14} /> PDF
                    </button>
                    <button 
                      onClick={handleExportImage}
                      className="flex items-center justify-center gap-2 py-3 bg-neutral-100 text-neutral-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all font-mono"
                    >
                      <ImageIcon size={14} /> IMG
                    </button>
                    <button 
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all font-mono sm:col-span-1"
                    >
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
