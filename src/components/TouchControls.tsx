import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TouchControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetView: () => void;
  onZoomOverview?: () => void;
  onPanDirection?: (dir: 'up' | 'down' | 'left' | 'right') => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onResetView,
  onZoomOverview,
  onPanDirection,
}) => {
  const { theme, undistractedMode } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const isLight = theme === 'light';

  // If collapsed or in undistracted mode, show small toggle button
  if (collapsed || undistractedMode) {
    return (
      <div className="absolute right-2 top-12 z-20 select-none">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Show Camera Controls"
          className={`p-1.5 rounded-lg border shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105 ${
            isLight
              ? 'bg-white/90 text-neutral-700 border-neutral-300'
              : 'bg-black/90 text-neutral-300 border-neutral-800'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-2 top-12 z-20 flex flex-col items-end gap-1 select-none animate-in fade-in duration-150">
      {/* Collapse button */}
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        title="Hide Camera Controls"
        className={`px-1.5 py-0.5 rounded text-[9px] border shadow-xs backdrop-blur-md cursor-pointer flex items-center gap-0.5 transition-all mb-0.5 ${
          isLight
            ? 'bg-white/80 hover:bg-white text-neutral-500 border-neutral-250'
            : 'bg-black/80 hover:bg-black text-neutral-400 border-neutral-800'
        }`}
      >
        <span>Hide</span>
        <ChevronRight className="w-2.5 h-2.5" />
      </button>

      {/* Directional Map Pan Cluster */}
      {onPanDirection && (
        <div
          className={`p-1 rounded-xl border shadow-lg backdrop-blur-md grid grid-cols-3 gap-0.5 mb-0.5 ${
            isLight
              ? 'bg-white/90 border-neutral-200'
              : 'bg-black/85 border-neutral-800'
          }`}
        >
          <div />
          <button
            type="button"
            onClick={() => onPanDirection('up')}
            title="Pan Map Up"
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:bg-emerald-500 active:text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:bg-emerald-500 active:text-black'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => onPanDirection('left')}
            title="Pan Map Left"
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:bg-emerald-500 active:text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:bg-emerald-500 active:text-black'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetView}
            title="Center City Map"
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
              isLight
                ? 'bg-neutral-200 hover:bg-neutral-300 text-emerald-600 active:scale-95'
                : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 active:scale-95'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPanDirection('right')}
            title="Pan Map Right"
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:bg-emerald-500 active:text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:bg-emerald-500 active:text-black'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => onPanDirection('down')}
            title="Pan Map Down"
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:bg-emerald-500 active:text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:bg-emerald-500 active:text-black'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <div />
        </div>
      )}

      {/* Camera View Controls Column */}
      <div
        className={`flex flex-col gap-1 p-1 rounded-xl border shadow-lg backdrop-blur-md ${
          isLight
            ? 'bg-white/90 border-neutral-200'
            : 'bg-black/85 border-neutral-800'
        }`}
      >
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:scale-95'
          }`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:scale-95'
          }`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onRotateLeft}
          title="Rotate Left"
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:scale-95'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onRotateRight}
          title="Rotate Right"
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center cursor-pointer transition-all ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 active:scale-95'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
