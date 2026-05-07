import React, { useState, useEffect } from 'react';
import { Scale, Repeat, Calculator, ArrowRightLeft, Globe } from 'lucide-react';
import { motion } from 'motion/react';

type UnitType = 'length' | 'weight' | 'volume' | 'currency';

const UNITS = {
  length: {
    m: { name: 'Meter', factor: 1 },
    km: { name: 'Kilometer', factor: 1000 },
    cm: { name: 'Centimeter', factor: 0.01 },
    mm: { name: 'Millimeter', factor: 0.001 },
    mi: { name: 'Mile', factor: 1609.34 },
    yd: { name: 'Yard', factor: 0.9144 },
    ft: { name: 'Foot', factor: 0.3048 },
    in: { name: 'Inch', factor: 0.0254 },
  },
  weight: {
    kg: { name: 'Kilogram', factor: 1 },
    g: { name: 'Gram', factor: 0.001 },
    mg: { name: 'Milligram', factor: 0.000001 },
    lb: { name: 'Pound', factor: 0.453592 },
    oz: { name: 'Ounce', factor: 0.0283495 },
    t: { name: 'Metric Ton', factor: 1000 },
  },
  volume: {
    l: { name: 'Liter', factor: 1 },
    ml: { name: 'Milliliter', factor: 0.001 },
    gal: { name: 'Gallon (US)', factor: 3.78541 },
    qt: { name: 'Quart (US)', factor: 0.946353 },
    pt: { name: 'Pint (US)', factor: 0.473176 },
    cup: { name: 'Cup (US)', factor: 0.236588 },
  },
  currency: {
    USD: { name: 'US Dollar', factor: 1 },
    EUR: { name: 'Euro', factor: 0.94 },
    GBP: { name: 'British Pound', factor: 0.81 },
    JPY: { name: 'Japanese Yen', factor: 154.5 },
    AUD: { name: 'Australian Dollar', factor: 1.55 },
    CAD: { name: 'Canadian Dollar', factor: 1.38 },
    CHF: { name: 'Swiss Franc', factor: 0.91 },
    CNY: { name: 'Chinese Yuan', factor: 7.24 },
    UGX: { name: 'Ugandan Shilling', factor: 3750 },
    KES: { name: 'Kenyan Shilling', factor: 132 },
    TZS: { name: 'Tanzanian Shilling', factor: 2580 },
    RWF: { name: 'Rwandan Franc', factor: 1290 },
    BIF: { name: 'Burundian Franc', factor: 2850 },
    ETB: { name: 'Ethiopian Birr', factor: 57 },
    SOS: { name: 'Somali Shilling', factor: 570 },
    SSP: { name: 'South Sudanese Pound', factor: 130 },
    DJF: { name: 'Djiboutian Franc', factor: 178 },
    KMF: { name: 'Comorian Franc', factor: 462 },
  }
};

export default function UnitConverter() {
  const [type, setType] = useState<UnitType>('length');
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('cm');

  useEffect(() => {
    // Reset units when type changes
    const defaultFrom = Object.keys(UNITS[type])[0];
    const defaultTo = Object.keys(UNITS[type])[1];
    setFromUnit(defaultFrom);
    setToUnit(defaultTo);
  }, [type]);

  useEffect(() => {
    if (!type || !UNITS[type]) return;
    
    const from = fromValue ? parseFloat(fromValue) : 0;
    const units = UNITS[type] as Record<string, { factor: number }>;
    
    if (isNaN(from) || !units[fromUnit] || !units[toUnit]) {
      // Don't clear if units are just mid-transition
      return;
    }

    const fromFactor = units[fromUnit]?.factor;
    const toFactor = units[toUnit]?.factor;

    if (fromFactor === undefined || toFactor === undefined) return;

    const valueInBase = from * fromFactor;
    const result = valueInBase / toFactor;
    
    setToValue(result.toLocaleString(undefined, { maximumFractionDigits: 6 }));
  }, [fromValue, fromUnit, toUnit, type]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 text-white rounded-lg">
            <Repeat size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Converter</h1>
        </div>
        <p className="text-neutral-500">Universal unit and currency conversion.</p>
      </header>

      {/* Type Switcher */}
      <div className="flex gap-2 mb-8 bg-neutral-100 p-1 rounded-2xl">
        {(['length', 'weight', 'volume', 'currency'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${
              type === t 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t === 'length' && <Calculator size={14} />}
            {t === 'weight' && <Scale size={14} />}
            {t === 'volume' && <ArrowRightLeft size={14} />}
            {t === 'currency' && <Globe size={14} />}
            <span className="hidden sm:inline">{t}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* From */}
        <div className="bg-white border-2 border-neutral-100 rounded-3xl p-6 shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4 block">Convert From</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="flex-1 text-4xl font-light bg-transparent border-none outline-none focus:ring-0 placeholder:text-neutral-200"
              placeholder="0.00"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-neutral-50 border-none rounded-xl px-4 py-2 font-bold text-sm focus:ring-0"
            >
              {(Object.entries(UNITS[type]) as [string, { name: string, factor: number }][]).map(([key, val]) => (
                <option key={key} value={key}>{val.name} ({key})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button 
            onClick={swapUnits}
            className="p-3 bg-neutral-900 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg border-4 border-white"
          >
            <Repeat size={20} className="rotate-90" />
          </button>
        </div>

        {/* To */}
        <div className="bg-neutral-900 border-2 border-neutral-900 rounded-3xl p-6 shadow-xl">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4 block">Converted Value</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 text-4xl font-light text-white overflow-hidden text-ellipsis">
              {toValue || '0'}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="bg-white/10 border-none text-white rounded-xl px-4 py-2 font-bold text-sm focus:ring-0"
            >
              {(Object.entries(UNITS[type]) as [string, { name: string, factor: number }][]).map(([key, val]) => (
                <option key={key} value={key} className="text-neutral-900">{val.name} ({key})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <footer className="mt-12 p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
        <p className="text-xs text-neutral-400 font-medium">
          {type === 'currency' 
            ? 'Currency rates are approximate. Always verify with official sources for financial transactions.' 
            : 'All conversions use internationally standardized mathematical constants.'}
        </p>
      </footer>
    </div>
  );
}
