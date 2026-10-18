import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Crosshair,
  Flag,
  DollarSign,
  Radio,
  Swords,
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  Wrench,
  Hammer,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { DefenseStatus } from '../types/city';
import { soundEngine } from '../audio/soundEngine';

interface DefenseModalProps {
  status: DefenseStatus;
  treasury: number;
  onClose: () => void;
  onSurrender: () => void;
  onTriggerEarlyWave: () => void;
  onSelectDefenseTool: (toolType: 'defense_tower' | 'army_barracks' | 'toll_booth') => void;
  onRepairAll?: () => void;
  isLight: boolean;
}

export const DefenseModal: React.FC<DefenseModalProps> = ({
  status,
  treasury,
  onClose,
  onSurrender,
  onTriggerEarlyWave,
  onSelectDefenseTool,
  onRepairAll,
  isLight,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-neutral-900 border-neutral-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            status.waveActive
              ? 'bg-red-600 text-white border-red-700'
              : isLight
              ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
              : 'bg-neutral-950 border-neutral-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                status.waveActive ? 'bg-red-800 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                City Defense Command & Radar
              </h3>
              <p className="text-[11px] opacity-80">
                {status.waveActive
                  ? `🚨 CITY LOCKDOWN ACTIVE · WAVE ${status.waveNumber}`
                  : `Highway Defense Radar · Wave ${status.waveNumber + 1} inbound`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Wave Status Hero Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
              status.waveActive
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : isLight
                ? 'bg-neutral-100 border-neutral-250 text-neutral-800'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>
                  {status.waveActive ? 'Active Hostile Incursion' : 'Highway Early Warning Radar'}
                </span>
              </span>
              <span className="font-mono font-bold text-xs">
                {status.waveActive
                  ? `${status.raidersRemaining} / ${status.totalRaidersInWave} Hostiles Left`
                  : `Inbound in ${Math.ceil(status.waveTimer)}s`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-current/10">
              <div className="p-2 rounded bg-black/20">
                <span className="block text-[10px] opacity-75">Victory Defense Bounty</span>
                <span className="font-mono font-extrabold text-emerald-400 text-xs flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  +${status.victoryReward.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded bg-black/20">
                <span className="block text-[10px] opacity-75">Surrender Indemnity Fee</span>
                <span className="font-mono font-extrabold text-amber-400 text-xs flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  -${status.surrenderPenalty.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            {!status.waveActive ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playAlert();
                  onTriggerEarlyWave();
                  onClose();
                }}
                className="mt-1 w-full py-2 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Swords className="w-4 h-4" />
                <span>Trigger Next Wave Now (Test Defenses)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playAlert();
                  onSurrender();
                  onClose();
                }}
                className="mt-1 w-full py-2 bg-amber-600 hover:bg-amber-500 active:scale-98 text-black font-extrabold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Flag className="w-4 h-4" />
                <span>Surrender Wave & Pay Indemnity (${status.surrenderPenalty.toLocaleString()})</span>
              </button>
            )}
          </div>

          {/* City Infrastructure Damage & Public Works Repairs Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
              status.currentRepairCost > 0
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : isLight
                ? 'bg-neutral-100 border-neutral-250 text-neutral-800'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs text-amber-400">
                <Wrench className="w-4 h-4" />
                <span>City Infrastructure & Damage Control</span>
              </span>
              <span className="font-mono font-bold text-xs">
                {status.damagedBuildingsCount > 0
                  ? `${status.damagedBuildingsCount} Buildings Damaged`
                  : 'All Structures 100%'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-current/10">
              <div className="p-2 rounded bg-black/20">
                <span className="block text-[10px] opacity-75">Cumulative Raid Damage</span>
                <span className="font-mono font-extrabold text-amber-300 text-xs flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  ${status.totalDamageIncurred.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded bg-black/20">
                <span className="block text-[10px] opacity-75">Current Repair Cost Bill</span>
                <span className={`font-mono font-extrabold text-xs flex items-center gap-0.5 ${
                  status.currentRepairCost > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <DollarSign className="w-3.5 h-3.5" />
                  ${status.currentRepairCost.toLocaleString()}
                </span>
              </div>
            </div>

            {status.currentRepairCost > 0 ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playRepair();
                  if (onRepairAll) onRepairAll();
                }}
                className="mt-1 w-full py-2 bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-extrabold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Hammer className="w-4 h-4" />
                <span>Authorize Public Works Repair (${status.currentRepairCost.toLocaleString()})</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All municipal buildings and utilities are operating at full 100% structural integrity.</span>
              </div>
            )}
          </div>

          {/* Defense Fortifications Overview */}
          <div>
            <h4 className="font-extrabold text-xs mb-2 uppercase tracking-wider text-neutral-400">
              City Defense Grid & Checkpoints
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Defense Turrets */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-neutral-50 border-neutral-250' : 'bg-neutral-950/60 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Crosshair className="w-4 h-4 text-cyan-500" />
                    <span className="font-mono font-black text-sm text-cyan-500">
                      {status.totalTowers}
                    </span>
                  </div>
                  <span className="font-bold block text-xs">Defense Turrets</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Reinforced concrete bunker with rotating autocannons. Fires lasers & bullets at incoming raiders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDefenseTool('defense_tower');
                    onClose();
                  }}
                  className="mt-2.5 w-full py-1 bg-cyan-700/80 hover:bg-cyan-600 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                >
                  Deploy ($12k)
                </button>
              </div>

              {/* Army Barracks */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-neutral-50 border-neutral-250' : 'bg-neutral-950/60 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono font-black text-sm text-emerald-500">
                      {status.totalBarracks}
                    </span>
                  </div>
                  <span className="font-bold block text-xs">Army Barracks</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Military base with helipad & vehicles. Deploys armed militia squads & patrol humvees to intercept.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDefenseTool('army_barracks');
                    onClose();
                  }}
                  className="mt-2.5 w-full py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                >
                  Deploy ($15k)
                </button>
              </div>

              {/* Toll Plazas */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isLight ? 'bg-neutral-50 border-neutral-250' : 'bg-neutral-950/60 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span className="font-mono font-black text-sm text-amber-500">
                      {status.totalTollBooths}
                    </span>
                  </div>
                  <span className="font-bold block text-xs">Toll Checkpoints</span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Canopied toll plaza that collects $5 per car in peace, and lowers armored barrier gates during raid.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDefenseTool('toll_booth');
                    onClose();
                  }}
                  className="mt-2.5 w-full py-1 bg-amber-700/80 hover:bg-amber-600 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                >
                  Place ($150)
                </button>
              </div>
            </div>
          </div>

          {/* Strategy Tip */}
          <div
            className={`p-2.5 rounded-lg border text-[11px] ${
              isLight ? 'bg-amber-50 border-amber-250 text-amber-900' : 'bg-amber-950/30 border-amber-700/40 text-amber-200'
            }`}
          >
            <span className="font-bold">💡 Tower Defense Strategy:</span> Build Toll Booths and Defense Turrets along the main highway corridor leading from the highway entrance. When raiders enter, the toll booth barriers will slow them down while your towers and militia take them out!
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-4 py-2.5 border-t flex items-center justify-between ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <span>Treasury:</span>
            <span className="font-mono font-bold text-emerald-400">
              ${treasury.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 font-semibold rounded-lg text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
