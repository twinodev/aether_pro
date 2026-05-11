import React, { useState, useEffect } from 'react';
import { Smartphone, Info, ArrowRight, Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert';

interface FeeTier {
  min: number;
  max: number;
  sendRegistered: number;
  sendUnregistered: number;
  withdraw: number;
}

interface Network {
  id: string;
  name: string;
  country: string;
  currency: string;
  color: string;
  tiers: FeeTier[];
}

const NETWORKS: Network[] = [
  {
    id: 'mpesa-ke',
    name: 'M-PESA',
    country: 'Kenya',
    currency: 'KES',
    color: 'bg-emerald-600',
    tiers: [
      { min: 1, max: 49, sendRegistered: 0, sendUnregistered: 0, withdraw: 0 },
      { min: 50, max: 100, sendRegistered: 0, sendUnregistered: 0, withdraw: 11 },
      { min: 101, max: 500, sendRegistered: 7, sendUnregistered: 49, withdraw: 29 },
      { min: 501, max: 1000, sendRegistered: 13, sendUnregistered: 67, withdraw: 30 },
      { min: 1001, max: 1500, sendRegistered: 23, sendUnregistered: 80, withdraw: 31 },
      { min: 2501, max: 3500, sendRegistered: 53, sendUnregistered: 110, withdraw: 52 },
      { min: 10001, max: 15000, sendRegistered: 91, sendUnregistered: 190, withdraw: 167 },
      { min: 50001, max: 150000, sendRegistered: 108, sendUnregistered: 300, withdraw: 309 },
    ]
  },
  {
    id: 'momo-ug',
    name: 'MTN MoMo',
    country: 'Uganda',
    currency: 'UGX',
    color: 'bg-yellow-400',
    tiers: [
      { min: 500, max: 2500, sendRegistered: 100, sendUnregistered: 1000, withdraw: 330 },
      { min: 5001, max: 15000, sendRegistered: 650, sendUnregistered: 2500, withdraw: 950 },
      { min: 15001, max: 30000, sendRegistered: 800, sendUnregistered: 3000, withdraw: 1100 },
      { min: 60001, max: 125000, sendRegistered: 1100, sendUnregistered: 4500, withdraw: 2100 },
      { min: 500001, max: 1000000, sendRegistered: 1500, sendUnregistered: 12000, withdraw: 8500 },
      { min: 2000001, max: 7000000, sendRegistered: 2000, sendUnregistered: 20000, withdraw: 15000 },
    ]
  },
  {
    id: 'airtel-ke',
    name: 'Airtel Money',
    country: 'Kenya',
    currency: 'KES',
    color: 'bg-red-500',
    tiers: [
      { min: 1, max: 100, sendRegistered: 0, sendUnregistered: 0, withdraw: 0 },
      { min: 101, max: 500, sendRegistered: 6, sendUnregistered: 35, withdraw: 27 },
      { min: 501, max: 1000, sendRegistered: 12, sendUnregistered: 60, withdraw: 28 },
      { min: 1001, max: 1500, sendRegistered: 21, sendUnregistered: 75, withdraw: 29 },
    ]
  },
  {
    id: 'airtel-ug',
    name: 'Airtel Money',
    country: 'Uganda',
    currency: 'UGX',
    color: 'bg-red-600',
    tiers: [
      { min: 500, max: 2500, sendRegistered: 100, sendUnregistered: 1000, withdraw: 330 },
      { min: 5001, max: 15000, sendRegistered: 650, sendUnregistered: 2500, withdraw: 950 },
      { min: 60001, max: 125000, sendRegistered: 1100, sendUnregistered: 4500, withdraw: 2100 },
    ]
  },
  {
    id: 'momo-rw',
    name: 'MTN MoMo',
    country: 'Rwanda',
    currency: 'RWF',
    color: 'bg-yellow-400',
    tiers: [
      { min: 1, max: 100, sendRegistered: 0, sendUnregistered: 100, withdraw: 10 },
      { min: 101, max: 500, sendRegistered: 10, sendUnregistered: 200, withdraw: 50 },
      { min: 1001, max: 5000, sendRegistered: 50, sendUnregistered: 500, withdraw: 200 },
      { min: 10001, max: 20000, sendRegistered: 150, sendUnregistered: 1000, withdraw: 500 },
    ]
  },
  {
    id: 'airtel-rw',
    name: 'Airtel Money',
    country: 'Rwanda',
    currency: 'RWF',
    color: 'bg-red-500',
    tiers: [
      { min: 1, max: 1000, sendRegistered: 0, sendUnregistered: 100, withdraw: 0 },
      { min: 1001, max: 5000, sendRegistered: 20, sendUnregistered: 400, withdraw: 100 },
    ]
  },
  {
    id: 'mpesa-tz',
    name: 'Vodacom M-Pesa',
    country: 'Tanzania',
    currency: 'TZS',
    color: 'bg-red-600',
    tiers: [
      { min: 1000, max: 10000, sendRegistered: 150, sendUnregistered: 800, withdraw: 450 },
      { min: 10001, max: 20000, sendRegistered: 300, sendUnregistered: 1200, withdraw: 900 },
      { min: 50001, max: 100000, sendRegistered: 600, sendUnregistered: 3500, withdraw: 2800 },
    ]
  },
  {
    id: 'airtel-tz',
    name: 'Airtel Money',
    country: 'Tanzania',
    currency: 'TZS',
    color: 'bg-red-500',
    tiers: [
      { min: 1000, max: 10000, sendRegistered: 150, sendUnregistered: 800, withdraw: 450 },
      { min: 10001, max: 20000, sendRegistered: 300, sendUnregistered: 1200, withdraw: 900 },
    ]
  },
  {
    id: 'tigo-tz',
    name: 'Tigo Pesa',
    country: 'Tanzania',
    currency: 'TZS',
    color: 'bg-blue-600',
    tiers: [
      { min: 1000, max: 10000, sendRegistered: 150, sendUnregistered: 800, withdraw: 450 },
    ]
  }
];

export default function MoMoIntelligence() {
  const [network, setNetwork] = useState<Network>(NETWORKS[0]);
  const [amount, setAmount] = useState<string>('');
  const [mode, setMode] = useState<'send' | 'payout'>('send');
  const [isCrossNetwork, setIsCrossNetwork] = useState(false);

  const findTier = (val: number) => {
    return network.tiers.find(t => val >= t.min && val <= t.max) || network.tiers[network.tiers.length - 1];
  };

  const getFees = (val: number) => {
    const tier = findTier(val);
    if (!tier) return { send: 0, unreg: 0, withdraw: 0, total: val };
    
    // Cross network often uses unregistered or a 25% premium on reg fees
    const sendFee = isCrossNetwork ? Math.max(tier.sendUnregistered, tier.sendRegistered * 1.5) : tier.sendRegistered;

    return {
      send: sendFee,
      unreg: tier.sendUnregistered,
      withdraw: tier.withdraw,
      total: val + sendFee
    };
  };

  const calculateTarget = (target: number) => {
    // We want some X such that X - withdrawFee(X) = target
    // For simplicity in tiers, we search the tier that covers the target and add the fee
    const tier = network.tiers.find(t => {
      const netAtMin = t.min - t.withdraw;
      const netAtMax = t.max - t.withdraw;
      return target >= netAtMin && target <= netAtMax;
    }) || network.tiers[network.tiers.length - 1];

    if (!tier) return 0;
    return target + tier.withdraw;
  };

  const numericAmount = parseFloat(amount) || 0;
  const fees = getFees(numericAmount);
  const targetAmount = calculateTarget(numericAmount);
  const targetFees = getFees(targetAmount);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="MoMo Intelligence" />
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/10">
            <Smartphone size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">MoMo Intelligence</h1>
            <p className="text-neutral-500 font-medium text-xs uppercase tracking-widest italic opacity-60">Mobile Money Fee Protocol</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border-2 border-neutral-100 p-8 rounded-[2.5rem] shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-6 flex items-center gap-2">
              <Wallet size={12} /> Transaction Configuration
            </h2>

            <div className="space-y-6">
              {/* Network Selector */}
              <div className="grid grid-cols-1 gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      network.id === n.id 
                        ? 'border-indigo-600 bg-indigo-50/30' 
                        : 'border-neutral-50 bg-neutral-50/50 hover:border-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${n.color}`} />
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-tight text-neutral-900">{n.name}</div>
                        <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{n.country}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-indigo-600">{n.currency}</div>
                  </button>
                ))}
              </div>

              {/* Mode Selector */}
              <div className="flex bg-neutral-100 p-1 rounded-2xl">
                <button
                  onClick={() => setMode('send')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === 'send' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'
                  }`}
                >
                  Standard Send
                </button>
                <button
                  onClick={() => setMode('payout')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === 'payout' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'
                  }`}
                >
                  Target Payout
                </button>
              </div>

              {/* Cross Network Toggle */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100 group">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Cross-Network Protocol</div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Send to different network (e.g MTN to Airtel)</div>
                </div>
                <button
                  onClick={() => setIsCrossNetwork(!isCrossNetwork)}
                  className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${isCrossNetwork ? 'bg-emerald-500 justify-end' : 'bg-neutral-200 justify-start'}`}
                >
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="relative group">
                <div className="absolute top-1/2 -translate-y-1/2 left-6 text-neutral-300 font-black text-sm">
                  {network.currency}
                </div>
                <input
                  type="number"
                  placeholder={mode === 'send' ? 'Amount to Send' : 'Amount for Recipient to Withdraw'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-neutral-50 border-2 border-neutral-100 h-20 pl-20 pr-8 rounded-3xl text-2xl font-black focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-indigo-100 rounded-2xl text-indigo-500">
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-neutral-900 mb-1">Security Note</h4>
                   <p className="text-[10px] text-indigo-900/60 leading-relaxed">
                      Always verify the recipient's name before confirming the transaction on your phone. Fee data is based on {new Date().getFullYear()} tiers for {network.name}.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + network.id + amount}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-neutral-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Calculation Result</div>
                  <div className="flex items-center gap-2">
                    {isCrossNetwork && (
                      <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                        Cross-Network Active
                      </div>
                    )}
                    <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">Live Protocol</div>
                  </div>
                </div>

                {mode === 'send' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Send Fee (Reg)</div>
                        <div className="text-2xl font-black">{fees.send.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">{network.currency}</span></div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Withdraw Fee</div>
                        <div className="text-2xl font-black">{fees.withdraw.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">{network.currency}</span></div>
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total to Deduct</div>
                        <div className="text-5xl font-black leading-none">{fees.total.toLocaleString()}</div>
                        <div className="text-[10px] font-black opacity-40 mt-2 uppercase tracking-widest">Includes Send Fee</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Unregistered</div>
                        <div className="text-xl font-black opacity-60">{(numericAmount + fees.unreg).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2">Amount to Send</div>
                      <div className="text-6xl font-black leading-none">{targetAmount.toLocaleString()}</div>
                      <div className="text-[10px] font-black opacity-40 mt-3 uppercase tracking-widest italic flex items-center gap-2">
                        <Info size={12} /> Includes {targetFees.withdraw} {network.currency} withdrawal fee
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Balance Needed</div>
                        <div className="text-xl font-black">{(targetAmount + targetFees.send).toLocaleString()}</div>
                        <div className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Incl. Sending Costs</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Net for User</div>
                        <div className="text-xl font-black">{numericAmount.toLocaleString()}</div>
                        <div className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Cash in Hand</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="bg-white border-2 border-neutral-100 rounded-[2.5rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-900 flex items-center gap-2">
                 <HelpCircle size={14} className="text-indigo-500" /> Protocol Breakdown
               </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <ArrowUpRight size={16} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Registered vs Unreg</div>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-relaxed font-bold">
                    Sending to a non-registered number costs significantly more. Always invite the recipient to register before sending large amounts.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <ArrowDownLeft size={16} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Tier Optimization</div>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-relaxed font-bold">
                    Mobile money fees work in tiers. Sometimes sending slightly less or more can move you into a better fee bracket. 
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
