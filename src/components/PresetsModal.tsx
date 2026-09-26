import React from 'react';
import { X, Map, Save, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PresetsModalProps {
  onSelectPreset: (preset: 'starter' | 'busy' | 'delta') => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  hasSavedGame: boolean;
  onClose: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  onSelectPreset,
  onSaveGame,
  onLoadGame,
  hasSavedGame,
  onClose,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-xs select-none border ${
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
              <Map className="w-5 h-5 text-sky-500" />
              Scenarios, Maps & Game Save
            </h2>
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
              Select an initial scenario or manage saved cities
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
        <div className="p-6 space-y-6">
          {/* Preset Map Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Select City Scenario</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectPreset('starter');
                  onClose();
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <span className="font-bold text-xs">Greenfield River</span>
                <span className={`text-[10px] mt-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Gentle river delta with starter highway access and $65,000 cash.
                </span>
                <span className="text-[10px] font-mono text-emerald-500 mt-2 font-semibold">Beginner · Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPreset('busy');
                  onClose();
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <span className="font-bold text-xs">Bustling City</span>
                <span className={`text-[10px] mt-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Established downtown with skyscrapers, active traffic, power & water grid.
                </span>
                <span className="text-[10px] font-mono text-sky-500 mt-2 font-semibold">Intermediate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPreset('delta');
                  onClose();
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <span className="font-bold text-xs">Delta Bridge Bay</span>
                <span className={`text-[10px] mt-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Elevated bridge spanning wide river channel. Great for waterfront estates.
                </span>
                <span className="text-[10px] font-mono text-purple-500 mt-2 font-semibold">Scenic Bay</span>
              </button>
            </div>
          </div>

          {/* Save / Load Storage */}
          <div
            className={`border rounded-xl p-4 space-y-3 ${
              isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/60 border-neutral-800'
            }`}
          >
            <h3 className="text-sm font-semibold">Local Browser Storage</h3>
            <span className={`block text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Persist your metropolis layout and budget in your browser's local memory.
            </span>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onSaveGame}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save City</span>
              </button>

              <button
                type="button"
                onClick={onLoadGame}
                disabled={!hasSavedGame}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors cursor-pointer border ${
                  hasSavedGame
                    ? isLight
                      ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
                      : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-700 text-white'
                    : 'opacity-40 cursor-not-allowed border-transparent'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Load Saved City</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
