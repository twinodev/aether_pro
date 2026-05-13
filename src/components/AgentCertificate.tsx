import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Shield, Check, Download, Share2, Award, QrCode } from 'lucide-react';
import { toPng } from 'html-to-image';
import { UserProfile } from '../services/userService';

interface AgentCertificateProps {
  profile: UserProfile;
}

export default function AgentCertificate({ profile }: AgentCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (certificateRef.current) {
      const dataUrl = await toPng(certificateRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `verified-agent-${profile.displayName?.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const shareCertificate = async () => {
    if (certificateRef.current) {
      const dataUrl = await toPng(certificateRef.current, { quality: 0.95 });
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'certificate.png', { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'Verified Agent Certificate',
            text: `I am a Verified Agent on Duka Sync protocol! #DukaSync #RetailIntelligence`,
          });
        }
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  if (!profile.isVerifiedAgent) {
    return (
      <div className="p-12 text-center bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm">
        <Shield size={48} className="text-neutral-200 mx-auto mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Verification Required</h2>
        <p className="text-neutral-400 mt-2">Your identity has not been verified by the Aether Intelligence protocol yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Agent Certificate</h2>
          <p className="text-neutral-400 text-sm font-medium uppercase tracking-widest mt-1">Proof of retail excellence and verification.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={downloadCertificate}
            className="flex items-center gap-2 px-6 py-4 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10"
          >
            <Download size={16} /> Download PNG
          </button>
          <button 
            onClick={shareCertificate}
            className="flex items-center gap-2 px-6 py-4 border border-neutral-100 bg-white text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-neutral-900 transition-all shadow-sm"
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      <div className="relative group">
        <div 
          ref={certificateRef}
          className="w-full aspect-[1.414/1] bg-white rounded-3xl p-1 lg:p-4 overflow-hidden relative"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, #f5f5f5 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* Certificate Border */}
          <div className="absolute inset-0 border-[12px] border-neutral-900 m-4 sm:m-8 lg:m-12 pointer-events-none" />
          
          <div className="h-full w-full border-2 border-neutral-900 m-0 p-8 sm:p-16 lg:p-24 flex flex-col items-center justify-between relative z-10">
            
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Shield size={32} className="text-neutral-900" fill="currentColor" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter italic">Duka Sync Protocol</h1>
              </div>
              <div className="h-0.5 w-32 bg-neutral-900 mx-auto" />
            </div>

            {/* Content */}
            <div className="text-center space-y-6">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-neutral-400">This is to certify that</span>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-neutral-900">{profile.displayName}</h2>
              <div className="flex items-center justify-center gap-4 py-4">
                 <div className="h-px bg-neutral-200 flex-1" />
                 <Award size={24} className="text-neutral-900" />
                 <div className="h-px bg-neutral-200 flex-1" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 max-w-lg mx-auto leading-relaxed uppercase tracking-tight">
                Has successfully completed the verification protocols for <span className="font-bold text-neutral-900">Elite Retail Intelligence</span> and is recognized as a <span className="font-bold text-neutral-900">Verified Agent</span> within the Duka Sync distributed ecosystem.
              </p>
            </div>

            {/* Footer */}
            <div className="w-full flex items-end justify-between mt-12">
              <div className="text-left space-y-2">
                 <div className="text-[10px] font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-900 pb-1">Verification Code</div>
                 <div className="text-[8px] font-mono text-neutral-400 uppercase">{profile.uid.toUpperCase()}</div>
                 <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Issued on {new Date(profile.agentVerificationDate || Date.now()).toLocaleDateString()}</div>
              </div>

              <div className="flex flex-col items-center gap-2">
                 <div className="p-2 bg-white border-2 border-neutral-900 rounded-lg">
                    <QrCode size={48} className="text-neutral-900" />
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-[0.2em] text-neutral-400">Authenticity Node</span>
              </div>

              <div className="text-right space-y-2">
                 <div className="text-lg font-black uppercase tracking-tighter italic text-neutral-900">Aether Pro</div>
                 <div className="text-[8px] font-black uppercase tracking-widest text-neutral-400">System Administrator</div>
                 <div className="w-24 h-px bg-neutral-900 ml-auto" />
              </div>
            </div>

            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <Shield size={400} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-black text-white rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Check className="text-emerald-400" size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-tight italic">Protocol Active</h4>
            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Verification status is synchronized across all nodes.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
           <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">System Integrity: 99.9%</span>
        </div>
      </div>
    </div>
  );
}
