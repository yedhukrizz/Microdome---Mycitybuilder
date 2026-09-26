import React from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Globe, AlertTriangle } from 'lucide-react';
import { CityBudget, CityStats } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface EconomyModalProps {
  budget: CityBudget;
  stats: CityStats;
  onUpdateTaxRate: (zone: 'residential' | 'commercial' | 'industrial' | 'office', rate: number) => void;
  onTakeBond: (amount: number) => void;
  onExpandMap: (direction: 'south' | 'east' | 'west') => void;
  onClose: () => void;
}

export const EconomyModal: React.FC<EconomyModalProps> = ({
  budget,
  stats,
  onUpdateTaxRate,
  onTakeBond,
  onExpandMap,
  onClose,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isNegative = budget.treasury < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-xs select-none border ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/70 border-neutral-800'
          }`}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              City Economy & Regional Development
            </h2>
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
              Weekly tax policy, municipal revenue, loans, and map expansion
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900'
                : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Negative Balance / Emergency Loan Warning Banner */}
          {isNegative && (
            <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                <div>
                  <div className="font-bold text-rose-400 text-sm">Treasury is in Negative Balance!</div>
                  <div className="text-[11px] text-neutral-300">Take an emergency bailout loan immediately to prevent municipal bankruptcy.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTakeBond(50000)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg cursor-pointer whitespace-nowrap"
              >
                Take $50k Bailout Loan
              </button>
            </div>
          )}

          {/* Top Cash Balance cards */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <span className={`block mb-1 text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Treasury Reserves
              </span>
              <span className={`text-xl font-mono font-bold tabular-nums ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
                ${budget.treasury.toLocaleString()}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <span className={`block mb-1 text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Weekly Income
              </span>
              <span className="text-xl font-mono font-bold text-emerald-500 flex items-center gap-1 tabular-nums">
                <TrendingUp className="w-4 h-4" />
                +${budget.incomePerWeek.toLocaleString()}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <span className={`block mb-1 text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Weekly Expenses
              </span>
              <span className="text-xl font-mono font-bold text-rose-500 flex items-center gap-1 tabular-nums">
                <TrendingDown className="w-4 h-4" />
                -${budget.expensesPerWeek.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Map Expansion Section */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-neutral-50/80 border-neutral-200' : 'bg-black/60 border-neutral-800'
            }`}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-500" />
              Procedural Map & Boundary Expansion (Away from Northern Highway)
            </h3>
            <span className={`block text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Expand city boundaries procedurally by +12 tiles in your chosen direction with generated terrain and rivers (Cost: $40,000 per expansion).
            </span>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onExpandMap('south')}
                className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                <span>Expand South ($40k)</span>
              </button>
              <button
                type="button"
                onClick={() => onExpandMap('east')}
                className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                <span>Expand East ($40k)</span>
              </button>
              <button
                type="button"
                onClick={() => onExpandMap('west')}
                className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                <span>Expand West ($40k)</span>
              </button>
            </div>
          </div>

          {/* Tax Rates Management Sliders */}
          <div
            className={`p-4 rounded-xl border space-y-4 ${
              isLight ? 'bg-neutral-50/80 border-neutral-200' : 'bg-black/60 border-neutral-800'
            }`}
          >
            <h3 className="text-sm font-semibold">Municipal Tax Policies</h3>
            <span className={`block text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Standard recommended tax rate is 9-11%. Rates above 12% suppress incoming demand.
            </span>

            <div className="space-y-3 pt-1">
              <TaxSlider
                label="Residential Tax"
                rate={budget.taxRateResidential}
                onChange={(val) => onUpdateTaxRate('residential', val)}
                isLight={isLight}
              />
              <TaxSlider
                label="Commercial Tax"
                rate={budget.taxRateCommercial}
                onChange={(val) => onUpdateTaxRate('commercial', val)}
                isLight={isLight}
              />
              <TaxSlider
                label="Industrial Tax"
                rate={budget.taxRateIndustrial}
                onChange={(val) => onUpdateTaxRate('industrial', val)}
                isLight={isLight}
              />
              <TaxSlider
                label="High-Tech Office Tax"
                rate={budget.taxRateOffice}
                onChange={(val) => onUpdateTaxRate('office', val)}
                isLight={isLight}
              />
            </div>
          </div>

          {/* Emergency Municipal Bonds & Loans */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-neutral-50/80 border-neutral-200' : 'bg-black/60 border-neutral-800'
            }`}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Municipal City Bonds & Loans (Instant Cash Infusion)
            </h3>
            <span className={`block text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Borrow funds from the regional development bank to construct critical infrastructure or recover from negative treasury.
            </span>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onTakeBond(25000)}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-neutral-100 border-neutral-250 text-neutral-900'
                    : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-white'
                }`}
              >
                <span className="font-semibold text-xs">Small Infrastructure Bond</span>
                <span className="font-mono text-emerald-500 text-sm font-bold block mt-1">+$25,000 Cash</span>
                <span className={`text-[10px] mt-1 block ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  +$350/wk interest repayment
                </span>
              </button>

              <button
                type="button"
                onClick={() => onTakeBond(75000)}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-neutral-100 border-neutral-250 text-neutral-900'
                    : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-white'
                }`}
              >
                <span className="font-semibold text-xs">Major Metropolis Bond</span>
                <span className="font-mono text-emerald-500 text-sm font-bold block mt-1">+$75,000 Cash</span>
                <span className={`text-[10px] mt-1 block ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  +$950/wk interest repayment
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TaxSliderProps {
  label: string;
  rate: number;
  onChange: (val: number) => void;
  isLight: boolean;
}

const TaxSlider: React.FC<TaxSliderProps> = ({ label, rate, onChange, isLight }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`w-36 font-medium ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>{label}</span>
      <input
        type="range"
        min={4}
        max={18}
        value={rate}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-emerald-500 cursor-pointer"
      />
      <span className={`font-mono font-bold w-12 text-right tabular-nums ${isLight ? 'text-neutral-900' : 'text-white'}`}>
        {rate}%
      </span>
    </div>
  );
};
