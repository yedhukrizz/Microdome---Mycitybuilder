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
  Boxes,
  Sparkles,
  Sword,
  Target,
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
  const isBuildingsActive =
    activeTool.category === 'buildings' ||
    (activeTool.category === 'services' && (activeTool.serviceType === 'stadium' || activeTool.serviceType === 'grand_park' || activeTool.serviceType === 'university')) ||
    (activeTool.category === 'utilities' && activeTool.serviceType === 'nuclear_plant');

  const getToolDisplayName = () => {
    if (activeTool.category === 'roads') {
      if (activeTool.roadType === 'avenue') return '3-Lane Avenue Boulevard ($50)';
      if (activeTool.roadType === 'highway') return 'Express Highway ($100)';
      return 'Two-Lane Local Road ($20)';
    }
    if (activeTool.category === 'zones') {
      if (activeTool.zoneType === 'residential') return 'Residential Zone (Home)';
      if (activeTool.zoneType === 'commercial') return 'Commercial Zone (Shop)';
      if (activeTool.zoneType === 'industrial') return 'Industrial Zone (Factory)';
      if (activeTool.zoneType === 'office') return 'Office Zone (Corporate)';
    }
    if (activeTool.category === 'buildings') {
      if (activeTool.buildingType === 'condo_complex_2x2') return '2x2 Condo Complex ($3,800)';
      if (activeTool.buildingType === 'mall_galleria_2x2') return '2x2 Mall Galleria ($4,500)';
      if (activeTool.buildingType === 'corporate_plaza_2x2') return '2x2 Corporate Plaza ($5,500)';
      if (activeTool.buildingType === 'logistics_hub_2x2') return '2x2 Logistics Hub ($3,200)';
      if (activeTool.buildingType === 'tech_megaplex_4x4') return '4x4 Tech Megaplex Landmark ($18,000)';
      return activeTool.buildingType.replace(/_/g, ' ').toUpperCase();
    }
    if (activeTool.category === 'utilities') {
      if (activeTool.serviceType === 'wind_turbine') return 'Wind Turbine ($6,000)';
      if (activeTool.serviceType === 'solar_farm') return 'Solar Farm ($14,000)';
      if (activeTool.serviceType === 'water_tower') return 'Water Tower ($4,500)';
    }
    if (activeTool.category === 'services') {
      if (activeTool.serviceType === 'stadium') return 'Sports Stadium 2x2 ($25,000)';
      if (activeTool.serviceType === 'grand_park') return 'Grand Park 2x2 ($20,000)';
      if (activeTool.serviceType === 'clinic') return 'Healthcare Clinic ($8,000)';
      if (activeTool.serviceType === 'hospital') return 'Metropolitan Hospital ($28,000)';
      if (activeTool.serviceType === 'elementary_school') return 'Elementary School ($12,000)';
      if (activeTool.serviceType === 'university') return 'University Campus ($45,000)';
      if (activeTool.serviceType === 'fire_station') return 'Fire Department ($10,000)';
      if (activeTool.serviceType === 'police_station') return 'Police Precinct ($11,000)';
      if (activeTool.serviceType === 'army_barracks') return 'Army Barracks ($15,000)';
      if (activeTool.serviceType === 'defense_tower') return 'Defense Turret ($12,000)';
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
          className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-xl backdrop-blur-xl cursor-pointer transition-all hover:scale-105 ${
            isLight
              ? 'bg-white/95 text-neutral-900 border-neutral-300 shadow-neutral-300/50'
              : 'bg-neutral-900/95 text-white border-neutral-700 shadow-black/80'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-xs tracking-wide">{getToolDisplayName()}</span>
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 sm:bottom-3 md:bottom-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 pointer-events-none select-none">
      <div className="pointer-events-auto flex flex-col-reverse items-center gap-1.5 sm:gap-2 max-w-[99vw] sm:max-w-max w-full">
        {/* Main Glassmorphic Dock with Small Rounded Rectangle Elements */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-xl border shadow-2xl backdrop-blur-2xl transition-all overflow-x-auto max-w-full scrollbar-none text-xs ${
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
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isBuildMode
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
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
          <div className="flex items-center gap-1 shrink-0">
            {/* Inspect */}
            <button
              type="button"
              onClick={() => {
                setActiveTool({ category: 'inspect' });
                soundEngine.playSelect();
              }}
              title="Inspect Tile Details (I)"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'inspect'
                  ? isLight
                    ? 'bg-neutral-200 text-neutral-900 shadow-sm ring-1 ring-neutral-400/50'
                    : 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-600/50'
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'roads'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'zones'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Zones</span>
            </button>

            {/* Mega 2x2 & 4x4 Elements */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'buildings', buildingType: 'condo_complex_2x2', zone: 'residential', level: 3, size: 2 })}
              title="Mega Complexes & Landmarks (2x2 and 4x4 Multi-Tile Architectures)"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isBuildingsActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
              <span className="hidden sm:inline">2x2 & 4x4</span>
            </button>

            {/* Civic & Utilities */}
            <button
              type="button"
              onClick={() => selectTool({ category: 'services', serviceType: 'clinic' })}
              title="Civic & Municipal Utilities (Clinics, Schools, Power, Water, Parks, Parking)"
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isCivicOrUtilityActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTool.category === 'bulldoze'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400/40'
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

          {/* Footprint Size Selector [1x1] [2x2] [4x4] */}
          {isBuildMode && (
            <div className="flex items-center gap-1 shrink-0 px-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider hidden lg:inline">Size:</span>
              {[1, 2, 4].map((sz) => {
                const currentSz = activeTool.size || (activeTool.category === 'buildings' ? (activeTool.buildingType === 'tech_megaplex_4x4' ? 4 : activeTool.buildingType.includes('2x2') ? 2 : 1) : 1);
                const isSelected = currentSz === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setActiveTool({ ...activeTool, size: sz as 1 | 2 | 4 });
                      soundEngine.playSelect();
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-300 scale-105'
                        : isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                    title={`Set footprint to ${sz}x${sz}`}
                  >
                    {sz}x{sz}
                  </button>
                );
              })}
            </div>
          )}

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
              className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border shadow-sm shrink-0 ${
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/40 animate-pulse transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Place</span>
            </button>
          )}

          {/* Collapse button in Zen mode */}
          {undistractedMode && (
            <button
              type="button"
              onClick={() => setIsDockCollapsed(true)}
              title="Minimize Toolbar (Zen View)"
              className={`p-1.5 rounded-md transition-colors cursor-pointer shrink-0 ${
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
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
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
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'two_lane')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local ($20)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'avenue' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'avenue')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-sky-400" />
                <span>Avenue ($50)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'highway' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'highway')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-amber-400" />
                <span>Highway ($100)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'mud' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'mud')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>Mud ($10)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'rural' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'rural')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>Rural ($15)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'pavement' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'pavement')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>Pavement ($30)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'pedestrian' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'pedestrian')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>Pedestrian ($25)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'roads', roadType: 'toll_booth' })}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isToolActive('roads', 'toll_booth')
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>🪙 Toll ($150)</span>
              </button>
            </div>

            <div className={`h-4 w-px mx-1 shrink-0 ${isLight ? 'bg-neutral-300' : 'bg-neutral-800'}`} />

            {onToggleRoadCorridorMode && (
              <button
                type="button"
                onClick={onToggleRoadCorridorMode}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs shrink-0 ${
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
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
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
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
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

        {/* Sub-Ribbon: Mega Complexes & Multi-Tile Elements (2x2 and 4x4) */}
        {isBuildMode && isBuildingsActive && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
              isLight
                ? 'bg-white/95 border-neutral-200 text-neutral-800 shadow-neutral-200/50'
                : 'bg-neutral-950/95 border-neutral-800 text-white shadow-black/80'
            }`}
          >
            <span className="font-bold flex items-center gap-1 text-indigo-500 px-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2x2 & 4x4:</span>
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => selectTool({ category: 'buildings', buildingType: 'condo_complex_2x2', zone: 'residential', level: 3, size: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'buildings' && activeTool.buildingType === 'condo_complex_2x2'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Home className="w-3 h-3 text-emerald-400" />
                <span>2x2 Condos ($3.8k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'buildings', buildingType: 'mall_galleria_2x2', zone: 'commercial', level: 3, size: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'buildings' && activeTool.buildingType === 'mall_galleria_2x2'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <ShoppingBag className="w-3 h-3 text-sky-400" />
                <span>2x2 Mall ($4.5k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'buildings', buildingType: 'corporate_plaza_2x2', zone: 'office', level: 3, size: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'buildings' && activeTool.buildingType === 'corporate_plaza_2x2'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Briefcase className="w-3 h-3 text-blue-400" />
                <span>2x2 Corporate ($5.5k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'buildings', buildingType: 'logistics_hub_2x2', zone: 'industrial', level: 3, size: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'buildings' && activeTool.buildingType === 'logistics_hub_2x2'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Factory className="w-3 h-3 text-amber-400" />
                <span>2x2 Logistics ($3.2k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'stadium', size: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'services' && activeTool.serviceType === 'stadium'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-1 ring-teal-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Building2 className="w-3 h-3 text-teal-400" />
                <span>2x2 Stadium ($25k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'grand_park', size: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'services' && activeTool.serviceType === 'grand_park'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trees className="w-3 h-3 text-emerald-400" />
                <span>2x2 Grand Park ($20k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'buildings', buildingType: 'tech_megaplex_4x4', zone: 'office', level: 5, size: 4 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'buildings' && activeTool.buildingType === 'tech_megaplex_4x4'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>🌟 4x4 Megaplex ($18k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'university', size: 4 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'services' && activeTool.serviceType === 'university'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-indigo-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <GraduationCap className="w-3 h-3 text-indigo-400" />
                <span>🎓 4x4 University ($45k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'nuclear_plant', size: 4 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  activeTool.category === 'utilities' && activeTool.serviceType === 'nuclear_plant'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Zap className="w-3 h-3 text-yellow-300" />
                <span>⚡ 4x4 Nuclear Plant ($65k)</span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-Ribbon: Civic & Utilities */}
        {isBuildMode && isCivicOrUtilityActive && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xl text-xs backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 overflow-x-auto max-w-full scrollbar-none ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                onClick={() => selectTool({ category: 'services', serviceType: 'army_barracks' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'army_barracks')
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Sword className="w-3.5 h-3.5 text-emerald-400" />
                <span>Barracks ($15k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'defense_tower' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'defense_tower')
                    ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30 ring-2 ring-rose-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-rose-400" />
                <span>Turret ($12k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'wind_turbine' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'small_park')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Small Park ($3k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'medium_park' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'medium_park')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Medium Park ($6k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'large_park' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'large_park')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Large Park ($10k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'grand_park' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'grand_park')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Grand Park ($20k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'parking_lot' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
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

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'bus_station' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'bus_station')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-sky-400" />
                <span>Bus Station ($5k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'nuclear_plant' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'nuclear_plant')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nuclear ($80k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'geothermal_plant' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'geothermal_plant')
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Geothermal ($45k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'fusion_reactor' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'fusion_reactor')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Fusion ($250k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'utilities', serviceType: 'desalination_plant' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('utilities', 'desalination_plant')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Desalination ($35k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'recycling_center' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'recycling_center')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recycling ($15k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'incinerator' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'incinerator')
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Incinerator ($22k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'subway_station' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'subway_station')
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subway ($30k)</span>
              </button>

              <button
                type="button"
                onClick={() => selectTool({ category: 'services', serviceType: 'tram_depot' })}
                className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                  isToolActive('services', 'tram_depot')
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-2 ring-violet-300 scale-105'
                    : isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-violet-400" />
                <span>Tram ($20k)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
