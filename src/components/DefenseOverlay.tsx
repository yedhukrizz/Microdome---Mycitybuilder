import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  DollarSign,
  Radio,
  Flag,
  Crosshair,
  Zap,
  CheckCircle2,
  X,
  Swords,
  ChevronRight,
  TrendingDown,
  Layers,
  Wrench,
  Hammer,
} from 'lucide-react';
import { DefenseStatus } from '../types/city';
import { soundEngine } from '../audio/soundEngine';

interface DefenseOverlayProps {
  status: DefenseStatus;
  treasury: number;
  onSurrender: () => void;
  onTriggerEarlyWave: () => void;
  onSelectDefenseTool: (toolType: 'defense_tower' | 'army_barracks' | 'toll_booth') => void;
  onCloseResultBanner?: () => void;
  onRepairAll?: () => void;
  isLight: boolean;
}

export const DefenseOverlay: React.FC<DefenseOverlayProps> = ({
  status,
  treasury,
  onSurrender,
  onTriggerEarlyWave,
  onSelectDefenseTool,
  onCloseResultBanner,
  onRepairAll,
  isLight,
}) => {
  const [confirmSurrender, setConfirmSurrender] = useState(false);

  // 1. WAVE WARNING BANNER (Radar alert when wave arrives in <= 15s)
  if (status.waveWarningActive && !status.waveActive) {
    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl animate-bounce-short">
        <div
          className={`rounded-xl border p-3 shadow-2xl backdrop-blur-md transition-all ${
            isLight
              ? 'bg-amber-500/95 border-amber-600 text-neutral-900 shadow-amber-500/20'
              : 'bg-amber-950/95 border-amber-500/80 text-white shadow-amber-950/40'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-md animate-pulse">
                <Radio className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-amber-200">
                    Hostile Raid Detected
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-400/30 text-amber-100 border border-amber-300/40">
                    Arriving in {Math.ceil(status.waveTimer)}s
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-amber-100/90 font-medium">
                  Convoy entering from <span className="font-bold underline">Highway Entrance</span>! Place Defense Towers, Army Barracks or Toll Checkpoints!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playAlert();
                  onTriggerEarlyWave();
                }}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
                title="Start the wave immediately without waiting"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Start Now</span>
              </button>
            </div>
          </div>

          {/* Quick Defense Deployment Shortcut Pills */}
          <div className="mt-2.5 pt-2 border-t border-amber-400/20 flex items-center justify-between gap-1 text-[11px]">
            <span className="text-[10px] uppercase font-bold text-amber-200/80">Quick Place:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => onSelectDefenseTool('defense_tower')}
                className="px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-amber-400/30"
              >
                <Crosshair className="w-3 h-3 text-cyan-400" />
                <span>Turret ($12k)</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectDefenseTool('army_barracks')}
                className="px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-amber-400/30"
              >
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Barracks ($15k)</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectDefenseTool('toll_booth')}
                className="px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-amber-400/30"
              >
                <Layers className="w-3 h-3 text-amber-300" />
                <span>Toll ($150)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CITY LOCKDOWN & BATTLE HUD
  if (status.waveActive) {
    const total = Math.max(1, status.totalRaidersInWave);
    const left = status.raidersRemaining;
    const progressPercent = Math.max(0, Math.min(100, ((total - left) / total) * 100));

    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl">
        <div
          className={`rounded-2xl border-2 p-3 shadow-2xl backdrop-blur-xl transition-all ${
            isLight
              ? 'bg-red-700/95 border-red-500 text-white shadow-red-700/30'
              : 'bg-neutral-950/95 border-red-600/90 text-white shadow-red-950/60'
          }`}
        >
          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wider uppercase text-red-200 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                  City Lockdown Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase bg-red-900/80 border border-red-400 text-red-200">
                  Wave {status.waveNumber}
                </span>
              </div>
            </div>

            {/* Victory Bounty at Stake */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span>Bounty: +${status.victoryReward.toLocaleString()}</span>
            </div>

            {/* Surrender Button (Direct request: "If we loose or surrender means we have to give money") */}
            <div>
              {!confirmSurrender ? (
                <button
                  type="button"
                  onClick={() => setConfirmSurrender(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1 hover:border-red-300"
                  title="Surrender to hostile militia and pay indemnity fee"
                >
                  <Flag className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Surrender (${status.surrenderPenalty.toLocaleString()})</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                  <span className="text-[10px] text-red-200 font-bold hidden xs:inline">
                    Pay ${status.surrenderPenalty.toLocaleString()}?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playAlert();
                      onSurrender();
                      setConfirmSurrender(false);
                    }}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded text-xs transition-colors cursor-pointer"
                  >
                    Confirm Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmSurrender(false)}
                    className="px-1.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Raider Health & Progress Bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-bold flex items-center gap-1 text-red-100">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Hostiles Remaining: <span className="font-black text-amber-300">{left}</span> / {total}</span>
              </span>
              <span className="text-[10px] text-red-200 font-semibold">
                Defense Towers & Militia Engaging
              </span>
            </div>

            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-red-500/40 p-0.5">
              <div
                className="h-full bg-linear-to-r from-red-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Live Building Damage & Emergency Repair Bar */}
          {status.totalDamageIncurred > 0 && (
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-amber-200">
                  Damage Incurred: <strong className="font-mono text-white">${status.totalDamageIncurred.toLocaleString()}</strong>
                  {status.damagedBuildingsCount > 0 && (
                    <span className="opacity-80 ml-1">({status.damagedBuildingsCount} structures damaged)</span>
                  )}
                </span>
              </div>

              {status.currentRepairCost > 0 && onRepairAll && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playRepair();
                    onRepairAll();
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Repair all damaged and burning city buildings"
                >
                  <Hammer className="w-3 h-3" />
                  <span>Repair All (${status.currentRepairCost.toLocaleString()})</span>
                </button>
              )}
            </div>
          )}

          {/* Active Defense Stats Sub-strip */}
          <div className="mt-2 pt-2 border-t border-red-500/30 flex items-center justify-between text-[11px] text-red-100/90 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-cyan-300" />
                <span>{status.totalTowers} Turrets</span>
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-300" />
                <span>{status.totalBarracks} Barracks</span>
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-300" />
                <span>{status.totalTollBooths} Toll Plazas</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectDefenseTool('defense_tower')}
                className="text-[10px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
              >
                +Deploy Turret
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. POST-WAVE RESULT BANNER (VICTORY OR SURRENDER INDEMNITY PAID)
  if (status.lastWaveResult) {
    const isVictory = status.lastWaveResult === 'victory';

    return (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in zoom-in-95">
        <div
          className={`rounded-2xl border-2 p-3.5 shadow-2xl backdrop-blur-xl ${
            isVictory
              ? 'bg-emerald-900/95 border-emerald-400 text-white shadow-emerald-900/40'
              : 'bg-rose-950/95 border-rose-500 text-white shadow-rose-950/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-2 rounded-xl text-white shadow-md ${
                  isVictory ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isVictory ? <CheckCircle2 className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>

              <div>
                <h4 className="font-black text-sm tracking-wide">
                  {isVictory
                    ? '🛡️ Wave Successfully Repelled!'
                    : status.lastWaveResult === 'defeat'
                    ? '💥 City Defenses Overrun!'
                    : '🏳️ Indemnity Paid to Raiders'}
                </h4>
                <p className="text-xs mt-0.5 text-neutral-200">
                  {isVictory
                    ? `City defended! You earned a victory bounty of $${status.lastWaveAmount.toLocaleString()} into the treasury.`
                    : status.lastWaveResult === 'defeat'
                    ? `Raiders breached your downtown defenses and looted $${status.lastWaveAmount.toLocaleString()}! Rebuild your defense towers.`
                    : `Wave ended via indemnity. Paid $${status.lastWaveAmount.toLocaleString()} to raiders. Next wave in ${Math.ceil(
                        status.waveTimer
                      )}s.`}
                </p>

                {/* Damage & Repair Bill Report */}
                <div className="mt-2.5 pt-2 border-t border-white/20 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-neutral-200">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-amber-300" />
                      <span>Raid Damage Inflicted:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-200">
                      ${status.totalDamageIncurred.toLocaleString()}
                    </span>
                  </div>

                  {status.currentRepairCost > 0 ? (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-rose-300 font-medium">
                        {status.damagedBuildingsCount} damaged ({status.burningBuildingsCount > 0 ? `${status.burningBuildingsCount} on fire` : 'needs repair'})
                      </span>
                      {onRepairAll && (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playRepair();
                            onRepairAll();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          <span>Repair ($ {status.currentRepairCost.toLocaleString()})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-300 flex items-center gap-1 mt-0.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>All buildings intact (100% Structural Integrity)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {onCloseResultBanner && (
              <button
                type="button"
                onClick={onCloseResultBanner}
                className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
