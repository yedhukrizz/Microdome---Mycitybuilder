import React from 'react';
import { Zap, Droplets } from 'lucide-react';
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

  const handleClick = () => {
    if (isPowerDeficit || isWaterDeficit) {
      if (onOpenOverview) onOpenOverview();
      else if (onOpenGraphs) onOpenGraphs();
    } else {
      if (onOpenGraphs) onOpenGraphs();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-lg select-none cursor-pointer active:scale-95 transition-all group backdrop-blur-md ${
        isLight
          ? 'bg-white/95 border-neutral-200 text-neutral-900 hover:border-neutral-300'
          : 'bg-black/92 border-neutral-800 text-white hover:border-neutral-700'
      }`}
      title="RCI Demands & Municipal Grid Loads (Click to view full Utilities & Analytics)"
    >
      {/* RCI Demand Cluster */}
      <div className={`flex items-center gap-1 pr-1.5 border-r ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
        <div className="flex flex-col items-center">
          <span className="text-[7.5px] font-mono font-bold text-emerald-500 leading-none">R</span>
          <div
            className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${
              isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div
              className="w-full bg-emerald-500 transition-all duration-500"
              style={{ height: `${demands.residential}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[7.5px] font-mono font-bold text-sky-500 leading-none">C</span>
          <div
            className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${
              isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div
              className="w-full bg-sky-500 transition-all duration-500"
              style={{ height: `${demands.commercial}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[7.5px] font-mono font-bold text-amber-500 leading-none">I</span>
          <div
            className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${
              isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div
              className="w-full bg-amber-500 transition-all duration-500"
              style={{ height: `${demands.industrial}%` }}
            />
          </div>
        </div>
      </div>

      {/* Utilities Requirement Mini Graphs (Power & Water) */}
      <div className="flex items-center gap-1.5 pl-0.5">
        {/* Electrical Power Grid Meter */}
        <div
          className="flex flex-col items-center"
          title={`Power Grid Load: ${powerCons}/${powerProd} MW (${powerPercent}% load)${
            isPowerDeficit ? ' - DEFICIT!' : ''
          }`}
        >
          <div className="flex items-center justify-center -mb-0.5">
            <Zap
              className={`w-2.5 h-2.5 ${
                isPowerDeficit ? 'text-rose-500 animate-pulse' : 'text-yellow-500'
              }`}
            />
          </div>
          <div
            className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${
              isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div
              className={`w-full transition-all duration-500 ${
                isPowerDeficit ? 'bg-rose-500 animate-pulse' : 'bg-yellow-400'
              }`}
              style={{ height: `${powerPercent}%` }}
            />
          </div>
          <span
            className={`text-[6.5px] font-mono font-bold leading-none ${
              isPowerDeficit ? 'text-rose-500' : isLight ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            ⚡
          </span>
        </div>

        {/* Municipal Water Network Meter */}
        <div
          className="flex flex-col items-center"
          title={`Water Network Load: ${waterCons}/${waterProd} kL (${waterPercent}% load)${
            isWaterDeficit ? ' - DEFICIT!' : ''
          }`}
        >
          <div className="flex items-center justify-center -mb-0.5">
            <Droplets
              className={`w-2.5 h-2.5 ${
                isWaterDeficit ? 'text-rose-500 animate-pulse' : 'text-sky-500'
              }`}
            />
          </div>
          <div
            className={`w-1.5 h-6 rounded-xs overflow-hidden flex flex-col justify-end border my-0.5 ${
              isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <div
              className={`w-full transition-all duration-500 ${
                isWaterDeficit ? 'bg-rose-500 animate-pulse' : 'bg-sky-500'
              }`}
              style={{ height: `${waterPercent}%` }}
            />
          </div>
          <span
            className={`text-[6.5px] font-mono font-bold leading-none ${
              isWaterDeficit ? 'text-rose-500' : isLight ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            💧
          </span>
        </div>
      </div>
    </div>
  );
};
