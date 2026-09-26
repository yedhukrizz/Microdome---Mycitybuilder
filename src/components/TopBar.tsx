import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  Sun,
  Moon,
  RotateCcw,
  Menu,
  X,
  Building2,
  TrendingUp,
  Award,
  BarChart3,
  Sliders,
  Users,
  Smile,
  DollarSign,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CityBudget, CityStats } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  stats: CityStats;
  budget: CityBudget;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  onSpeedChange: (speed: number) => void;
  onResetCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleDayNight: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  stats,
  budget,
  activeModal,
  setActiveModal,
  onSpeedChange,
  onResetCamera,
  isMuted,
  onToggleMute,
  onToggleDayNight,
}) => {
  const { theme, toggleTheme, undistractedMode, toggleUndistractedMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isNight = stats.dayTime < 6 || stats.dayTime > 18.5;
  const netWeekly = budget.incomePerWeek - budget.expensesPerWeek;

  const isPowerDeficit = stats.powerConsumption > stats.powerProduction;
  const isWaterDeficit = stats.waterConsumption > stats.waterProduction;
  const hasGridAlert = isPowerDeficit || isWaterDeficit || stats.abandonedBuildings > 0;

  const isLight = theme === 'light';

  // Close mobile menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Building2, desc: 'Utilities & Needs' },
    { id: 'economy', label: 'Economy', icon: TrendingUp, desc: 'Budget & Taxes' },
    { id: 'milestones', label: 'Goals', icon: Award, desc: 'Milestones' },
    { id: 'graphs', label: 'Graphs', icon: BarChart3, desc: 'City Analytics' },
    { id: 'settings', label: 'Settings', icon: Sliders, desc: 'Theme, Graphics & Maps' },
  ];

  const handleSelectNav = (id: string) => {
    setActiveModal(activeModal === id ? null : id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`absolute top-0 left-0 right-0 z-40 text-xs select-none max-w-full transition-colors border-b backdrop-blur-md ${
        isLight
          ? 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xs'
          : 'bg-black/92 border-neutral-800/80 text-white'
      }`}
    >
      <div className="flex items-center justify-between px-2 sm:px-3 py-1 gap-1.5 sm:gap-2 max-w-full overflow-hidden">
        {/* Zone 1: Wordmark, Calendar & Main Navigation Grouped Next to Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 font-bold tracking-tight">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span
              className={`text-xs sm:text-sm font-extrabold tracking-tight ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}
            >
              Skyline
            </span>
          </div>

          <div
            className={`hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono tabular-nums ${
              isLight
                ? 'bg-neutral-100 border-neutral-250 text-neutral-600'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            <span>W{stats.week}</span>
            <span className={isLight ? 'text-neutral-350' : 'text-neutral-600'}>·</span>
            <span>'{stats.year % 100}</span>
          </div>

          <div className={`h-4 w-px hidden sm:block mx-0.5 ${isLight ? 'bg-neutral-200' : 'bg-neutral-800'}`} />

          {/* Main Navigation - Docked Cleanly Adjacent to Title */}
          <nav className="hidden lg:flex items-center gap-1 font-medium">
            {navItems.map((item) => {
              const isActive = activeModal === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer font-medium ${
                    isActive
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold shadow-xs'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold shadow-xs'
                      : isLight
                      ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  <span>{item.label}</span>
                  {item.id === 'overview' && hasGridAlert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile / Tablet Menu Button - Grouped Next to Title */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                mobileMenuOpen || activeModal
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : isLight
                  ? 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                  : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:bg-neutral-850'
              }`}
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Menu</span>
              {activeModal && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Zone 3: Financial & City Vital Metrics + Undistracted & Theme Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
          {/* Treasury Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md border shrink-0 ${
              isLight
                ? 'bg-neutral-100 border-neutral-250 text-neutral-900'
                : 'bg-neutral-900 border-neutral-800 text-white'
            }`}
          >
            <DollarSign className="w-3 h-3 text-emerald-500 hidden xs:inline" />
            <span
              className={`font-mono font-bold text-[11px] tabular-nums ${
                budget.treasury < 5000 ? 'text-rose-500' : isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              ${budget.treasury.toLocaleString()}
            </span>
            <span
              className={`text-[9px] font-mono tabular-nums hidden sm:inline ${
                netWeekly >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'
              }`}
            >
              ({netWeekly >= 0 ? '+' : ''}${netWeekly}/w)
            </span>
          </div>

          {/* Population & Happiness (Clickable for Analytics) */}
          <button
            type="button"
            onClick={() => handleSelectNav('graphs')}
            title="Open Population & Analytics Graphs"
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] transition-all cursor-pointer shrink-0 ${
              isLight
                ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-250 text-neutral-700 hover:text-neutral-900'
                : 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-500" />
              <span className={`font-mono font-semibold tabular-nums ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                {stats.population.toLocaleString()}
              </span>
            </div>
            <span className={isLight ? 'text-neutral-300' : 'text-neutral-700'}>|</span>
            <div className="flex items-center gap-1">
              <Smile className="w-3 h-3 text-amber-500" />
              <span className="font-mono font-semibold tabular-nums text-emerald-500">
                {stats.cityHappiness}%
              </span>
            </div>
          </button>

          {/* Traffic Congestion Progress Bar */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] shrink-0 ${
              isLight ? 'bg-neutral-100 border-neutral-250' : 'bg-neutral-900 border-neutral-800'
            }`}
            title={`Traffic Congestion Rate: ${stats.trafficCongestionRate}%`}
          >
            <span className="font-semibold text-neutral-400">Traffic:</span>
            <div className="w-16 h-2 bg-neutral-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  stats.trafficCongestionRate > 70
                    ? 'bg-rose-500'
                    : stats.trafficCongestionRate > 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${stats.trafficCongestionRate}%` }}
              />
            </div>
            <span className="font-mono tabular-nums font-semibold">{stats.trafficCongestionRate}%</span>
          </div>

          {/* Simulation Speed Control */}
          <div
            className={`flex items-center border rounded-md p-0.5 shrink-0 ${
              isLight ? 'bg-neutral-100 border-neutral-250' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => onSpeedChange(stats.simulationSpeed === 0 ? 1 : 0)}
              title={stats.simulationSpeed === 0 ? 'Resume simulation' : 'Pause simulation'}
              className={`p-1 rounded cursor-pointer transition-all ${
                stats.simulationSpeed === 0
                  ? 'bg-amber-500 text-black font-bold'
                  : isLight
                  ? 'text-neutral-500 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {stats.simulationSpeed === 0 ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => onSpeedChange(1)}
              title="Normal speed (1x)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
                stats.simulationSpeed === 1
                  ? isLight
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'bg-neutral-800 text-white font-bold'
                  : isLight
                  ? 'text-neutral-500 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              type="button"
              onClick={() => onSpeedChange(2)}
              title="Fast speed (2x)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
                stats.simulationSpeed === 2
                  ? isLight
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'bg-neutral-800 text-white font-bold'
                  : isLight
                  ? 'text-neutral-500 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              2x
            </button>
          </div>

          {/* Undistracted Play (Zen Mode) Quick Toggle */}
          <button
            type="button"
            onClick={toggleUndistractedMode}
            title={undistractedMode ? 'Exit Undistracted Mode (U)' : 'Undistracted Zen Mode (U)'}
            className={`p-1 rounded transition-colors cursor-pointer ${
              undistractedMode
                ? 'bg-emerald-500 text-black font-bold'
                : isLight
                ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            {undistractedMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          {/* Quick UI Theme Switcher (Black UI vs Light UI) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isLight ? 'Switch to Black UI' : 'Switch to White Light UI'}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900'
                : 'hover:bg-neutral-900 text-neutral-300 hover:text-white'
            }`}
          >
            {isLight ? (
              <Moon className="w-3.5 h-3.5 text-neutral-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            type="button"
            onClick={() => handleSelectNav('settings')}
            title="Settings (Theme, Graphics, Maps)"
            className={`p-1 rounded transition-colors cursor-pointer ${
              activeModal === 'settings'
                ? 'bg-emerald-500 text-black font-bold'
                : isLight
                ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onToggleDayNight}
              title={isNight ? 'Switch to daylight' : 'Switch to night'}
              className={`p-1 rounded transition-colors cursor-pointer hidden xs:block ${
                isLight
                  ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                  : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {isNight ? (
                <Moon className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            <button
              type="button"
              onClick={onResetCamera}
              title="Reset Camera View"
              className={`p-1 rounded transition-colors cursor-pointer hidden md:block ${
                isLight
                  ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                  : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute audio' : 'Mute audio'}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                  : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Dropdown Drawer for Mobile / Tablet screens */}
      {mobileMenuOpen && (
        <div
          ref={menuRef}
          className={`lg:hidden px-3 py-2 border-t shadow-2xl animate-in slide-in-from-top-2 duration-150 ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-900'
              : 'bg-neutral-950 border-neutral-800 text-white'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-1.5 mb-2 border-b ${
              isLight ? 'border-neutral-200' : 'border-neutral-800'
            }`}
          >
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                isLight ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            >
              City Management Panels
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-0.5 cursor-pointer ${
                isLight
                  ? 'text-neutral-400 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {navItems.map((item) => {
              const isActive = activeModal === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all cursor-pointer border ${
                    isActive
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-500 shadow-xs'
                      : isLight
                      ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                      : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border-neutral-800'
                  }`}
                >
                  <item.icon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight truncate">{item.label}</div>
                    <div className={`text-[9px] leading-tight truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Quick Camera Reset inside mobile menu */}
            <button
              type="button"
              onClick={() => {
                onResetCamera();
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all cursor-pointer border sm:hidden ${
                isLight
                  ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                  : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border-neutral-800'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-sky-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold leading-tight">Reset View</div>
                <div className={`text-[9px] leading-tight ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Center camera
                </div>
              </div>
            </button>
          </div>

          {/* Theme & Zen Mode switches in Mobile Menu */}
          <div
            className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
              isLight ? 'border-neutral-200 text-neutral-600' : 'border-neutral-800 text-neutral-400'
            }`}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer font-medium ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white'
              }`}
            >
              {isLight ? <Moon className="w-3 h-3 text-neutral-700" /> : <Sun className="w-3 h-3 text-amber-400" />}
              <span>Theme: {theme === 'black' ? 'Black UI' : 'White UI'}</span>
            </button>

            <button
              type="button"
              onClick={toggleUndistractedMode}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer font-medium ${
                undistractedMode
                  ? 'bg-emerald-500 text-black font-bold border-emerald-400'
                  : isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
              }`}
            >
              {undistractedMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>Zen Mode: {undistractedMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
