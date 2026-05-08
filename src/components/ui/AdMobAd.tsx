import React, { useEffect, useRef } from 'react';

interface AdMobAdProps {
  adClient?: string;
  adSlot?: string;
  className?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

/**
 * AdMobAd Component (AdSense for Web / Google Ad Manager)
 * 
 * To use this with real ads:
 * 1. Get your Publisher ID (e.g., pub-xxxxxxxxxxxxxxxx)
 * 2. Create an Ad Unit and get the Slot ID
 * 3. Ensure the script is loaded in index.html or handled here
 */
export default function AdMobAd({ 
  adClient = 'ca-pub-5861878697571557', // Your Publisher ID
  adSlot = 'XXXXXXXXXX',               // Placeholder Slot
  className = '',
  format = 'auto',
  responsive = true
}: AdMobAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Check if adsbygoogle is defined and actually pushes an ad
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (err) {
      console.warn('AdMob Ad Error:', err);
    }
  }, []);

  return (
    <div className={`ad-container overflow-hidden flex items-center justify-center my-4 relative group ${className}`}>
      {/* 
        This is a simulation of the AdSense/AdMob for Web code.
        In a real production environment, this is where the ad would render.
      */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
      
      {/* Visual placeholder for developers */}
      <div className="absolute inset-0 bg-neutral-50/50 flex flex-col items-center justify-center border border-neutral-100 rounded-2xl pointer-events-none group-hover:bg-neutral-100/50 transition-colors">
        <div className="flex items-center gap-1.5 opacity-40">
          <div className="w-1 h-1 bg-neutral-400 rounded-full" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-400">Sponsored</span>
          <div className="w-1 h-1 bg-neutral-400 rounded-full" />
        </div>
        <div className="mt-2 text-[7px] font-bold text-neutral-300 uppercase tracking-widest hidden md:block group-hover:opacity-100 opacity-0 transition-opacity">Partner Intelligence Asset</div>
      </div>
    </div>
  );
}
