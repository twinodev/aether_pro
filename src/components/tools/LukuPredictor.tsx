import React, { useState, useEffect } from 'react';
import { Zap, Clock, Calendar, AlertTriangle, Info, Plus, Trash2, TrendingDown, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OfflineAlert from '../ui/OfflineAlert';

interface Appliance {
  id: string;
  name: string;
  watts: number;
  hoursPerDay: number;
  count: number;
}

const DEFAULT_APPLIANCES: Omit<Appliance, 'id'>[] = [
  { name: 'LED Bulbs', watts: 10, hoursPerDay: 6, count: 5 },
  { name: 'TV (LED)', watts: 80, hoursPerDay: 4, count: 1 },
  { name: 'Fridge', watts: 150, hoursPerDay: 24, count: 1 },
  { name: 'Iron Box', watts: 1000, hoursPerDay: 0.5, count: 1 },
  { name: 'Phone Charger', watts: 15, hoursPerDay: 3, count: 2 },
];

export default function LukuPredictor() {
  const [units, setUnits] = useState<number>(20);
  const [appliances, setAppliances] = useState<Appliance[]>(
    DEFAULT_APPLIANCES.map(a => ({ ...a, id: Math.random().toString(36).substr(2, 9) }))
  );
  const [customWatts, setCustomWatts] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  const dailyKwh = appliances.reduce((sum, app) => {
    // Energy (kWh) = (Watts * Hours * Count) / 1000
    return sum + (app.watts * app.hoursPerDay * app.count) / 1000;
  }, 0);

  const daysRemaining = dailyKwh > 0 ? units / dailyKwh : 0;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + Math.floor(daysRemaining));

  const addAppliance = () => {
    if (!customName || !customWatts) return;
    const newApp: Appliance = {
      id: Math.random().toString(36).substr(2, 9),
      name: customName,
      watts: parseInt(customWatts),
      hoursPerDay: 1,
      count: 1,
    };
    setAppliances([...appliances, newApp]);
    setCustomName('');
    setCustomWatts('');
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter(a => a.id !== id));
  };

  const updateAppliance = (id: string, field: keyof Appliance, value: number) => {
    setAppliances(appliances.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <OfflineAlert toolName="Energy Intelligence" />
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-yellow-400 text-neutral-900 rounded-2xl shadow-xl shadow-yellow-400/10">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 uppercase">Luku Predictor</h1>
            <p className="text-neutral-500 font-medium text-xs uppercase tracking-widest italic opacity-60">Smart Token Longevity Forecasting</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-900 text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-4">Current Token Balance</label>
            <div className="flex items-end gap-3 mb-6">
              <input
                type="number"
                value={units}
                onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
                className="bg-transparent text-5xl font-black focus:outline-none w-full"
              />
              <span className="text-xl font-bold mb-2 opacity-50 uppercase tracking-widest">kWh</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Daily Spend</div>
                <div className="text-lg font-black">{dailyKwh.toFixed(2)} <span className="text-[10px]">kWh</span></div>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                 <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Monthly Cost</div>
                 <div className="text-lg font-black">{(dailyKwh * 30).toFixed(1)} <span className="text-[10px]">kWh</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-neutral-100 p-6 rounded-[2.5rem] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Plus size={16} /> Quick Add Appliance
            </h3>
            <div className="space-y-3">
              <input
                placeholder="Name (e.g. Kettle)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-xs font-bold"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Watts (W)"
                  value={customWatts}
                  onChange={(e) => setCustomWatts(e.target.value)}
                  className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100 text-xs font-bold"
                />
                <button
                  onClick={addAppliance}
                  className="px-6 bg-yellow-400 text-neutral-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                <Clock size={20} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Time Remaining</div>
              <div className="text-6xl font-black text-neutral-900 mb-1">
                {daysRemaining > 365 ? '>1y' : Math.floor(daysRemaining)}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-emerald-800">Full Days</div>
              
              {daysRemaining < 3 && daysRemaining > 0 && (
                <div className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                  <AlertTriangle size={12} /> Critical Balance
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-indigo-50 border-2 border-indigo-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                <Calendar size={20} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Estimated Blackout</div>
              <div className="text-2xl font-black text-neutral-900 mt-2">
                {expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-800 mt-1">
                {expiryDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          </div>

          <div className="bg-white border-2 border-neutral-100 rounded-[2.5rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-900">Load Inventory</h2>
              <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic flex items-center gap-2">
                 <Info size={12} /> Real-time Simulation
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Appliance</th>
                    <th className="px-8 py-4">Load (W)</th>
                    <th className="px-8 py-4">Daily Use</th>
                    <th className="px-8 py-4">Qty</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold divide-y divide-neutral-50">
                  <AnimatePresence>
                    {appliances.map((app) => (
                      <motion.tr 
                        key={app.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-8 py-4 text-neutral-900 font-black uppercase tracking-tight">{app.name}</td>
                        <td className="px-8 py-4 text-neutral-500">{app.watts}W</td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={app.hoursPerDay}
                              onChange={(e) => updateAppliance(app.id, 'hoursPerDay', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-neutral-100 px-2 py-1 rounded-md text-center focus:bg-white transition-all border border-transparent focus:border-neutral-200"
                            />
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">hrs</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="number"
                            min="1"
                            value={app.count}
                            onChange={(e) => updateAppliance(app.id, 'count', parseInt(e.target.value) || 1)}
                            className="w-12 bg-neutral-100 px-2 py-1 rounded-md text-center focus:bg-white transition-all border border-transparent focus:border-neutral-200"
                          />
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => removeAppliance(app.id)}
                            className="p-2 text-neutral-200 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Efficiency Tips */}
          <div className="bg-neutral-50 p-6 rounded-[2.5rem] border border-neutral-100">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-neutral-100 rounded-2xl text-emerald-500">
                   <TrendingDown size={20} />
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-neutral-900 mb-1">Efficiency Protocol</h4>
                   <p className="text-[10px] text-neutral-500 leading-relaxed max-w-sm">
                      Reducing fridge door openings and switching to LED bulbs can extend your current units by up to 15%. Consider unplugging phantom chargers when not in use.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
