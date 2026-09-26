import React, { useState } from 'react';
import { Zap, Droplets, GraduationCap, HeartPulse, Shield, Flame, Trees, Sparkles, ChevronDown, ChevronUp, Building2, Briefcase } from 'lucide-react';
import { CityDemands, CityStats } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface DemandMeterProps {
  demands: CityDemands;
  stats?: CityStats;
  onOpenGraphs?: () => void;
  onOpenOverview?: () => void;
}

export const DemandMeter: React.FC<DemandMeterProps> = ({
  demands,
  stats,
  onOpenGraphs,
  onOpenOverview,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isExpanded, setIsExpanded] = useState(false);

  const powerProd = stats?.powerProduction ?? 0;
  const powerCons = stats?.powerConsumption ?? 0;
  const powerRatio = powerProd > 0 ? powerCons / powerProd : powerCons > 0 ? 2 : 0;
  const powerPercent = Math.min(100, Math.round(powerRatio * 100));
  const isPowerDeficit = powerCons > powerProd;

  const waterProd = stats?.waterProduction ?? 0;
  const waterCons = stats?.waterConsumption ?? 0;
  const waterRatio = waterProd > 0 ? waterCons / waterProd : waterCons > 0 ? 2 : 0;
  const waterPercent = Math.min(100, Math.round(waterRatio * 100));
  const isWaterDeficit = waterCons > waterProd;

  const educationLevel = stats?.educationLevel ?? 50;
  const healthLevel = stats?.needsHealth ?? 75;
  const safetyLevel = stats?.needsSafety ?? 75;
  const fireLevel = Math.min(100, (stats?.population ? Math.max(20, 100 - (stats.abandonedBuildings || 0) * 5) : 80));
  const entertainmentLevel = stats?.needsEnvironment ?? 70;

  return (
    <div className="relative select-none">
      {/* Compact Main Bar */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xl cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-md ${
          isLight
            ? 'bg-white/95 border-neutral-200 text-neutral-900 hover:border-neutral-300 shadow-neutral-200/50'
            : 'bg-neutral-950/92 border-neutral-800 text-white hover:border-neutral-700 shadow-black/80'
        }`}
        title="City Demands & Municipal Services (Click to toggle expanded micro-progress bars)"
      >
        {/* R-C-I-O Demand Cluster */}
        <div className={`flex items-center gap-1 pr-1.5 border-r ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
          <div className="flex flex-col items-center" title={`Residential Demand: ${demands.residential}%`}>
            <span className="text-[7.5px] font-mono font-bold text-emerald-500 leading-none">R</span>
            <div className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className="w-full bg-emerald-500 transition-all duration-500" style={{ height: `${demands.residential}%` }} />
            </div>
          </div>

          <div className="flex flex-col items-center" title={`Commercial Demand: ${demands.commercial}%`}>
            <span className="text-[7.5px] font-mono font-bold text-sky-500 leading-none">C</span>
            <div className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className="w-full bg-sky-500 transition-all duration-500" style={{ height: `${demands.commercial}%` }} />
            </div>
          </div>

          <div className="flex flex-col items-center" title={`Industrial Demand: ${demands.industrial}%`}>
            <span className="text-[7.5px] font-mono font-bold text-amber-500 leading-none">I</span>
            <div className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className="w-full bg-amber-500 transition-all duration-500" style={{ height: `${demands.industrial}%` }} />
            </div>
          </div>

          <div className="flex flex-col items-center" title={`Office Demand: ${demands.office}%`}>
            <span className="text-[7.5px] font-mono font-bold text-blue-400 leading-none">O</span>
            <div className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className="w-full bg-blue-500 transition-all duration-500" style={{ height: `${demands.office}%` }} />
            </div>
          </div>
        </div>

        {/* Utilities & Key Services Mini Cluster */}
        <div className="flex items-center gap-1.5 pl-0.5">
          {/* Power */}
          <div className="flex flex-col items-center" title={`Power: ${powerCons}/${powerProd} MW (${powerPercent}%)`}>
            <Zap className={`w-2.5 h-2.5 ${isPowerDeficit ? 'text-rose-500 animate-pulse' : 'text-yellow-500'}`} />
            <div className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className={`w-full transition-all duration-500 ${isPowerDeficit ? 'bg-rose-500 animate-pulse' : 'bg-yellow-400'}`} style={{ height: `${powerPercent}%` }} />
            </div>
            <span className="text-[6.5px]">⚡</span>
          </div>

          {/* Water */}
          <div className="flex flex-col items-center" title={`Water: ${waterCons}/${waterProd} kL (${waterPercent}%)`}>
            <Droplets className={`w-2.5 h-2.5 ${isWaterDeficit ? 'text-rose-500 animate-pulse' : 'text-sky-500'}`} />
            <div className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
              <div className={`w-full transition-all duration-500 ${isWaterDeficit ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'}`} style={{ height: `${waterPercent}%` }} />
            </div>
            <span className="text-[6.5px]">💧</span>
          </div>

          {/* Expand Toggle Icon */}
          <div className="flex items-center pl-1 text-neutral-400">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded Micro Progress Bars Panel */}
      {isExpanded && (
        <div
          className={`absolute top-full left-0 mt-2 p-3 rounded-2xl border shadow-2xl backdrop-blur-2xl z-50 w-72 animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white/98 border-neutral-300 text-neutral-900 shadow-neutral-300/80'
              : 'bg-neutral-950/96 border-neutral-800 text-white shadow-black/90'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-700/40">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-xs tracking-wide">Municipal City Metrics</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 hover:opacity-80 font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            {/* RCI & Office Demands */}
            <div className="space-y-1.5">
              <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">Zone Demands</span>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-emerald-500" /> Residential</span>
                  <span className="font-mono font-bold">{Math.round(demands.residential)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${demands.residential}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-sky-500" /> Commercial</span>
                  <span className="font-mono font-bold">{Math.round(demands.commercial)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${demands.commercial}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-amber-500" /> Industrial</span>
                  <span className="font-mono font-bold">{Math.round(demands.industrial)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${demands.industrial}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-blue-400" /> Office</span>
                  <span className="font-mono font-bold">{Math.round(demands.office)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${demands.office}%` }} />
                </div>
              </div>
            </div>

            {/* Utilities & Public Services */}
            <div className="space-y-1.5">
              <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">Services & Utilities</span>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Power Grid</span>
                  <span className="font-mono font-bold">{powerPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isPowerDeficit ? 'bg-rose-500' : 'bg-yellow-400'}`} style={{ width: `${powerPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" /> Water Supply</span>
                  <span className="font-mono font-bold">{waterPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isWaterDeficit ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${waterPercent}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-amber-400" /> Education</span>
                  <span className="font-mono font-bold">{Math.round(educationLevel)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${educationLevel}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-rose-400" /> Healthcare</span>
                  <span className="font-mono font-bold">{Math.round(healthLevel)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${healthLevel}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" /> Police</span>
                  <span className="font-mono font-bold">{Math.round(safetyLevel)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${safetyLevel}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Fire Safety</span>
                  <span className="font-mono font-bold">{Math.round(fireLevel)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${fireLevel}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="flex items-center gap-1"><Trees className="w-3 h-3 text-emerald-400" /> Parks & Rec</span>
                  <span className="font-mono font-bold">{Math.round(entertainmentLevel)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${entertainmentLevel}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-neutral-700/40 flex justify-between items-center text-[10px] text-neutral-400">
            <span>Click anywhere to close</span>
            {onOpenGraphs && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onOpenGraphs();
                }}
                className="text-emerald-400 hover:underline font-bold cursor-pointer"
              >
                Detailed Graphs →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
