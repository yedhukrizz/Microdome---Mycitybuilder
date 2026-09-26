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

  const getToolDisplayName = () => {
    if (activeTool.category === 'roads') {
      if (activeTool.roadType === 'avenue') return 'Avenue Boulevard ($50)';
      if (activeTool.roadType === 'highway') return 'Express Highway ($100)';
      return 'Two-Lane Local Road ($20)';
    }
    if (activeTool.category === 'zones') {
      if (activeTool.zoneType === 'residential') return 'Residential Zone';
      if (activeTool.zoneType === 'commercial') return 'Commercial Zone';
      if (activeTool.zoneType === 'industrial') return 'Industrial Zone';
      if (activeTool.zoneType === 'office') return 'Office Zone';
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
    }
    if (activeTool.category === 'bulldoze') return 'Demolish Tool';
    return 'Inspect / Pan Tool';
  };

  // If player enabled undistracted mode and docked, show minimal peek pill
  if (undistractedMode && isDockCollapsed) {
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => setIsDockCollapsed(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 ${
            isLight
              ? 'bg-white/95 text-neutral-900 border-neutral-300'
              : 'bg-black/92 text-white border-neutral-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-xs">{getToolDisplayName()}</span>
          <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 select-none max-w-[98vw]">
      {/* Sub-Ribbon: Roads / Corridor Builder */}
      {isBuildMode && isRoadsActive && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shadow-xl text-[10px] backdrop-blur-md animate-in fade-in duration-150 ${
            isLight
              ? 'bg-white/95 border-neutral-200 text-neutral-800'
              : 'bg-black/95 border-neutral-800 text-white'
          }`}
        >
          <span className="font-bold flex items-center gap-1 shrink-0 text-emerald-500">
            <Route className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Road Type:</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => selectTool({ category: 'roads', roadType: 'two_lane' })}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('roads', 'two_lane')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              Local Road ($20)
            </button>

            <button
              type="button"
              onClick={() => selectTool({ category: 'roads', roadType: 'avenue' })}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('roads', 'avenue')
                  ? 'bg-emerald-600 text-white shadow-xs'
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
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('roads', 'highway')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              Highway ($100)
            </button>
          </div>

          <div className={`h-3 w-px mx-0.5 ${isLight ? 'bg-neutral-300' : 'bg-neutral-800'}`} />

          {/* Corridor Mode Toggle */}
          {onToggleRoadCorridorMode && (
            <button
              type="button"
              onClick={onToggleRoadCorridorMode}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                roadCorridorMode
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <span>{roadCorridorMode ? '📐 Route Mode' : '✏️ Paint'}</span>
            </button>
          )}

          {roadCorridorStart && (
            <div className="flex items-center gap-1 text-[9px] text-amber-500 font-mono">
              <span>Start [{roadCorridorStart.x},{roadCorridorStart.z}]</span>
              {onCancelCorridor && (
                <button
                  type="button"
                  onClick={onCancelCorridor}
                  className="px-1 text-rose-500 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sub-Ribbon: Civic & Utilities Buildings */}
      {isBuildMode && isCivicOrUtilityActive && (
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-xl border shadow-xl text-[10px] backdrop-blur-md animate-in fade-in duration-150 overflow-x-auto max-w-[96vw] scrollbar-none ${
            isLight
              ? 'bg-white/95 border-neutral-200 text-neutral-800'
              : 'bg-black/95 border-neutral-800 text-white'
          }`}
        >
          <span className="font-bold flex items-center gap-1 shrink-0 px-1 text-emerald-500">
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Civic:</span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {/* Clinic */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'clinic' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'clinic')
                  ? 'bg-rose-600 text-white font-bold ring-1 ring-rose-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <HeartPulse className="w-3 h-3 text-rose-400" />
              <span>Clinic ($8k)</span>
            </button>

            {/* Hospital */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'hospital' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'hospital')
                  ? 'bg-rose-600 text-white font-bold ring-1 ring-rose-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Hospital className="w-3 h-3 text-rose-300" />
              <span>Hospital ($28k)</span>
            </button>

            {/* School */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'elementary_school' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'elementary_school')
                  ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <School className="w-3 h-3 text-amber-400" />
              <span>School ($12k)</span>
            </button>

            {/* University */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'university' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'university')
                  ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <GraduationCap className="w-3 h-3 text-amber-300" />
              <span>University ($45k)</span>
            </button>

            {/* Fire */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'fire_station' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'fire_station')
                  ? 'bg-orange-600 text-white font-bold ring-1 ring-orange-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Fire ($10k)</span>
            </button>

            {/* Police */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'police_station' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'police_station')
                  ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span>Police ($11k)</span>
            </button>

            {/* Wind */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'utilities', serviceType: 'wind_turbine' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('utilities', 'wind_turbine')
                  ? 'bg-yellow-600 text-white font-bold ring-1 ring-yellow-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>Wind ($6k)</span>
            </button>

            {/* Solar */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'utilities', serviceType: 'solar_farm' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('utilities', 'solar_farm')
                  ? 'bg-yellow-600 text-white font-bold ring-1 ring-yellow-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Sun className="w-3 h-3 text-yellow-300" />
              <span>Solar ($14k)</span>
            </button>

            {/* Water Tower */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'utilities', serviceType: 'water_tower' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('utilities', 'water_tower')
                  ? 'bg-sky-600 text-white font-bold ring-1 ring-sky-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Droplets className="w-3 h-3 text-sky-400" />
              <span>Water ($4.5k)</span>
            </button>

            {/* Park */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'small_park' })}
              className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isToolActive('services', 'small_park')
                  ? 'bg-emerald-600 text-white font-bold ring-1 ring-emerald-300'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Trees className="w-3 h-3 text-emerald-400" />
              <span>Park ($3k)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Unified Dock: Minimalist, Crisp, Undistracted */}
      <div
        className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
          isLight
            ? 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xl'
            : 'bg-black/92 border-neutral-800/80 text-white'
        }`}
      >
        {/* Build / Pan Mode Toggle */}
        <button
          type="button"
          onClick={onToggleBuildMode}
          title={isBuildMode ? 'Switch to Pan Mode (Move camera without building)' : 'Switch to Build Mode'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            isBuildMode
              ? 'bg-emerald-600 text-white shadow-sm'
              : isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-250'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800'
          }`}
        >
          {isBuildMode ? <Hammer className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
          <span className="hidden xs:inline">{isBuildMode ? 'Build' : 'Pan'}</span>
        </button>

        <div className={`h-5 w-px ${isLight ? 'bg-neutral-250' : 'bg-neutral-800'}`} />

        {/* Primary Tool Categories */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Inspect */}
          <button
            type="button"
            onClick={() => {
              setActiveTool({ category: 'inspect' });
              soundEngine.playSelect();
            }}
            title="Inspect Tile Details (I)"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
              activeTool.category === 'inspect'
                ? isLight
                  ? 'bg-neutral-200 text-neutral-900 font-bold'
                  : 'bg-neutral-800 text-white font-bold'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Inspect</span>
          </button>

          {/* Roads */}
          <button
            type="button"
            onClick={() => selectTool({ category: 'roads', roadType: 'two_lane' })}
            title="Roads & Corridors (R)"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
              activeTool.category === 'roads'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Roads</span>
          </button>

          {/* Zones */}
          <div className="flex items-center gap-0.5">
            {/* Residential */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'zones', zoneType: 'residential' })}
              title="Residential Zone (Homes)"
              className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                isToolActive('zones', 'residential')
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Home</span>
            </button>

            {/* Commercial */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'zones', zoneType: 'commercial' })}
              title="Commercial Zone (Shops & Dining)"
              className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                isToolActive('zones', 'commercial')
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Shop</span>
            </button>

            {/* Industrial */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'zones', zoneType: 'industrial' })}
              title="Industrial Zone (Manufacturing)"
              className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                isToolActive('zones', 'industrial')
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Factory className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Industry</span>
            </button>

            {/* Office */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'zones', zoneType: 'office' })}
              title="Office Zone (High-tech & Finance)"
              className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                isToolActive('zones', 'office')
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Office</span>
            </button>
          </div>

          {/* Civic & Utilities Tab */}
          <button
            type="button"
            onClick={() => selectTool({ category: 'services', serviceType: 'clinic' })}
            title="Civic & Municipal Utilities (Clinics, Schools, Power, Water)"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
              isCivicOrUtilityActive
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Civic & Power</span>
          </button>

          {/* Bulldoze */}
          <button
            type="button"
            onClick={() => selectTool({ category: 'bulldoze' })}
            title="Demolish Building or Road (B)"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
              activeTool.category === 'bulldoze'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : isLight
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-rose-400 hover:bg-neutral-900'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Demolish</span>
          </button>
        </div>

        <div className={`h-5 w-px ${isLight ? 'bg-neutral-250' : 'bg-neutral-800'}`} />

        {/* Compact Placement Mode Toggle (Safe Mode vs Rapid) */}
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
                ? 'Safe Mode: Tap tile to select, then check box. Click to switch to Rapid.'
                : 'Rapid Place: Instant placement on click. Click to switch to Safe.'
            }
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
              placementMode === 'confirm'
                ? isLight
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'bg-sky-950/60 text-sky-400 border-sky-500/40'
                : 'bg-amber-500 text-black font-bold border-amber-400'
            }`}
          >
            <span>{placementMode === 'confirm' ? '✓ Safe' : '⚡ Rapid'}</span>
          </button>
        )}

        {/* Selected Tile Confirm Checkbox Button (In Safe Confirm Mode) */}
        {isBuildMode && placementMode === 'confirm' && selectedCoord && onBuildOnSelected && (
          <button
            type="button"
            onClick={onBuildOnSelected}
            title={`Confirm and place ${getToolDisplayName()} at [${selectedCoord.x}, ${selectedCoord.z}]`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-lg animate-pulse transition-all cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Place</span>
          </button>
        )}

        {/* Collapse button in Undistracted Mode */}
        {undistractedMode && (
          <button
            type="button"
            onClick={() => setIsDockCollapsed(true)}
            title="Minimize Toolbar (Zen View)"
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-500 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
