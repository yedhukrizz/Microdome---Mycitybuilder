import React, { useState } from 'react';
import {
  Search,
  Route,
  Zap,
  Trash2,
  Droplets,
  Home,
  ShoppingBag,
  Factory,
  Briefcase,
  Trees,
  Hammer,
  Hand,
  CheckCircle2,
  Building2,
  HeartPulse,
  Hospital,
  GraduationCap,
  School,
  Shield,
  Flame,
  Sun,
  ChevronUp,
  ChevronDown,
  Car,
} from 'lucide-react';
import { ActiveTool, OverlayMode } from '../types/city';
import { soundEngine } from '../audio/soundEngine';
import { useTheme } from '../context/ThemeContext';

interface BottomToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  overlayMode: OverlayMode;
  setOverlayMode: (mode: OverlayMode) => void;
  isBuildMode: boolean;
  setIsBuildMode: (val: boolean) => void;
  onToggleBuildMode: () => void;
  selectedCoord: { x: number; z: number } | null;
  onBuildOnSelected?: () => void;
  placementMode: 'confirm' | 'rapid';
  setPlacementMode: (mode: 'confirm' | 'rapid') => void;
  roadCorridorMode?: boolean;
  onToggleRoadCorridorMode?: () => void;
  roadCorridorStart?: { x: number; z: number } | null;
  onCancelCorridor?: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activeTool,
  setActiveTool,
  isBuildMode,
  setIsBuildMode,
  onToggleBuildMode,
  selectedCoord,
  onBuildOnSelected,
  placementMode,
  setPlacementMode,
  roadCorridorMode = false,
  onToggleRoadCorridorMode,
  roadCorridorStart = null,
  onCancelCorridor,
}) => {
  const { theme, undistractedMode } = useTheme();
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const isLight = theme === 'light';

  const selectTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    setIsBuildMode(true);
    soundEngine.playSelect();
  };

  const isToolActive = (category: string, typeVal?: string) => {
    if (activeTool.category !== category) return false;
    if (category === 'roads' && 'roadType' in activeTool) return activeTool.roadType === typeVal;
    if (category === 'zones' && 'zoneType' in activeTool) return activeTool.zoneType === typeVal;
    if (category === 'utilities' && 'serviceType' in activeTool) return activeTool.serviceType === typeVal;
    if (category === 'services' && 'serviceType' in activeTool) return activeTool.serviceType === typeVal;
    return true;
  };

  const isCivicOrUtilityActive = activeTool.category === 'services' || activeTool.category === 'utilities';
  const isRoadsActive = activeTool.category === 'roads';
  const isZonesActive = activeTool.category === 'zones';

  const getToolDisplayName = () => {
    if (activeTool.category === 'roads') {
      if (activeTool.roadType === 'avenue') return 'Avenue Boulevard ($50)';
      if (activeTool.roadType === 'highway') return 'Express Highway ($100)';
      return 'Two-Lane Local Road ($20)';
    }
    if (activeTool.category === 'zones') {
      if (activeTool.zoneType === 'residential') return 'Residential Zone (Home)';
      if (activeTool.zoneType === 'commercial') return 'Commercial Zone (Shop)';
      if (activeTool.zoneType === 'industrial') return 'Industrial Zone (Factory)';
      if (activeTool.zoneType === 'office') return 'Office Zone (Corporate)';
    }
    if (activeTool.category === 'utilities') {
      if (activeTool.serviceType === 'wind_turbine') return 'Wind Turbine ($6,000)';
      if (activeTool.serviceType === 'solar_farm') return 'Solar Farm ($14,000)';
      if (activeTool.serviceType === 'water_tower') return 'Water Tower ($4,500)';
    }
    if (activeTool.category === 'services') {
      if (activeTool.serviceType === 'clinic') return 'Healthcare Clinic ($8,000)';
      if (activeTool.serviceType === 'hospital') return 'Metropolitan Hospital ($28,000)';
      if (activeTool.serviceType === 'elementary_school') return 'Elementary School ($12,000)';
      if (activeTool.serviceType === 'university') return 'University Campus ($45,000)';
      if (activeTool.serviceType === 'fire_station') return 'Fire Department ($10,000)';
      if (activeTool.serviceType === 'police_station') return 'Police Precinct ($11,000)';
      if (activeTool.serviceType === 'small_park') return 'Neighborhood Park ($3,000)';
      if (activeTool.serviceType === 'parking_lot') return 'Park & Ride Lot ($1,500)';
    }
    if (activeTool.category === 'bulldoze') return 'Demolish Tool';
    return 'Inspect / Pan Tool';
  };

  if (undistractedMode && isDockCollapsed) {
    return (
      <div className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none select-none animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => setIsDockCollapsed(false)}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-xl cursor-pointer transition-all hover:scale-105 ${
            isLight
              ? 'bg-white/95 text-neutral-900 border-neutral-300 shadow-neutral-300/50'
              : 'bg-neutral-900/95 text-white border-neutral-700 shadow-black/80'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-xs tracking-wide">{getToolDisplayName()}</span>
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 sm:bottom-3 md:bottom-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 pointer-events-none select-none">
      <div className="pointer-events-auto flex flex-col-reverse items-center gap-1.5 sm:gap-2 max-w-[99vw] sm:max-w-max w-full">
        {/* Main Glassmorphic Dock */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all overflow-x-auto max-w-full scrollbar-none text-xs ${
            isLight
              ? 'bg-white/95 border-neutral-200/90 text-neutral-900 shadow-neutral-300/60'
              : 'bg-neutral-950/92 border-neutral-800/80 text-white shadow-black/90'
          }`}
        >
          {/* Build / Pan Mode Toggle */}
          <button
            type="button"
            onClick={onToggleBuildMode}
            title={isBuildMode ? 'Switch to Pan Mode' : 'Switch to Build Mode'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isBuildMode
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800'
            }`}
          >
            {isBuildMode ? <Hammer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="hidden xs:inline">{isBuildMode ? 'Build' : 'Pan'}</span>
          </button>

          <div className={`h-5 sm:h-6 w-px shrink-0 ${isLight ? 'bg-neutral-300' : 'bg-neutral-800'}`} />

          {/* Primary Tool Categories */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Inspect */}
            <button
              type="button"
              onClick={() => {
                setActiveTool({ category: 'inspect' });
                soundEngine.playSelect();
              }}
              title="Inspect Tile Details (I)"
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'inspect'
                  ? isLight
                    ? 'bg-neutral-250 text-neutral-900 shadow-md ring-2 ring-neutral-400/50'
                    : 'bg-neutral-800 text-white shadow-md ring-2 ring-neutral-600/50'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Inspect</span>
            </button>

            {/* Roads */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'roads', roadType: 'two_lane' })}
              title="Roads & Corridors (R)"
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'roads'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Roads</span>
            </button>

            {/* Zones */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'zones', zoneType: 'residential' })}
              title="Zoning (Residential, Commercial, Industrial, Office)"
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'zones'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Zones</span>
            </button>

            {/* Civic & Utilities */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'clinic' })}
              title="Civic & Municipal Utilities (Clinics, Schools, Power, Water, Parks, Parking)"
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isCivicOrUtilityActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Civic & Power</span>
            </button>

            {/* Bulldoze */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'bulldoze' })}
              title="Demolish Building or Road (B)"
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'bulldoze'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/40'
                  : isLight
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-rose-400 hover:bg-neutral-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Demolish</span>
            </button>
          </div>

          <div className={`h-5 sm:h-6 w-px shrink-0 ${isLight ? 'bg-neutral-300' : 'bg-neutral-800'}`} />

          {/* Placement Mode Toggle */}
          {isBuildMode && (
            <button
              type="button"
              onClick={() => {
                const next = placementMode === 'confirm' ? 'rapid' : 'confirm';
                setPlacementMode(next);
                soundEngine.playSelect();
              }}
              title={
                placementMode === 'confirm'
                  ? 'Safe Mode: Tap tile to preview & confirm. Click to switch to Rapid.'
                  : 'Rapid Mode: Instant placement on click. Click to switch to Safe.'
              }
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border shadow-sm shrink-0 ${
                placementMode === 'confirm'
                  ? isLight
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-sky-950/60 text-sky-400 border-sky-500/40'
                  : 'bg-amber-500 text-black font-extrabold border-amber-400 shadow-amber-500/30'
              }`}
            >
              <span>{placementMode === 'confirm' ? '✓ Safe' : '⚡ Rapid'}</span>
            </button>
          )}

          {/* Selected Tile Confirm Button */}
          {isBuildMode && placementMode === 'confirm' && selectedCoord && onBuildOnSelected && (
            <button
              type="button"
              onClick={onBuildOnSelected}
              title={`Confirm and place at [${selectedCoord.x}, ${selectedCoord.z}]`}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/40 animate-pulse transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Place</span>
            </button>
          )}

          {/* Collapse button in Zen mode */}
          {undistractedMode && (
            <button
              type="button"
              onClick={() => setIsDockCollapsed(true)}
              title="Minimize Toolbar (Zen View)"
              className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub-Ribbon: Roads & Corridors */}
        {isBuildMode && isRoadsActive && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-2xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
              isLight
                ? 'bg-white/95 border-neutral-200 text-neutral-800 shadow-neutral-200/50'
                : 'bg-neutral-950/95 border-neutral-800 text-white shadow-black/80'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5 text-emerald-500 px-1 shrink-0">
              <Route className="w-4 h-4" />
              <span className="hidden sm:inline">Network:</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'two_lane' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('roads', 'two_lane')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                Local ($20)
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'avenue' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('roads', 'avenue')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                Avenue ($50)
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'highway' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('roads', 'highway')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                Highway ($100)
              </button>
            </div>

            <div className={`h-4 w-px mx-1 shrink-0 ${isLight ? 'bg-neutral-300' : 'bg-neutral-800'}`} />

            {onToggleRoadCorridorMode && (
              <button
                type="button"
                onClick={onToggleRoadCorridorMode}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs shrink-0 ${
                  roadCorridorMode
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>{roadCorridorMode ? '📐 Route Mode' : '✏️ Paint Mode'}</span>
              </button>
            )}

            {roadCorridorStart && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono pl-1 shrink-0">
                <span>Start [{roadCorridorStart.x},{roadCorridorStart.z}]</span>
                {onCancelCorridor && (
                  <button
                    type="button"
                    onClick={onCancelCorridor}
                    className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sub-Ribbon: Zones */}
        {isBuildMode && isZonesActive && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-2xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
              isLight
                ? 'bg-white/95 border-neutral-200 text-neutral-800 shadow-neutral-200/50'
                : 'bg-neutral-950/95 border-neutral-800 text-white shadow-black/80'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5 text-emerald-500 px-1 shrink-0">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Zoning:</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => selectTool({ category: 'zones', zoneType: 'residential' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  isToolActive('zones', 'residential')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span>Residential</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'zones', zoneType: 'commercial' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  isToolActive('zones', 'commercial')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                <span>Commercial</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'zones', zoneType: 'industrial' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  isToolActive('zones', 'industrial')
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Factory className="w-3.5 h-3.5 text-amber-400" />
                <span>Industrial</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'zones', zoneType: 'office' })}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  isToolActive('zones', 'office')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Office</span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-Ribbon: Civic & Utilities */}
        {isBuildMode && isCivicOrUtilityActive && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border shadow-2xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
              isLight
                ? 'bg-white/95 border-neutral-200 text-neutral-800 shadow-neutral-200/50'
                : 'bg-neutral-950/95 border-neutral-800 text-white shadow-black/80'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5 shrink-0 px-1 text-emerald-500">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Civic & Power:</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'clinic' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'clinic')
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                <span>Clinic ($8k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'hospital' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'hospital')
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Hospital className="w-3.5 h-3.5 text-rose-300" />
                <span>Hospital ($28k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'elementary_school' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'elementary_school')
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <School className="w-3.5 h-3.5 text-amber-400" />
                <span>School ($12k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'university' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'university')
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>University ($45k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'fire_station' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'fire_station')
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-2 ring-orange-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Fire ($10k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'police_station' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'police_station')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Police ($11k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'wind_turbine' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'wind_turbine')
                    ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/30 ring-2 ring-yellow-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Wind ($6k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'solar_farm' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'solar_farm')
                    ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/30 ring-2 ring-yellow-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-yellow-300" />
                <span>Solar ($14k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'water_tower' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'water_tower')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Water ($4.5k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'small_park' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'small_park')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Park ($3k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'parking_lot' })}
                className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'parking_lot')
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-indigo-400" />
                <span>Parking ($1.5k)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
