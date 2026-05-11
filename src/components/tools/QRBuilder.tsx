import React, { useState, useRef, ChangeEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Copy, Check, QrCode, Type, Link as LinkIcon, Mail, Phone, Layout, Image as ImageIcon, X, Sparkles, Lock, Play, Moon, Sun, User, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

type QRType = 'text' | 'url' | 'email' | 'phone' | 'vcard' | 'wifi';

export default function QRBuilder() {
  const { isVip } = useAuth();
  const [showAd, setShowAd] = useState(false);
  const [adUnlocked, setAdUnlocked] = useState(false);
  
  const [text, setText] = useState('');
  const [type, setType] = useState<QRType>('url');
  
  // Structured inputs for complex types
  const [vCard, setVCard] = useState({
    firstName: '',
    lastName: '',
    org: '',
    phone: '',
    email: '',
  });

  const [wifi, setWifi] = useState({
    ssid: '',
    password: '',
    encryption: 'WPA', // WPA, WEP, nopass
  });
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(40);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  const copyToClipboard = async () => {
    try {
      const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      console.error('Failed to copy qr code: ', err);
    }
  };

  const qrTypes = [
    { id: 'url', icon: LinkIcon, label: 'URL' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'phone', icon: Phone, label: 'Phone' },
    { id: 'vcard', icon: User, label: 'vCard' },
    { id: 'wifi', icon: Wifi, label: 'WiFi' },
  ];

  const getQRValue = () => {
    if (!text && type !== 'vcard' && type !== 'wifi') return 'https://aether-pro.app';
    
    switch (type) {
      case 'url':
        return text.startsWith('http') ? text : `https://${text}`;
      case 'email':
        return `mailto:${text}`;
      case 'phone':
        return `tel:${text}`;
      case 'vcard':
        return `BEGIN:VCARD
VERSION:3.0
N:${vCard.lastName};${vCard.firstName}
FN:${vCard.firstName} ${vCard.lastName}
ORG:${vCard.org}
TEL;TYPE=CELL:${vCard.phone}
EMAIL:${vCard.email}
END:VCARD`;
      case 'wifi':
        return `WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};;`;
      default:
        return text;
    }
  };

  const qrValue = getQRValue();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-900'}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-white'}`}>
                <QrCode size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">QR Code Builder</h1>
            </div>
            <p className={`${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Generate custom QR codes with logos and custom colors.</p>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-neutral-900 text-yellow-400 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <section className="space-y-6">
            <div className="space-y-3">
              <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Content Type</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {qrTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as QRType)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      type === t.id 
                        ? (isDarkMode ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-900 text-white')
                        : (isDarkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300')
                    }`}
                  >
                    <t.icon size={18} />
                    <span className="text-[10px] font-bold uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {type === 'url' ? 'Website URL' : type === 'email' ? 'Email Address' : type === 'phone' ? 'Phone Number' : type === 'vcard' ? 'Contact Information' : type === 'wifi' ? 'Network Credentials' : 'Text Content'}
              </label>
              
              {type === 'vcard' ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    placeholder="First Name"
                    value={vCard.firstName}
                    onChange={(e) => setVCard({ ...vCard, firstName: e.target.value })}
                  />
                  <input
                    className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    placeholder="Last Name"
                    value={vCard.lastName}
                    onChange={(e) => setVCard({ ...vCard, lastName: e.target.value })}
                  />
                  <input
                    className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    placeholder="Organization"
                    value={vCard.org}
                    onChange={(e) => setVCard({ ...vCard, org: e.target.value })}
                  />
                  <input
                    className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    placeholder="Phone"
                    value={vCard.phone}
                    onChange={(e) => setVCard({ ...vCard, phone: e.target.value })}
                  />
                  <input
                    className={`w-full h-10 px-4 col-span-2 rounded-xl transition-all outline-none border focus:ring-2 ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    placeholder="Email"
                    value={vCard.email}
                    onChange={(e) => setVCard({ ...vCard, email: e.target.value })}
                  />
                </div>
              ) : type === 'wifi' ? (
                <div className="space-y-3">
                  <input
                    className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                      isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    placeholder="Network Name (SSID)"
                    value={wifi.ssid}
                    onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="password"
                      className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                        isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                      }`}
                      placeholder="Password"
                      value={wifi.password}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                    />
                    <select
                      className={`w-full h-10 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                        isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                      }`}
                      value={wifi.encryption}
                      onChange={(e) => setWifi({ ...wifi, encryption: e.target.value })}
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                  </div>
                </div>
              ) : (
                <input
                  type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text'}
                  className={`w-full h-12 px-4 rounded-xl transition-all outline-none border focus:ring-2 ${
                    isDarkMode 
                      ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:border-indigo-500 focus:ring-indigo-500/20' 
                      : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:ring-neutral-900/5'
                  }`}
                  placeholder={type === 'url' ? 'https://example.com' : 'Enter content here...'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Foreground</label>
                <div className={`flex items-center gap-3 p-2 border rounded-xl ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  <input
                    type="color"
                    className="w-8 h-8 rounded-md cursor-pointer border-none p-0 bg-transparent"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                  />
                  <span className={`text-xs font-mono uppercase ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>{fgColor}</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Background</label>
                <div className={`flex items-center gap-3 p-2 border rounded-xl ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  <input
                    type="color"
                    className="w-8 h-8 rounded-md cursor-pointer border-none p-0 bg-transparent"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                  <span className={`text-xs font-mono uppercase ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>{bgColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Custom Logo</label>
                 {(!isVip && !adUnlocked) && (
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                      <Sparkles size={8} /> VIP or Ad
                   </div>
                 )}
                 {adUnlocked && (
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                      <Check size={8} /> Ad Unlocked
                   </div>
                 )}
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                {!isVip && !adUnlocked ? (
                  <button 
                    onClick={() => {
                      setShowAd(true);
                      setTimeout(() => {
                        setAdUnlocked(true);
                        setShowAd(false);
                      }, 1000);
                    }}
                    disabled={showAd}
                    className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl disabled:opacity-50"
                  >
                    {showAd ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {showAd ? 'Processing...' : 'Unlock Logo via Sponsor'}
                  </button>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isDarkMode ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200'}`}
                  >
                    <ImageIcon size={14} />
                    Upload Logo
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                
                <AnimatePresence>
                  {logo && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg border ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}
                    >
                      <img src={logo} alt="logo" className="w-6 h-6 object-contain" />
                      <button onClick={() => setLogo(null)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors">
                        <X size={12} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {logo && (
                <div className="pt-2">
                   <div className="flex justify-between mb-1">
                     <label className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Logo size</label>
                     <span className={`text-[10px] font-mono ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{logoSize}px</span>
                   </div>
                   <input 
                      type="range" 
                      min="20" 
                      max="60" 
                      value={logoSize}
                      onChange={(e) => setLogoSize(parseInt(e.target.value))}
                      className={`w-full appearance-none h-1.5 rounded-full outline-none ${isDarkMode ? 'bg-neutral-800 accent-indigo-500' : 'bg-neutral-200 accent-neutral-900'}`}
                   />
                </div>
              )}
            </div>
          </section>

          {/* Preview */}
          <section className="flex flex-col items-center justify-center">
            <div className={`p-8 border-dashed border-2 flex flex-col items-center gap-8 w-full max-w-sm aspect-square justify-center relative group rounded-[2rem] transition-colors ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100/50 border-neutral-200'}`}>
              <div className="bg-white p-6 rounded-2xl shadow-2xl transition-transform group-hover:scale-105 duration-300">
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={qrValue}
                  size={200}
                  level="H"
                  fgColor={fgColor}
                  bgColor={bgColor}
                  includeMargin={false}
                  imageSettings={logo ? {
                    src: logo,
                    height: logoSize,
                    width: logoSize,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <div className="flex gap-3 w-full max-w-xs">
                <button 
                  onClick={downloadQR} 
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}
                >
                  <Download size={18} />
                  Download
                </button>
                <button 
                  onClick={copyToClipboard} 
                  className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isDarkMode ? 'bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700' : 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50'}`}
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              
              {!text && (
                <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isDarkMode ? 'bg-neutral-950/80' : 'bg-neutral-50/80'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Enter content to customize</p>
                </div>
              )}
            </div>
            
            <p className={`mt-4 text-xs font-mono uppercase tracking-widest text-center ${isDarkMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
              {qrValue.length > 0 ? `${qrValue.length} characters` : 'waiting for input...'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

