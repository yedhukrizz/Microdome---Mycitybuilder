import React from 'react';
import {
  X,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  VolumeX,
  Monitor,
  Sliders,
  Map,
  Save,
  Download,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  onSelectPreset: (preset: 'starter' | 'busy' | 'delta') => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onDownloadJson?: () => void;
  onReturnHome?: () => void;
  hasSavedGame: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleDayNight: () => void;
  dayTime: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onSelectPreset,
  onSaveGame,
  onLoadGame,
  onDownloadJson,
  onReturnHome,
  hasSavedGame,
  onClose,
  isMuted,
  onToggleMute,
  onToggleDayNight,
  dayTime,
}) => {
  const {
    theme,
    setTheme,
    undistractedMode,
    toggleUndistractedMode,
    graphicsQuality,
    setGraphicsQuality,
    contactShadows,
    setContactShadows,
  } = useTheme();

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-xs select-none transition-colors border ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-neutral-50/90 border-neutral-200'
              : 'bg-black/70 border-neutral-800'
          }`}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sliders className={`w-5 h-5 ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`} />
              Game & Display Settings
            </h2>
            <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
              UI appearance, graphics fidelity, and undistracted gameplay options
            </span>
          </div>
          <button
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
          {/* Section 1: UI Theme (Black vs White Light Mode) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-emerald-500" />
                UI Appearance Theme
              </h3>
              <span className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Active: <strong className="capitalize">{theme} UI</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pitch Black UI Option */}
              <button
                type="button"
                onClick={() => setTheme('black')}
                className={`flex flex-col items-start p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left relative ${
                  theme === 'black'
                    ? 'border-emerald-500 bg-neutral-900 text-white shadow-lg'
                    : isLight
                    ? 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300'
                }`}
              >
                {theme === 'black' && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-black border border-neutral-700 flex items-center justify-center text-amber-400">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs">Black UI (Pitch Dark)</span>
                </div>
                <p className={`text-[10px] leading-relaxed ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Deep pitch black canvas (#000000) with sleek neutral borders. Zero dark-blue tint, high contrast, undistracted focus.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-black text-white border border-neutral-700">#000000</span>
                  <span className="text-emerald-400 font-semibold">OLED Friendly</span>
                </div>
              </button>

              {/* Pure White Light UI Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-start p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left relative ${
                  theme === 'light'
                    ? 'border-emerald-600 bg-white text-neutral-900 shadow-lg'
                    : isLight
                    ? 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300'
                }`}
              >
                {theme === 'light' && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-white border border-neutral-300 flex items-center justify-center text-amber-500 shadow-xs">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs">White UI (Light Mode)</span>
                </div>
                <p className={`text-[10px] leading-relaxed ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                  Crisp architectural daylight aesthetic with pure white cards (#FFFFFF), soft shadows, and high-legibility dark typography.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-300">#FFFFFF</span>
                  <span className="text-sky-600 font-semibold">Architectural</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Undistracted Play / Zen Mode */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isLight
                ? 'bg-neutral-50/90 border-neutral-200'
                : 'bg-black/60 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1.5">
                  {undistractedMode ? (
                    <EyeOff className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-neutral-400" />
                  )}
                  Undistracted Play Mode (Zen Mode)
                </h4>
                <p className={`text-[10px] mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Collapses secondary panels, hides floating chirper preview, and minimizes toolbars so you can build and view your 3D city without visual clutter.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleUndistractedMode}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  undistractedMode ? 'bg-emerald-500' : isLight ? 'bg-neutral-300' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    undistractedMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className={`text-[10px] font-mono ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Keyboard shortcut: Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[9px] font-bold">U</kbd> anytime to toggle
              </span>
            </div>
          </div>

          {/* Section 3: 3D Graphics & Aesthetics */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Graphics & 3D Visual Detail
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Soft PCF Contact Shadows */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isLight
                    ? 'bg-neutral-50/90 border-neutral-200'
                    : 'bg-black/60 border-neutral-800'
                }`}
              >
                <div>
                  <span className="font-semibold block text-[11px]">Soft Contact Shadows</span>
                  <span className={`text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    PCF Soft shadow filter for realistic depth
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setContactShadows(!contactShadows)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    contactShadows ? 'bg-emerald-500' : isLight ? 'bg-neutral-300' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      contactShadows ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Day / Night Toggle */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isLight
                    ? 'bg-neutral-50/90 border-neutral-200'
                    : 'bg-black/60 border-neutral-800'
                }`}
              >
                <div>
                  <span className="font-semibold block text-[11px]">Time of Day</span>
                  <span className={`text-[9px] font-mono ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {Math.floor(dayTime)}:00 ({dayTime < 6 || dayTime > 18.5 ? 'Night' : 'Daylight'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleDayNight}
                  className={`p-2 rounded-lg font-medium transition-colors cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
                  }`}
                >
                  {dayTime < 6 || dayTime > 18.5 ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-400" />}
                </button>
              </div>
            </div>

            {/* Quality Preset */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight
                  ? 'bg-neutral-50/90 border-neutral-200'
                  : 'bg-black/60 border-neutral-800'
              }`}
            >
              <div>
                <span className="font-semibold block text-[11px]">Graphics Profile</span>
                <span className={`text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Ultra high-detail geometric meshes & zero-lag vehicle pooling
                </span>
              </div>
              <div className={`flex rounded-lg p-0.5 border ${isLight ? 'bg-neutral-200 border-neutral-300' : 'bg-neutral-900 border-neutral-800'}`}>
                {(['ultra', 'high', 'balanced', 'low'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setGraphicsQuality(q)}
                    className={`px-2 py-1 text-[10px] font-semibold capitalize rounded-md transition-all cursor-pointer ${
                      graphicsQuality === q
                        ? 'bg-emerald-500 text-black font-bold shadow-xs'
                        : isLight
                        ? 'text-neutral-600 hover:text-neutral-900'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: City Map Presets & Local Storage */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Map className="w-4 h-4 text-sky-500" />
              Scenario Maps & Game Save
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onSelectPreset('starter');
                  onClose();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="font-bold text-xs">Greenfield River</div>
                <div className={`text-[9px] mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Gentle curving delta with starter highway.
                </div>
                <div className="mt-1.5 text-[9px] font-mono text-emerald-500 font-semibold">Beginner</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPreset('busy');
                  onClose();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="font-bold text-xs">Bustling City</div>
                <div className={`text-[9px] mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Established downtown with skyscrapers and roads.
                </div>
                <div className="mt-1.5 text-[9px] font-mono text-sky-500 font-semibold">Active Traffic</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPreset('delta');
                  onClose();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="font-bold text-xs">Delta Bridge Bay</div>
                <div className={`text-[9px] mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Scenic channel bridge with water vistas.
                </div>
                <div className="mt-1.5 text-[9px] font-mono text-purple-500 font-semibold">Scenic Bay</div>
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onSaveGame}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save City</span>
                </button>

                <button
                  type="button"
                  onClick={onLoadGame}
                  disabled={!hasSavedGame}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer border ${
                    hasSavedGame
                      ? isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-700'
                      : 'opacity-40 cursor-not-allowed border-transparent'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Load City</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {onDownloadJson && (
                  <button
                    type="button"
                    onClick={onDownloadJson}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer border ${
                      isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-sky-500" />
                    <span>Download Save (.json)</span>
                  </button>
                )}

                {onReturnHome && (
                  <button
                    type="button"
                    onClick={onReturnHome}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer border ${
                      isLight
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                        : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                    }`}
                  >
                    <span>Main Menu / Home</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Audio */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight
                ? 'bg-neutral-50/90 border-neutral-200'
                : 'bg-black/60 border-neutral-800'
            }`}
          >
            <div>
              <span className="font-semibold block text-[11px]">Audio & Sound Effects</span>
              <span className={`text-[9px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Synthesized procedural city effects and milestone chimes
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-lg font-medium transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
