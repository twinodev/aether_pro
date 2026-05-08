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
    <div className={`ad-container overflow-hidden flex items-center justify-center my-4 ${className}`}>
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
      <div className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-lg pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Advertisement Block</span>
        <span className="text-[8px] font-medium text-neutral-300 mt-1">ID: {adSlot}</span>
      </div>
    </div>
  );
}
