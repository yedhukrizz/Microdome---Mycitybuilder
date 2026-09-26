import React from 'react';
import { OverlayMode } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface OverlayLegendProps {
  mode: OverlayMode;
  onClose: () => void;
}

export const OverlayLegend: React.FC<OverlayLegendProps> = ({ mode, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (mode === 'none') return null;

  return (
    <div
      className={`absolute bottom-20 left-4 z-30 p-3 rounded-xl border shadow-xl text-xs select-none animate-in fade-in duration-200 backdrop-blur-md ${
        isLight
          ? 'bg-white/95 border-neutral-200 text-neutral-900'
          : 'bg-black/92 border-neutral-800 text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="font-semibold capitalize">{mode.replace('_', ' ')} Overlay</span>
        <button
          type="button"
          onClick={onClose}
          className={`text-[10px] cursor-pointer ${
            isLight ? 'text-neutral-400 hover:text-neutral-900' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Close [Esc]
        </button>
      </div>

      {mode === 'electricity' && (
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-yellow-400 inline-block" />
            <span className={isLight ? 'text-neutral-700' : 'text-neutral-300'}>Powered Grid Conduit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-xs inline-block ${isLight ? 'bg-neutral-300' : 'bg-neutral-700'}`} />
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>Disconnected / Unpowered</span>
          </div>
        </div>
      )}

      {mode === 'water' && (
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-sky-400 inline-block" />
            <span className={isLight ? 'text-neutral-700' : 'text-neutral-300'}>Pressurized Water Supply</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-xs inline-block ${isLight ? 'bg-neutral-300' : 'bg-neutral-700'}`} />
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>No Water Connection</span>
          </div>
        </div>
      )}

      {mode === 'land_value' && (
        <div className="space-y-1.5 text-[11px]">
          <div className={`flex items-center justify-between text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            <span>Low Value</span>
            <span>High Value</span>
          </div>
          <div className="w-36 h-2 rounded bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500" />
        </div>
      )}

      {mode === 'traffic' && (
        <div className="space-y-1.5 text-[11px]">
          <div className={`flex items-center justify-between text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            <span>Free Flow</span>
            <span>Congested</span>
          </div>
          <div className="w-36 h-2 rounded bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" />
        </div>
      )}

      {mode === 'pollution' && (
        <div className="space-y-1.5 text-[11px]">
          <div className={`flex items-center justify-between text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            <span>Clean Air</span>
            <span>Heavy Smog</span>
          </div>
          <div className="w-36 h-2 rounded bg-gradient-to-r from-neutral-800 to-amber-700" />
        </div>
      )}
    </div>
  );
};
